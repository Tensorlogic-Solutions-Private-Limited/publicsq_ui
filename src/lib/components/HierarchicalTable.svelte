<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let selectedData = {
    chapters: [],
    topics: [],
    subtopics: []
  };

  // State for selection
  let selectedItems = new Set();
  $: selectedItemsCount = selectedItems.size;

  // Combine all into one array with unique IDs
  $: totalItems = [
    ...selectedData.chapters.map(c => ({ ...c, uniqueId: `chapter-${c.id}`, type: 'Chapter' })),
    ...selectedData.topics.map(t => ({ ...t, uniqueId: `topic-${t.id}`, type: 'Topic' })),
    ...selectedData.subtopics.map(s => ({ ...s, uniqueId: `subtopic-${s.id}`, type: 'Subtopic' }))
  ];

  // Sorting state
  let sortKey = 'name';
  let sortOrder = 'asc';

  // Derived sorted list
  $: sortedItems = [...totalItems].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  function toggleSelection(item) {
    if (selectedItems.has(item.uniqueId)) {
      selectedItems.delete(item.uniqueId);
    } else {
      selectedItems.add(item.uniqueId);
    }
    selectedItems = selectedItems; // trigger reactivity
  }

  function handleCreateGroup() {
    if (selectedItems.size > 0) {
      const selectedContent = totalItems.filter(item => selectedItems.has(item.uniqueId));
      const payload = {
        items: selectedContent,
        type: selectedContent[0].type,
        totalQuestions: selectedContent.reduce((sum, item) => sum + (item.questionCount || 0), 0)
      };
      console.log('HierarchicalTable dispatching createGroup:', payload);
      dispatch('createGroup', payload);

      // Reset selection after group creation
      selectedItems.clear();
      selectedItems = selectedItems; // trigger reactivity
    }
  }

  function handleSort(column) {
    if (sortKey === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = column;
      sortOrder = 'asc';
    }
  }
</script>

<div class="space-y-4">
  <table class="min-w-full divide-y divide-gray-200 shadow-sm rounded-md border">
    <thead class="bg-gray-100">
      <tr>
        <th class="w-8 px-4 py-3">
          <input 
            type="checkbox" 
            class="rounded border-gray-300"
            on:change={(e) => {
              if (e.target.checked) {
                sortedItems.forEach(item => selectedItems.add(item.uniqueId));
              } else {
                selectedItems.clear();
              }
              selectedItems = selectedItems;
            }}
          >
        </th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer select-none hover:underline"
            on:click={() => handleSort('name')}>
          Name {sortKey === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
        </th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Parent</th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer select-none hover:underline"
            on:click={() => handleSort('questionCount')}>
          Questions {sortKey === 'questionCount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each sortedItems as item (item.uniqueId)}
        <tr class="hover:bg-gray-50">
          <td class="w-8 px-4 py-3">
            <input 
              type="checkbox"
              class="rounded border-gray-300"
              checked={selectedItems.has(item.uniqueId)}
              on:change={() => toggleSelection(item)}
            >
          </td>
          <td class="px-4 py-3 text-sm">{item.type}</td>
          <td class="px-4 py-3 text-sm">{item.name}</td>
          <td class="px-4 py-3 text-sm">
            {#if item.type === 'Topic'}
              {item.parentChapter}
            {:else if item.type === 'Subtopic'}
              {item.parentTopic}
            {:else}
              -
            {/if}
          </td>
          <td class="px-4 py-3 text-sm">{item.questionCount}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="text-sm text-gray-500">
    Selected items: {selectedItemsCount}
  </div>

  {#if selectedItemsCount > 0}
    <div class="flex justify-end mt-4">
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        on:click={handleCreateGroup}
      >
        Create Group ({selectedItemsCount} items selected)
      </button>
    </div>
  {/if}
</div>
