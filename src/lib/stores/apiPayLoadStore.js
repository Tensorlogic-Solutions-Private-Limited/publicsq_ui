import { writable, derived, get } from 'svelte/store';

// Create the main store
const createApiPayloadStore = () => {
  const { subscribe, set, update } = writable({
    is_ai_selected: false,
    exam_name: '',
    exam_type_code: '1000', // Default value
    subject_code: '',
    medium_code: '',
    exam_mode: 'online',
    total_time: 40,
    total_questions: 40,
    no_of_versions: 1,
    no_of_sets: 1,
    standard: '',
    qtn_codes_to_exclude: [],
    chapters_topics: []
  });

  return {
    subscribe,
    set,
    update,

    // Update basic exam details
    updateExamDetails: (data) => {
      update(store => ({
        ...store,
        exam_name: data.examTitle || store.exam_name,
        exam_mode: (data.examMode || store.exam_mode).toLowerCase(),
        exam_type_code: data.exam_type_code || store.exam_type_code
      }));
    },

    // Update exam configuration
    updateExamConfig: (data) => {
      update(store => ({
        ...store,
        total_time: data.totalTime || store.total_time,
        total_questions: data.totalQuestions || store.total_questions,
        no_of_versions: data.numberOfVersions || store.no_of_versions,
        no_of_sets: data.numberOfSets || store.no_of_sets
      }));
    },

    // Update class and subject info
    updateClassSubject: (data) => {
      update(store => ({
        ...store,
        subject_code: data.subject_code || store.subject_code,
        medium_code: data.medium_code || store.medium_code,
        standard: data.examClass || store.standard
      }));
    },

    // Update AI selection mode
    updateAIMode: (isAI) => {
      update(store => ({
        ...store,
        is_ai_selected: isAI
      }));
    },

    // Add excluded questions
    updateExcludedQuestions: (excludedQuestionIds) => {
      update(store => {
        const updatedStore = {
          ...store,
          qtn_codes_to_exclude: excludedQuestionIds || []
        };
        
        console.log('API Store - Updated excluded questions:', excludedQuestionIds);
        console.log('Updated store:', updatedStore);
        
        return updatedStore;
      });
    },

    //  NEW: Build chapters_topics from selected content with question allocations
    buildChaptersTopics: (chapters, topics) => {
      console.log('Building chapters_topics with:', { chapters, topics });
      
      const chaptersTopics = [];

      // Process chapters if any exist
      if (chapters && chapters.length > 0) {
        const chapterCodes = chapters
          .filter(chapter => chapter.questionsToAdd && chapter.questionsToAdd > 0)
          .map(chapter => ({
            code: chapter.code,
            qn_count: parseInt(chapter.questionsToAdd) || 0
          }));

        if (chapterCodes.length > 0) {
          chaptersTopics.push({
            type: 'chapter',
            codes: chapterCodes
          });
        }
      }

      // Process topics if any exist
      if (topics && topics.length > 0) {
        const topicCodes = topics
          .filter(topic => topic.questionsToAdd && topic.questionsToAdd > 0)
          .map(topic => ({
            code: topic.code,
            qn_count: parseInt(topic.questionsToAdd) || 0
          }));

        if (topicCodes.length > 0) {
          chaptersTopics.push({
            type: 'topic',
            codes: topicCodes
          });
        }
      }

      update(store => ({
        ...store,
        chapters_topics: chaptersTopics
      }));

      console.log('Built chapters_topics:', chaptersTopics);
      return chaptersTopics;
    },

    //  NEW: Update chapters_topics from allocation confirmation
    updateFromAllocationData: (allocationData) => {
      if (!allocationData) {
        console.warn('No allocation data provided');
        return;
      }

      console.log('Updating API store from allocation data:', allocationData);
      
      update(store => {
        // Build chapters_topics from allocation data
        const chaptersTopics = [];
        const chaptersMap = new Map();
        const topicsMap = new Map();

        if (allocationData.selectedItems && Array.isArray(allocationData.selectedItems)) {
          allocationData.selectedItems.forEach(item => {
            if (item.type === 'chapter') {
              if (!chaptersMap.has('chapters')) {
                chaptersMap.set('chapters', {
                  type: 'chapter', 
                  codes: []
                });
              }
              
              const chapterEntry = { code: item.code };
              
              // Only include qn_count if NOT using AI and questionsToAdd > 0
              if (!store.is_ai_selected && item.questionsToAdd > 0) {
                chapterEntry.qn_count = item.questionsToAdd;
              }
              
              chaptersMap.get('chapters').codes.push(chapterEntry);
            } else if (item.type === 'topic' || item.type === 'subtopic') {
              if (!topicsMap.has('topics')) {
                topicsMap.set('topics', {
                  type: 'topic',
                  codes: []
                });
              }
              
              const topicEntry = { code: item.code };
              
              // Only include qn_count if NOT using AI and questionsToAdd > 0
              if (!store.is_ai_selected && item.questionsToAdd > 0) {
                topicEntry.qn_count = item.questionsToAdd;
              }
              
              topicsMap.get('topics').codes.push(topicEntry);
            }
          });
        }

        // Convert to array
        chaptersMap.forEach(value => {
          if (value.codes.length > 0) {
            chaptersTopics.push(value);
          }
        });

        topicsMap.forEach(value => {
          if (value.codes.length > 0) {
            chaptersTopics.push(value);
          }
        });

        const updatedStore = {
          ...store,
          chapters_topics: chaptersTopics
        };

        console.log('Updated API store with allocation data:', updatedStore);
        return updatedStore;
      });
    },

    // Get the complete API payload
    getApiPayload: () => {
      const storeData = get({ subscribe });
      
      // Validate required fields
      const requiredFields = {
        exam_name: storeData.exam_name,
        subject_code: storeData.subject_code,
        medium_code: storeData.medium_code,
        standard: storeData.standard
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return {
          isValid: false,
          errors: missingFields.map(field => `${field} is required`),
          payload: null
        };
      }

      if (!storeData.chapters_topics || storeData.chapters_topics.length === 0) {
        console.error('No chapters_topics data available');
        return {
          isValid: false,
          errors: ['Chapter/topic selections are required'],
          payload: null
        };
      }

      // Return valid payload
      return {
        isValid: true,
        errors: [],
        payload: {
          is_ai_selected: storeData.is_ai_selected,
          exam_name: storeData.exam_name.trim(),
          exam_type_code: storeData.exam_type_code,
          subject_code: storeData.subject_code,
          medium_code: storeData.medium_code,
          exam_mode: storeData.exam_mode,
          total_time: parseInt(storeData.total_time),
          total_questions: parseInt(storeData.total_questions),
          no_of_versions: parseInt(storeData.no_of_versions),
          no_of_sets: parseInt(storeData.no_of_sets),
          standard: storeData.standard,
          ...(storeData.qtn_codes_to_exclude.length > 0 && {
            qtn_codes_to_exclude: storeData.qtn_codes_to_exclude
          }),
          chapters_topics: storeData.chapters_topics
        }
      };
    },

    // Reset the store
    reset: () => {
      set({
        is_ai_selected: false,
        exam_name: '',
        exam_type_code: '1000',
        subject_code: '',
        medium_code: '',
        exam_mode: 'online',
        total_time: 40,
        total_questions: 40,
        no_of_versions: 1,
        no_of_sets: 1,
        standard: '',
        qtn_codes_to_exclude: [],
        chapters_topics: []
      });
    },

    // Debug method
    debug: () => {
      const storeData = get({ subscribe });
      console.log('🔍 API Payload Store Debug:', storeData);
      return storeData;
    }
  };
};

export const apiPayloadStore = createApiPayloadStore();