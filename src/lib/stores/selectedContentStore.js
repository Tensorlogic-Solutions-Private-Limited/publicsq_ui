import { writable } from 'svelte/store';

function createSelectedContentStore() {
  const { subscribe, set, update } = writable({
    // Hierarchical structure: chapters -> topics -> subtopics
    hierarchy: new Map(), // Map<chapterCode, ChapterData>
    // Flat list for easy access and backward compatibility
    selections: [],
    // Add questions property for backward compatibility
    questions: [],
    // Removed questions array
    removedQuestions: [], // Add this line
    // Quick lookup maps
    chapterMap: new Map(),
    topicMap: new Map(),
    subtopicMap: new Map(),
    // Statistics
    stats: {
      totalChapters: 0,
      totalTopics: 0,
      totalSubtopics: 0,
      totalQuestions: 0
    },
    // Add chapter metadata storage
    chapterMetadata: new Map() // Store chapter info even when not selected
  });

  return {
    subscribe,

    // Add a selection (chapter, topic, or subtopic)
    addSelection: (selectionData, parentData = null) => {
      update(store => {
        const { type, code, name, question_count = 0, parent_code = null } = selectionData;
        
        // Create the selection object
        const selection = {
          code,
          name,
          type,
          question_count,
          parent_code,
          isSelected: true,
          children: new Map(),
          // Additional metadata
          selectedAt: new Date().toISOString(),
          questionsToAdd: getDefaultQuestionsToAdd(type, question_count)
        };

        if (type === 'chapter') {
          return addChapter(store, selection);
        } else if (type === 'topic') {
          return addTopic(store, selection, parentData);
        } else if (type === 'subtopic') {
          return addSubtopic(store, selection, parentData);
        }

        return store;
      });
    },

    // Remove a selection and all its children
    removeSelection: (code) => {
      update(store => {
        return removeSelectionRecursive(store, code);
      });
    },

    // ✅ FIXED: Consolidated updateQuestionCount method
    updateQuestionCount: (code, questionCount) => {
      update(store => {
        console.log(`Store: Updating ${code} questionsToAdd to ${questionCount}`);
        
        // Helper function to update an item in a Map
        const updateInMap = (map, code, questionCount) => {
          if (map && map.has(code)) {
            const item = map.get(code);
            item.questionsToAdd = questionCount;
            map.set(code, item);
            console.log(`Updated in map: ${code} -> ${questionCount}`);
            return true;
          }
          return false;
        };

        // Helper function to update an item recursively in hierarchy
        const updateInHierarchy = (hierarchyMap, code, questionCount) => {
          for (const [key, item] of hierarchyMap) {
            if (item.code === code) {
              item.questionsToAdd = questionCount;
              hierarchyMap.set(key, item);
              console.log(`Updated in hierarchy: ${code} -> ${questionCount}`);
              return true;
            }
            
            // Check children if they exist
            if (item.children && item.children instanceof Map) {
              if (updateInHierarchy(item.children, code, questionCount)) {
                hierarchyMap.set(key, item); // Update parent
                return true;
              }
            }
          }
          return false;
        };

        // Try updating in different maps
        let updated = false;
        
        // Update in hierarchy (main structure)
        if (store.hierarchy instanceof Map) {
          updated = updateInHierarchy(store.hierarchy, code, questionCount) || updated;
        }

        // Update in individual maps as backup
        ['chapterMap', 'topicMap', 'subtopicMap'].forEach(mapName => {
          if (store[mapName] instanceof Map) {
            updated = updateInMap(store[mapName], code, questionCount) || updated;
          }
        });

        if (!updated) {
          console.warn(`Could not find item with code ${code} to update`);
        }

        return { ...store };
      });
    },

    // Add/update questions (for MockQuestionsTable compatibility)
    setQuestions: (questions) => {
      update(store => {
        store.questions = questions || [];
        return store;
      });
    },

    // Add a single question
    addQuestion: (question) => {
      update(store => {
        store.questions.push(question);
        return store;
      });
    },

    // Remove a question by ID
    removeQuestion: (questionId) => {
    update(store => {
      console.log('Removing question from store:', questionId);
      store.questions = store.questions.filter(q => q.id !== questionId);
      
      // Also update any excluded questions tracking
      if (!store.excludedQuestions) {
        store.excludedQuestions = [];
      }
      
      if (!store.excludedQuestions.includes(questionId)) {
        store.excludedQuestions.push(questionId);
      }
      
      console.log('Updated store after question removal:', store);
      return store;
    });
  },

  getExcludedQuestions: () => {
    let result = [];
    subscribe(store => {
      result = store.excludedQuestions || [];
    })();
    return result;
  },

    // Update a question
    updateQuestion: (questionId, updates) => {
      update(store => {
        const questionIndex = store.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
          store.questions[questionIndex] = { ...store.questions[questionIndex], ...updates };
        }
        return store;
      });
    },

    // Get hierarchy for a specific chapter
    getChapterHierarchy: (chapterCode) => {
      let result = null;
      subscribe(store => {
        result = store.hierarchy.get(chapterCode) || null;
      })();
      return result;
    },

    // Get all selected items in hierarchical format
    getHierarchy: () => {
      let result = [];
      subscribe(store => {
        result = Array.from(store.hierarchy.values());
      })();
      return result;
    },

    // Get flat list of selections (backward compatibility)
    getSelections: () => {
      let result = [];
      subscribe(store => {
        result = store.selections;
      })();
      return result;
    },

    // Get questions (for MockQuestionsTable compatibility)
    getQuestions: () => {
      let result = [];
      subscribe(store => {
        result = store.questions;
      })();
      return result;
    },

    // Get statistics
    getStats: () => {
      let result = {};
      subscribe(store => {
        result = { ...store.stats };
      })();
      return result;
    },

    // Check if an item is selected
    isSelected: (code, type = null) => {
      let result = false;
      subscribe(store => {
        if (type === 'chapter') {
          result = store.chapterMap.has(code);
        } else if (type === 'topic') {
          result = store.topicMap.has(code);
        } else if (type === 'subtopic') {
          result = store.subtopicMap.has(code);
        } else {
          // Check all maps
          result = store.chapterMap.has(code) || 
                   store.topicMap.has(code) || 
                   store.subtopicMap.has(code);
        }
      })();
      return result;
    },

    // Check if an item is logically selected (parent selected)
    isLogicallySelected: (code, type) => {
      let result = false;
      subscribe(store => {
        if (type === 'topic') {
          // Topic is selected if topic itself is selected OR parent chapter is selected
          const topic = store.topicMap.get(code);
          if (topic) {
            result = true; // Topic is directly selected
          } else {
            // Check if parent chapter is selected
            const parentChapterCode = getParentChapterCode(code, store);
            result = store.chapterMap.has(parentChapterCode);
          }
        } else if (type === 'subtopic') {
          // Subtopic is selected if subtopic OR parent topic OR parent chapter is selected
          const subtopic = store.subtopicMap.get(code);
          if (subtopic) {
            result = true; // Subtopic is directly selected
          } else {
            // Check if parent topic is selected
            const parentTopicCode = getParentTopicCode(code, store);
            const parentChapterCode = getParentChapterCode(parentTopicCode, store);
            result = store.topicMap.has(parentTopicCode) || 
                     store.chapterMap.has(parentChapterCode);
          }
        } else {
          result = store.chapterMap.has(code);
        }
      })();
      return result;
    },

    // Clear all selections
    clearAll: () => {
      set({
        hierarchy: new Map(),
        selections: [],
        questions: [],
        removedQuestions: [], // Add this line
        chapterMap: new Map(),
        topicMap: new Map(),
        subtopicMap: new Map(),
        stats: {
          totalChapters: 0,
          totalTopics: 0,
          totalSubtopics: 0,
          totalQuestions: 0
        },
        chapterMetadata: new Map()
      });
    },

    // Bulk add selections (useful for initial load)
    bulkAddSelections: (selections) => {
      update(store => {
        selections.forEach(selection => {
          const { type } = selection;
          if (type === 'chapter') {
            store = addChapter(store, { ...selection, isSelected: true });
          } else if (type === 'topic') {
            store = addTopic(store, { ...selection, isSelected: true });
          } else if (type === 'subtopic') {
            store = addSubtopic(store, { ...selection, isSelected: true });
          }
        });
        return store;
      });
    },

    // Add a selection with context (chapter, topic, or subtopic)
    addSelectionWithContext: (selectionData, contextData = null) => {
      update(store => {
        const { type, code, name, question_count = 0, parent_code = null } = selectionData;
        
        // Create the selection object
        const selection = {
          code,
          name,
          type,
          question_count,
          parent_code,
          isSelected: true,
          children: new Map(),
          // Additional metadata
          selectedAt: new Date().toISOString(),
          questionsToAdd: getDefaultQuestionsToAdd(type, question_count)
        };

        if (type === 'chapter') {
          return addChapter(store, selection);
        } else if (type === 'topic') {
          return addTopicWithContext(store, selection, contextData);
        } else if (type === 'subtopic') {
          return addSubtopicWithContext(store, selection, contextData);
        }

        return store;
      });
    },

    // Method to store chapter metadata
    storeChapterMetadata: (chapterData) => {
      update(store => {
        store.chapterMetadata.set(chapterData.code, {
          code: chapterData.code,
          name: chapterData.name,
          question_count: chapterData.question_count || 0
        });
        return store;
      });
    },

    // Add question to removed list
    removeQuestion: (questionId) => {
      update(store => {
        const questionToRemove = store.questions.find(q => q.id === questionId);
        if (questionToRemove) {
          // Add to removed questions if not already there
          if (!store.removedQuestions.find(q => q.id === questionId)) {
            store.removedQuestions = [...store.removedQuestions, questionToRemove];
          }
          
          // Remove from active questions
          store.questions = store.questions.filter(q => q.id !== questionId);
          store.lastUpdated = new Date().toISOString();
        }
        return store;
      });
    },

    // Restore question from removed list
    restoreQuestion: (questionId) => {
      update(store => {
        const questionToRestore = store.removedQuestions.find(q => q.id === questionId);
        if (questionToRestore) {
          // Add back to active questions if not already there
          if (!store.questions.find(q => q.id === questionId)) {
            store.questions = [...store.questions, questionToRestore];
          }
          
          // Remove from removed questions
          store.removedQuestions = store.removedQuestions.filter(q => q.id !== questionId);
          store.lastUpdated = new Date().toISOString();
        }
        return store;
      });
    },

    // Permanently delete question
    permanentlyDeleteQuestion: (questionId) => {
      update(store => {
        store.removedQuestions = store.removedQuestions.filter(q => q.id !== questionId);
        store.lastUpdated = new Date().toISOString();
        return store;
      });
    },

    // Clear all removed questions
    clearRemovedQuestions: () => {
      update(store => {
        store.removedQuestions = [];
        store.lastUpdated = new Date().toISOString();
        return store;
      });
    },

    // Restore all removed questions
    restoreAllQuestions: () => {
      update(store => {
        // Add all removed questions back to active questions
        store.removedQuestions.forEach(removedQ => {
          if (!store.questions.find(q => q.id === removedQ.id)) {
            store.questions.push(removedQ);
          }
        });
        
        // Clear removed questions
        store.removedQuestions = [];
        store.lastUpdated = new Date().toISOString();
        return store;
      });
    },

    // Get removed questions
    getRemovedQuestions: () => {
      let result = [];
      subscribe(store => {
        result = store.removedQuestions || [];
      })();
      return result;
    }
  };
}

// Helper functions remain the same...
function addChapter(store, chapterData) {
  const { code } = chapterData;
  
  // Add to hierarchy
  store.hierarchy.set(code, {
    ...chapterData,
    children: new Map() // topics
  });
  
  // Add to maps
  store.chapterMap.set(code, chapterData);
  
  // Add to flat selections
  store.selections.push(chapterData);
  
  // Update stats
  store.stats.totalChapters++;
  store.stats.totalQuestions += chapterData.question_count;
  
  return store;
}

function addTopic(store, topicData, parentData = null) {
  const { code, parent_code } = topicData;
  
  // Determine parent chapter
  let parentChapterCode = parent_code;
  if (!parentChapterCode && parentData) {
    parentChapterCode = parentData.code;
  }
  
  // Ensure parent chapter exists in hierarchy (create placeholder if needed)
  if (!store.hierarchy.has(parentChapterCode)) {
    const placeholderChapter = {
      code: parentChapterCode,
      name: `Chapter ${parentChapterCode}`,
      type: 'chapter',
      question_count: 0,
      isSelected: false,
      children: new Map(),
      isPlaceholder: true
    };
    store.hierarchy.set(parentChapterCode, placeholderChapter);
  }
  
  // Add topic to parent chapter
  const parentChapter = store.hierarchy.get(parentChapterCode);
  parentChapter.children.set(code, {
    ...topicData,
    parent_code: parentChapterCode,
    children: new Map() // subtopics
  });
  
  // Add to maps
  store.topicMap.set(code, { ...topicData, parent_code: parentChapterCode });
  
  // Add to flat selections
  store.selections.push({ ...topicData, parent_code: parentChapterCode });
  
  // Update stats
  store.stats.totalTopics++;
  store.stats.totalQuestions += topicData.question_count;
  
  return store;
}

function addTopicWithContext(store, topicData, contextData = null) {
  const { code, parent_code } = topicData;
  
  // Determine parent chapter
  let parentChapterCode = parent_code;
  let parentChapterInfo = null;

  if (contextData && contextData.parentChapter) {
    parentChapterInfo = contextData.parentChapter;
    parentChapterCode = parentChapterInfo.code;
    
    // Store chapter metadata
    store.chapterMetadata.set(parentChapterCode, {
      code: parentChapterInfo.code,
      name: parentChapterInfo.name,
      question_count: parentChapterInfo.question_count || 0
    });
  }
  
  // Ensure parent chapter exists in hierarchy
  if (!store.hierarchy.has(parentChapterCode)) {
    // Use stored metadata if available
    const metadata = store.chapterMetadata.get(parentChapterCode);
    const placeholderChapter = {
      code: parentChapterCode,
      name: metadata ? metadata.name : `Chapter ${parentChapterCode}`,
      type: 'chapter',
      question_count: metadata ? metadata.question_count : 0,
      isSelected: false,
      children: new Map(),
      isPlaceholder: true
    };
    store.hierarchy.set(parentChapterCode, placeholderChapter);
  }
  
  // Add topic to parent chapter
  const parentChapter = store.hierarchy.get(parentChapterCode);
  parentChapter.children.set(code, {
    ...topicData,
    parent_code: parentChapterCode,
    children: new Map()
  });
  
  store.topicMap.set(code, { ...topicData, parent_code: parentChapterCode });
  store.selections.push({ ...topicData, parent_code: parentChapterCode });
  
  store.stats.totalTopics++;
  store.stats.totalQuestions += topicData.question_count;
  
  return store;
}

function addSubtopic(store, subtopicData, parentData = null) {
  const { code, parent_code } = subtopicData;
  
  // Determine parent topic
  let parentTopicCode = parent_code;
  if (!parentTopicCode && parentData) {
    parentTopicCode = parentData.code;
  }
  
  // Find parent topic in hierarchy
  let parentTopic = null;
  let parentChapterCode = null;
  
  // Search through all chapters to find the parent topic
  for (const [chapterCode, chapter] of store.hierarchy) {
    if (chapter.children.has(parentTopicCode)) {
      parentTopic = chapter.children.get(parentTopicCode);
      parentChapterCode = chapterCode;
      break;
    }
  }
  
  // If parent topic not found, create placeholder hierarchy
  if (!parentTopic) {
    parentChapterCode = getParentChapterCode(parentTopicCode, store) || 'unknown_chapter';
    
    // Create placeholder chapter if needed
    if (!store.hierarchy.has(parentChapterCode)) {
      const placeholderChapter = {
        code: parentChapterCode,
        name: `Chapter ${parentChapterCode}`,
        type: 'chapter',
        question_count: 0,
        isSelected: false,
        children: new Map(),
        isPlaceholder: true
      };
      store.hierarchy.set(parentChapterCode, placeholderChapter);
    }
    
    // Create placeholder topic
    const placeholderTopic = {
      code: parentTopicCode,
      name: `Topic ${parentTopicCode}`,
      type: 'topic',
      question_count: 0,
      parent_code: parentChapterCode,
      isSelected: false,
      children: new Map(),
      isPlaceholder: true
    };
    
    store.hierarchy.get(parentChapterCode).children.set(parentTopicCode, placeholderTopic);
    parentTopic = placeholderTopic;
  }
  
  // Add subtopic to parent topic
  parentTopic.children.set(code, {
    ...subtopicData,
    parent_code: parentTopicCode
  });
  
  // Add to maps
  store.subtopicMap.set(code, { ...subtopicData, parent_code: parentTopicCode });
  
  // Add to flat selections
  store.selections.push({ ...subtopicData, parent_code: parentTopicCode });
  
  // Update stats
  store.stats.totalSubtopics++;
  store.stats.totalQuestions += subtopicData.question_count;
  
  return store;
}

function addSubtopicWithContext(store, subtopicData, contextData = null) {
  const { code, parent_code } = subtopicData;
  
  let parentTopicCode = parent_code;
  let parentChapterCode = null;
  
  if (contextData) {
    if (contextData.parentTopic) {
      parentTopicCode = contextData.parentTopic.code;
    }
    if (contextData.parentChapter) {
      parentChapterCode = contextData.parentChapter.code;
      
      // Store chapter metadata
      store.chapterMetadata.set(parentChapterCode, {
        code: contextData.parentChapter.code,
        name: contextData.parentChapter.name,
        question_count: contextData.parentChapter.question_count || 0
      });
    }
  }
  
  // Find or create parent hierarchy
  let parentTopic = null;
  
  for (const [chapterCode, chapter] of store.hierarchy) {
    if (chapter.children.has(parentTopicCode)) {
      parentTopic = chapter.children.get(parentTopicCode);
      parentChapterCode = chapterCode;
      break;
    }
  }
  
  if (!parentTopic) {
    // Create placeholder hierarchy
    if (!parentChapterCode) {
      parentChapterCode = getParentChapterCode(parentTopicCode, store) || 'unknown_chapter';
    }
    
    // Create placeholder chapter if needed
    if (!store.hierarchy.has(parentChapterCode)) {
      const metadata = store.chapterMetadata.get(parentChapterCode);
      const placeholderChapter = {
        code: parentChapterCode,
        name: metadata ? metadata.name : `Chapter ${parentChapterCode}`,
        type: 'chapter',
        question_count: metadata ? metadata.question_count : 0,
        isSelected: false,
        children: new Map(),
        isPlaceholder: true
      };
      store.hierarchy.set(parentChapterCode, placeholderChapter);
    }
    
    // Create placeholder topic
    const placeholderTopic = {
      code: parentTopicCode,
      name: contextData && contextData.parentTopic ? contextData.parentTopic.name : `Topic ${parentTopicCode}`,
      type: 'topic',
      question_count: contextData && contextData.parentTopic ? contextData.parentTopic.question_count || 0 : 0,
      parent_code: parentChapterCode,
      isSelected: false,
      children: new Map(),
      isPlaceholder: true
    };
    
    store.hierarchy.get(parentChapterCode).children.set(parentTopicCode, placeholderTopic);
    parentTopic = placeholderTopic;
  }
  
  // Add subtopic to parent topic
  parentTopic.children.set(code, {
    ...subtopicData,
    parent_code: parentTopicCode
  });
  
  store.subtopicMap.set(code, { ...subtopicData, parent_code: parentTopicCode });
  store.selections.push({ ...subtopicData, parent_code: parentTopicCode });
  
  store.stats.totalSubtopics++;
  store.stats.totalQuestions += subtopicData.question_count;
  
  return store;
}

function removeSelectionRecursive(store, code) {
  // Find and remove from hierarchy
  let removed = false;
  
  // Check if it's a chapter
  if (store.hierarchy.has(code)) {
    const chapter = store.hierarchy.get(code);
    
    // Remove all children from maps and selections
    for (const [topicCode, topic] of chapter.children) {
      store.topicMap.delete(topicCode);
      store.selections = store.selections.filter(s => s.code !== topicCode);
      store.stats.totalTopics--;
      store.stats.totalQuestions -= topic.question_count;
      
      // Remove subtopics
      for (const [subtopicCode, subtopic] of topic.children) {
        store.subtopicMap.delete(subtopicCode);
        store.selections = store.selections.filter(s => s.code !== subtopicCode);
        store.stats.totalSubtopics--;
        store.stats.totalQuestions -= subtopic.question_count;
      }
    }
    
    // Remove chapter
    store.hierarchy.delete(code);
    store.chapterMap.delete(code);
    store.selections = store.selections.filter(s => s.code !== code);
    store.stats.totalChapters--;
    store.stats.totalQuestions -= chapter.question_count;
    removed = true;
  }
  
  // Check if it's a topic
  if (!removed) {
    for (const [chapterCode, chapter] of store.hierarchy) {
      if (chapter.children.has(code)) {
        const topic = chapter.children.get(code);
        
        // Remove all subtopics
        for (const [subtopicCode, subtopic] of topic.children) {
          store.subtopicMap.delete(subtopicCode);
          store.selections = store.selections.filter(s => s.code !== subtopicCode);
          store.stats.totalSubtopics--;
          store.stats.totalQuestions -= subtopic.question_count;
        }
        
        // Remove topic
        chapter.children.delete(code);
        store.topicMap.delete(code);
        store.selections = store.selections.filter(s => s.code !== code);
        store.stats.totalTopics--;
        store.stats.totalQuestions -= topic.question_count;
        removed = true;
        break;
      }
    }
  }
  
  // Check if it's a subtopic
  if (!removed) {
    for (const [chapterCode, chapter] of store.hierarchy) {
      for (const [topicCode, topic] of chapter.children) {
        if (topic.children.has(code)) {
          const subtopic = topic.children.get(code);
          
          // Remove subtopic
          topic.children.delete(code);
          store.subtopicMap.delete(code);
          store.selections = store.selections.filter(s => s.code !== code);
          store.stats.totalSubtopics--;
          store.stats.totalQuestions -= subtopic.question_count;
          removed = true;
          break;
        }
      }
      if (removed) break;
    }
  }
  
  return store;
}

function findItemInHierarchy(store, code) {
  // Search in chapters
  if (store.hierarchy.has(code)) {
    return store.hierarchy.get(code);
  }
  
  // Search in topics
  for (const chapter of store.hierarchy.values()) {
    if (chapter.children.has(code)) {
      return chapter.children.get(code);
    }
    
    // Search in subtopics
    for (const topic of chapter.children.values()) {
      if (topic.children.has(code)) {
        return topic.children.get(code);
      }
    }
  }
  
  return null;
}

function getParentChapterCode(itemCode, store) {
  // Try to find in existing hierarchy
  for (const [chapterCode, chapter] of store.hierarchy) {
    if (chapter.children.has(itemCode)) {
      return chapterCode;
    }
  }
  
  // Fallback: infer from code structure
  if (itemCode.includes('_')) {
    return itemCode.split('_')[0];
  }
  
  return null;
}

function getParentTopicCode(itemCode, store) {
  // Try to find in existing hierarchy
  for (const chapter of store.hierarchy.values()) {
    for (const [topicCode, topic] of chapter.children) {
      if (topic.children.has(itemCode)) {
        return topicCode;
      }
    }
  }
  
  // Fallback: infer from code structure
  if (itemCode.includes('_')) {
    const parts = itemCode.split('_');
    if (parts.length >= 2) {
      return parts.slice(0, 2).join('_');
    }
  }
  
  return null;
}

function getDefaultQuestionsToAdd(type, questionCount) {
  switch (type) {
    case 'chapter':
      return Math.min(8, questionCount);
    case 'topic':
      return Math.min(4, questionCount);
    case 'subtopic':
      return Math.min(2, questionCount);
    default:
      return 0;
  }
}

export const selectedContentStore = createSelectedContentStore();