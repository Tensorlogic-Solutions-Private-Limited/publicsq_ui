<script>
  import { createEventDispatcher } from 'svelte';
  import ChapterRow from './ChapterRow.svelte';
  import TopicRow from './TopicRow.svelte';
//   import SubtopicRow from './SubtopicRow.svelte';

  const dispatch = createEventDispatcher();

  export let chaptersData = [];
  export let selections = [];
  export let expandedChapters = new Set();
  export let expandedTopics = new Set();
  export let highlightedItem = null;
  export let selectionLogic = {};

  function handleSelect(event) {
    dispatch('select', event.detail);
  }

  function handleToggleChapter(event) {
    dispatch('toggleChapter', event.detail);
  }

  function handleToggleTopic(event) {
    dispatch('toggleTopic', event.detail);
  }

  function handleOpenSummary(event) {
    dispatch('openSummary', event.detail);
  }
</script>

<table class="min-w-full divide-y divide-gray-200">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Name
      </th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Questions
      </th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
        Selection Summary
      </th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    {#each chaptersData as chapter}
      <ChapterRow
        {chapter}
        {selections}
        {highlightedItem}
        {selectionLogic}
        isExpanded={expandedChapters.has(chapter.code)}
        on:select={handleSelect}
        on:toggle={handleToggleChapter}
        on:openSummary={handleOpenSummary}
      />

      {#if expandedChapters.has(chapter.code) && chapter.topics}
        {#each chapter.topics as topic}
          <TopicRow
            {topic}
            {chapter}
            {selections}
            {highlightedItem}
            {selectionLogic}
            isExpanded={expandedTopics.has(topic.code)}
            on:select={handleSelect}
            on:toggle={handleToggleTopic}
          />

         
        {/each}
      {/if}
    {/each}
  </tbody>
</table>