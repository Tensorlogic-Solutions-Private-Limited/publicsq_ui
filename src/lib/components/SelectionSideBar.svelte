<script>
  import { selectedContentStore } from '$lib/stores/selectedContentStore.js';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let isOpen = false;
  let sidebarElement;

  function handleItemClick(event, item) {
    event.preventDefault();
    event.stopPropagation();
    
    // Dispatch the highlight event for scrollspy functionality
    dispatch('highlightItem', { code: item.code, type: item.type });
    
    // Find the element in the table and scroll to it
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-item-code="${item.code}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  }

  function removeSelection(event, item) {
    event.preventDefault();
    event.stopPropagation();
    selectedContentStore.removeSelection(item.code);
  }

  function toggleSidebar(event) {
    event.preventDefault();
    event.stopPropagation();
    isOpen = !isOpen;
  }

  // Close sidebar when clicking outside
  function handleClickOutside(event) {
    if (sidebarElement && !sidebarElement.contains(event.target)) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- Selection Sidebar -->
<div class="fixed top-4 right-4 z-50" bind:this={sidebarElement}>
  <div class="relative">
    <!-- Toggle button -->
    <button 
      type="button"
      class="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      on:click={toggleSidebar}
    >
      <div class="flex items-center space-x-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-sm font-medium">{$selectedContentStore.selections.length}</span>
      </div>
    </button>

    <!-- Dropdown panel -->
    {#if isOpen && $selectedContentStore.selections.length > 0}
      <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
        <div class="px-4 py-2 border-b border-gray-200">
          <h3 class="text-sm font-semibold text-gray-900">Selected Items ({$selectedContentStore.selections.length})</h3>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          {#each $selectedContentStore.selections as item}
            <div class="px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
              <div class="flex items-center justify-between">
                <button 
                  type="button"
                  class="flex-1 text-left hover:bg-gray-100 rounded p-1 transition-colors"
                  on:click={(e) => handleItemClick(e, item)}
                >
                  <div class="flex items-center space-x-2">
                    <!-- Type icon -->
                    <div class={`w-2 h-2 rounded-full ${
                      item.type === 'chapter' ? 'bg-green-500' :
                      item.type === 'topic' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                    
                    <div>
                      <div class="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </div>
                      <div class="text-xs text-gray-500">
                        {item.type} • {item.question_count || 0} questions
                      </div>
                    </div>
                  </div>
                </button>
                
                <!-- Remove button -->
                <button 
                  type="button"
                  class="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                  on:click={(e) => removeSelection(e, item)}
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
