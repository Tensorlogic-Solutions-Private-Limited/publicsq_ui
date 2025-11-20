<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let chapter = {};
  export let selections = [];
  export let highlightedItem = null;
  export let selectionLogic = {};
  export let isExpanded = false;

  $: isSelected = selectionLogic?.isChapterSelected?.(chapter.code) || false;
  $: isHighlighted = highlightedItem?.code === chapter.code && highlightedItem?.type === 'chapter';
  $: selectedItems = selectionLogic?.getSelectedItemsForChapter?.(chapter, selections) || [];

  function handleCheckboxChange(event) {
    dispatch('select', {
      event,
      item: chapter,
      type: 'chapter'
    });
  }

  function handleToggle() {
    dispatch('toggle', {
      chapterId: chapter.code
    });
  }

  function handleOpenSummary() {
    dispatch('openSummary', {
      chapter
    });
  }
</script>

<tr class="hover:bg-gray-50 transition-colors duration-150 {isHighlighted ? 'bg-yellow-100 border-yellow-300' : ''}">
  <!-- Chapter Name -->
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center">
      <!-- Expand/Collapse Button -->
      <button
        type="button"
        class="mr-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}"
        on:click={handleToggle}
        aria-label="{isExpanded ? 'Collapse' : 'Expand'} chapter"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Checkbox -->
      <input
        type="checkbox"
        checked={isSelected}
        on:change={handleCheckboxChange}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
        aria-label="Select chapter {chapter.name}"
      />

      <!-- Chapter Icon and Name -->
      <div class="flex items-center">
        <div class="flex-shrink-0 h-8 w-8">
          <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <div class="ml-4">
          <div class="text-sm font-medium text-gray-900">
            {chapter.name}
          </div>
          <div class="text-sm text-gray-500">
            Chapter • {chapter.topics?.length || 0} topics
          </div>
        </div>
      </div>
    </div>
  </td>

  <!-- Question Count -->
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {chapter.question_count || 0} questions
      </span>
    </div>
  </td>

  <!-- Selection Summary -->
  <td class="px-6 py-4">
    <div class="flex items-center justify-between">
      {#if isSelected}
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Entire Chapter Selected
        </span>
      {:else if selectedItems.length > 0}
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <button
            type="button"
            class="text-xs text-blue-600 hover:text-blue-800 underline"
            on:click={handleOpenSummary}
          >
            View Details
          </button>
        </div>
      {:else}
        <span class="text-sm text-gray-400">No items selected</span>
      {/if}

      <!-- Status Indicator -->
      <div class="flex-shrink-0">
        {#if isSelected}
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        {:else if selectedItems.length > 0}
          <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
        {:else}
          <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
        {/if}
      </div>
    </div>
  </td>
</tr>