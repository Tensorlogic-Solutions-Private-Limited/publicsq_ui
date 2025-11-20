<script>
  import { onMount } from 'svelte';
  import api from '$lib/utils/api.js';

  export let quizConfig = {};
  export let title = 'Selected Items';
  export let showQuestionCounts = true;
  export let selectable = false;
  export let selectedCodes = [];

  // Data
  let chaptersTopics = [];
  let loading = false;
  let error = '';

  // Filtered and organized data
  let displayData = [];

  onMount(async () => {
    if (quizConfig.standard && quizConfig.subject_code && quizConfig.medium_code) {
      await loadChaptersTopics();
    }
  });

  async function loadChaptersTopics() {
    try {
      loading = true;
      error = '';
      
      const response = await api.chapterTopics.getAll({
        standard: quizConfig.standard,
        medium_code: quizConfig.medium_code,
        subject_code: quizConfig.subject_code
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      // Handle nested data structure
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        chaptersTopics = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        chaptersTopics = response.data;
      } else {
        chaptersTopics = [];
      }
      
      organizeDisplayData();
      
    } catch (err) {
      console.error('Error loading chapters/topics:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function organizeDisplayData() {
    const selectedCodesSet = new Set(quizConfig.selected_codes || selectedCodes);
    
    if (quizConfig.chapter_topic_type === 'chapter') {
      // Filter and show only selected chapters
      displayData = chaptersTopics
        .filter(chapter => selectedCodesSet.has(chapter.code || chapter.chapter_code))
        .map(chapter => ({
          id: chapter.code || chapter.chapter_code,
          name: chapter.name || chapter.chapter_name,
          question_count: chapter.question_count || 0,
          type: 'chapter',
          children: chapter.topics || []
        }));
    } else {
      // Show chapters with their selected topics
      displayData = [];
      
      chaptersTopics.forEach(chapter => {
        const selectedTopics = (chapter.topics || []).filter(topic => 
          selectedCodesSet.has(topic.code || topic.topic_code)
        );
        
        if (selectedTopics.length > 0) {
          displayData.push({
            id: chapter.code || chapter.chapter_code,
            name: chapter.name || chapter.chapter_name,
            question_count: chapter.question_count || 0,
            type: 'chapter',
            children: selectedTopics.map(topic => ({
              id: topic.code || topic.topic_code,
              name: topic.name || topic.topic_name,
              question_count: topic.question_count || 0,
              type: 'topic',
              selected: true
            }))
          });
        }
      });
    }
  }

  function handleSelection(id) {
    if (!selectable) return;
    
    if (selectedCodes.includes(id)) {
      selectedCodes = selectedCodes.filter(code => code !== id);
    } else {
      selectedCodes = [...selectedCodes, id];
    }
  }

  function getTotalQuestions() {
    return displayData.reduce((total, item) => {
      if (quizConfig.chapter_topic_type === 'chapter') {
        return total + item.question_count;
      } else {
        return total + item.children.reduce((childTotal, child) => 
          childTotal + child.question_count, 0
        );
      }
    }, 0);
  }

  // Reactive statements
  $: if (quizConfig.selected_codes || selectedCodes) {
    organizeDisplayData();
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg">
  <!-- Header -->
  <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-900">{title}</h3>
      {#if showQuestionCounts && displayData.length > 0}
        <span class="text-xs text-gray-500">
          Total: {getTotalQuestions()} questions
        </span>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="max-h-64 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center py-6">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
        <span class="text-sm text-gray-600">Loading...</span>
      </div>
    {:else if error}
      <div class="p-4 text-center text-red-600 text-sm">
        Error: {error}
      </div>
    {:else if displayData.length === 0}
      <div class="p-4 text-center text-gray-500 text-sm">
        No {quizConfig.chapter_topic_type}s selected
      </div>
    {:else}
      <div class="divide-y divide-gray-100">
        {#each displayData as item, index}
          <div class="p-3">
            <!-- Chapter/Main Item -->
            <div 
              class="flex items-center justify-between p-2 rounded-md 
                {selectable ? 'cursor-pointer hover:bg-gray-50' : ''} 
                {quizConfig.chapter_topic_type === 'chapter' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}"
              on:click={() => selectable && quizConfig.chapter_topic_type === 'chapter' && handleSelection(item.id)}
            >
              <div class="flex items-center min-w-0 flex-1">
                {#if selectable && quizConfig.chapter_topic_type === 'chapter'}
                  <input
                    type="checkbox"
                    checked={selectedCodes.includes(item.id)}
                    on:change={() => handleSelection(item.id)}
                    class="mr-3 text-blue-600"
                  />
                {/if}
                <div class="min-w-0 flex-1">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm font-medium text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  {#if showQuestionCounts}
                    <p class="text-xs text-gray-500 ml-6">
                      {item.question_count} questions
                    </p>
                  {/if}
                </div>
              </div>
              
              {#if quizConfig.chapter_topic_type === 'chapter'}
                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Chapter
                </span>
              {:else if item.children.length > 0}
                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {item.children.length} topic{item.children.length > 1 ? 's' : ''}
                </span>
              {/if}
            </div>

            <!-- Topics (for topic selection mode) -->
            {#if quizConfig.chapter_topic_type === 'topic' && item.children.length > 0}
              <div class="ml-6 mt-2 space-y-1">
                {#each item.children as topic}
                  <div 
                    class="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200
                      {selectable ? 'cursor-pointer hover:bg-green-100' : ''}"
                    on:click={() => selectable && handleSelection(topic.id)}
                  >
                    <div class="flex items-center min-w-0 flex-1">
                      {#if selectable}
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(topic.id)}
                          on:change={() => handleSelection(topic.id)}
                          class="mr-3 text-green-600"
                        />
                      {/if}
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center">
                          <svg class="w-3 h-3 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <span class="text-sm text-gray-800 truncate" title={topic.name}>
                            {topic.name}
                          </span>
                        </div>
                        {#if showQuestionCounts}
                          <p class="text-xs text-gray-500 ml-5">
                            {topic.question_count} questions
                          </p>
                        {/if}
                      </div>
                    </div>
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Topic
                    </span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Footer -->
  {#if displayData.length > 0 && showQuestionCounts}
    <div class="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
      <div class="flex items-center justify-between text-xs text-gray-600">
        <span>
          {displayData.length} {quizConfig.chapter_topic_type}{displayData.length > 1 ? 's' : ''} selected
        </span>
        <span class="font-medium">
          {getTotalQuestions()} total questions available
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for better UX */
  .max-h-64::-webkit-scrollbar {
    width: 6px;
  }

  .max-h-64::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .max-h-64::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .max-h-64::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>