<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let topic = {};
  export let chapter = {};
  export let selections = [];
  export let highlightedItem = null;
  export let selectionLogic = {};
  export let isExpanded = false;

  $: isSelected = selectionLogic?.isTopicLogicallySelected?.(topic.code, chapter.code) || false;
  $: isHighlighted = highlightedItem?.code === topic.code && highlightedItem?.type === 'topic';
  $: selectedSubtopics = topic.subtopics?.filter(st => 
    selections.some(s => s.code === st.code)
  ) || [];

  function handleCheckboxChange(event) {
    dispatch('select', {
      event,
      item: topic,
      type: 'topic'
    });
  }

  function handleToggle() {
    dispatch('toggle', {
      topicId: topic.code
    });
  }
</script>

<tr class="hover:bg-gray-50 transition-colors duration-150 {isHighlighted ? 'bg-yellow-100 border-yellow-300' : ''} bg-gray-25">
  <!-- Topic Name -->
  <td class="px-6 py-3 whitespace-nowrap">
    <div class="flex items-center">
      <!-- Indentation -->
      <div class="w-6"></div>

      <!-- Expand/Collapse Button (only if has subtopics) -->
      {#if topic.subtopics && topic.subtopics.length > 0}
        <button
          type="button"
          class="mr-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}"
          on:click={handleToggle}
          aria-label="{isExpanded ? 'Collapse' : 'Expand'} topic"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      {:else}
        <div class="w-6"></div>
      {/if}

      <!-- Checkbox -->
      <input
        type="checkbox"
        checked={isSelected}
        on:change={handleCheckboxChange}
        class="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
        aria-label="Select topic {topic.name}"
      />

      <!-- Topic Icon and Name -->
      <div class="flex items-center">
        <div class="flex-shrink-0 h-6 w-6">
          <div class="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
        <div class="ml-3">
          <div class="text-sm font-medium text-gray-900">
            {topic.name}
          </div>
          <div class="text-xs text-gray-500">
            Topic • {topic.subtopics?.length || 0} subtopics
          </div>
        </div>
      </div>
    </div>
  </td>

  <!-- Question Count -->
  <td class="px-6 py-3 whitespace-nowrap">
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      {topic.question_count || 0} questions
    </span>
  </td>

  <!-- Selection Summary -->
  <td class="px-6 py-3">
    <div class="flex items-center justify-between">
      {#if isSelected}
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Topic Selected
        </span>
      {:else if selectedSubtopics.length > 0}
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {selectedSubtopics.length} subtopic{selectedSubtopics.length !== 1 ? 's' : ''} selected
        </span>
      {:else}
        <span class="text-xs text-gray-400">Not selected</span>
      {/if}

      <!-- Status Indicator -->
      <div class="flex-shrink-0">
        {#if isSelected}
          <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
        {:else if selectedSubtopics.length > 0}
          <div class="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
        {:else}
          <div class="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        {/if}
      </div>
    </div>
  </td>
</tr>