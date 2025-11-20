<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let data = []; // Array of chapters with topics
  export let selectedCodes = []; // Array of selected codes
  export let selectionType = "mixed"; // 'chapter', 'topic', or 'mixed'
  export let loading = false;

  let expandedChapters = new Set();
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let jumpToPage = "";

  // Calculate pagination
  $: totalItems = data.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  $: paginatedData = data.slice(startIndex,endIndex)
  
  // Generate page numbers for pagination
  $: pageNumbers = generatePageNumbers(currentPage, totalPages);

  function generatePageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function handleJumpToPage(event) {
    event.preventDefault();
    const page = parseInt(jumpToPage);
    if (page && page >= 1 && page <= totalPages) {
      currentPage = page;
      jumpToPage = "";
    }
  }

  // Toggle chapter expansion
  function toggleChapter(chapterCode) {
    if (expandedChapters.has(chapterCode)) {
      expandedChapters.delete(chapterCode);
    } else {
      expandedChapters.add(chapterCode);
    }
    expandedChapters = new Set(expandedChapters);
  }

  // Handle chapter selection
  function toggleChapterSelection(chapterCode) {
    if (selectionType === "chapter" || selectionType === "mixed") {
      dispatch("toggle", { code: chapterCode, type: "chapter" });
    }
  }

  // Handle topic selection
  function toggleTopicSelection(topicCode) {
    if (selectionType === "topic" || selectionType === "mixed") {
      dispatch("toggle", { code: topicCode, type: "topic" });
    }
  }

  // Check if chapter is selected
  function isChapterSelected(chapterCode) {
    return (
      (selectionType === "chapter" || selectionType === "mixed") &&
      selectedCodes.includes(chapterCode)
    );
  }

  // Check if topic is selected
  function isTopicSelected(topicCode) {
    return (
      (selectionType === "topic" || selectionType === "mixed") &&
      selectedCodes.includes(topicCode)
    );
  }

  // Get selected topics count for a chapter
  function getSelectedTopicsCount(chapter) {
    if (!chapter.topics) return 0;
    return chapter.topics.filter((topic) =>
      selectedCodes.includes(topic.code || topic.topic_code)
    ).length;
  }

  // Get total topics count for a chapter
  function getTotalTopicsCount(chapter) {
    return chapter.topics ? chapter.topics.length : 0;
  }

  // Get selection summary text
  function getSelectionSummary(chapter) {
    const chapterCode = chapter.code || chapter.chapter_code;
    const isChapterSel = isChapterSelected(chapterCode);
    const selectedTopics = getSelectedTopicsCount(chapter);
    const totalTopics = getTotalTopicsCount(chapter);

    if (selectionType === "chapter") {
      return "No topics selected";
    } else if (selectionType === "topic") {
      if (selectedTopics === 0) return "No topics selected";
      if (selectedTopics === totalTopics) return "All topics selected";
      return `${selectedTopics} of ${totalTopics} topics selected`;
    } else {
      // mixed
      const parts = [];
      if (isChapterSel) parts.push("Chapter selected");
      if (selectedTopics > 0) {
        if (selectedTopics === totalTopics) {
          parts.push("All topics selected");
        } else {
          parts.push(`${selectedTopics} of ${totalTopics} topics selected`);
        }
      }
      return parts.length > 0 ? parts.join(" • ") : "No selection";
    }
  }
</script>

<div class="border border-gray-200 rounded-lg overflow-hidden">
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div
        class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"
      ></div>
      <span class="text-gray-600"
        >Loading {selectionType === "mixed"
          ? "chapters and topics"
          : selectionType + "s"}...</span
      >
    </div>
  {:else if data.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p class="text-yellow-800">
        No {selectionType === "mixed"
          ? "chapters and topics"
          : selectionType + "s"} available for the selected combination. Please try
        a different selection.
      </p>
    </div>
  {:else}
    <!-- Table Header -->
    <div class="bg-gray-50 border-b border-gray-200">
      <div
        class="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-700"
      >
        <div class="col-span-1"></div>
        <div class="col-span-6">NAME</div>
        <div class="col-span-2 text-center">QUESTIONS</div>
        <div class="col-span-3 text-center">SELECTION SUMMARY</div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="bg-white max-h-96 overflow-y-auto">
      {#key selectedCodes.join(',')}
      {#each paginatedData as chapter }
        {@const chapterCode = chapter.code || chapter.chapter_code}
        {@const chapterName = chapter.name || chapter.chapter_name}
        {@const chapterQuestions = chapter.question_count || 0}
        {@const isExpanded = expandedChapters.has(chapterCode)}
        {@const hasTopics = chapter.topics && chapter.topics.length > 0}
        {@const selectedTopics = getSelectedTopicsCount(chapter)}
        {@const totalTopics = getTotalTopicsCount(chapter)}

        <!-- Chapter Row -->
        <div
          class="border-b border-gray-100 {isChapterSelected(chapterCode)
            ? 'bg-blue-50'
            : 'bg-white'}"
        >
          <div
            class="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
          >
            <!-- Checkbox and Expand Button -->
            <div class="col-span-1 flex items-center space-x-2">
              {#if selectionType === "chapter" || selectionType === "mixed"}
                <input
                  type="checkbox"
                  checked={isChapterSelected(chapterCode)}
                  on:change|preventDefault={() =>
                    toggleChapterSelection(chapterCode)}
                  class="text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              {/if}
              {#if hasTopics}
                <button
                  on:click|preventDefault={() => toggleChapter(chapterCode)}
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title="Expand/Collapse"
                  type="button"
                >
                  <svg
                    class="w-4 h-4 transform transition-transform {isExpanded
                      ? 'rotate-90'
                      : ''}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              {/if}
            </div>

            <!-- Chapter Name -->
            <div class="col-span-6">
              <div
                class="font-medium text-gray-900 cursor-pointer {selectionType ===
                  'chapter' || selectionType === 'mixed'
                  ? 'hover:text-blue-600'
                  : ''}"
                on:click|preventDefault={() => {
                  if (
                    selectionType === "chapter" ||
                    selectionType === "mixed"
                  ) {
                    toggleChapterSelection(chapterCode);
                  } else {
                    toggleChapter(chapterCode);
                  }
                }}
              >
                {chapterName}
              </div>
            </div>

            <!-- Questions Count -->
            <div class="col-span-2 text-center text-sm text-gray-600">
              {chapterQuestions}
            </div>

            <!-- Selection Summary -->
            <div class="col-span-3 text-center text-sm">
              {#if (selectionType === "topic" || selectionType === "mixed") && selectedTopics > 0}
                <span class="text-blue-600 font-medium">
                  {selectedTopics} of {totalTopics} topics selected
                </span>
              {:else if selectionType === "mixed" && isChapterSelected(chapterCode)}
                <span class="text-green-600 font-medium">Chapter selected</span>
              {:else}
                <span class="text-gray-500 italic">
                  {getSelectionSummary(chapter)}
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Topics (Expanded) -->
        {#if isExpanded && hasTopics}
          {#each chapter.topics as topic }
            {@const topicCode = topic.code || topic.topic_code}
            {@const topicName = topic.name || topic.topic_name}
            {@const topicQuestions = topic.question_count || 0}

            <div
              class="border-b border-gray-50 bg-gray-25 {isTopicSelected(
                topicCode
              )
                ? 'bg-green-50'
                : ''}"
            >
              <div
                class="grid grid-cols-12 gap-4 px-4 py-2 items-center hover:bg-gray-50 transition-colors"
              >
                <!-- Indent and Checkbox -->
                <div class="col-span-1 flex items-center justify-end">
                  {#if selectionType === "topic" || selectionType === "mixed"}
                    <input
                      type="checkbox"
                      checked={isTopicSelected(topicCode)}
                      on:change|preventDefault={() =>
                        toggleTopicSelection(topicCode)}
                      class="text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                  {/if}
                </div>

                <!-- Topic Name (Indented) -->
                <div class="col-span-6">
                  <div
                    class="text-sm text-gray-700 pl-6 cursor-pointer {selectionType ===
                      'topic' || selectionType === 'mixed'
                      ? 'hover:text-green-600'
                      : ''}"
                    on:click|preventDefault={() => {
                      if (
                        selectionType === "topic" ||
                        selectionType === "mixed"
                      ) {
                        toggleTopicSelection(topicCode);
                      }
                    }}
                  >
                    {topicName}
                  </div>
                </div>

                <!-- Topic Questions Count -->
                <div class="col-span-2 text-center text-sm text-gray-500">
                  {topicQuestions}
                </div>

                <!-- Topic Selection Status -->
                <div class="col-span-3 text-center text-sm">
                  {#if (selectionType === "topic" || selectionType === "mixed") && isTopicSelected(topicCode)}
                    <span class="text-green-600 font-medium">Selected</span>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {/if}
      {/each}
      {/key}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Pagination Info -->
          <div class="text-sm text-gray-700">
            Showing {startIndex + 1} to {endIndex} of {totalItems} chapters
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center space-x-2">
            <!-- Previous Button -->
            <button
              on:click|preventDefault={goToPreviousPage}
              disabled={currentPage === 1}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Previous
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center space-x-1">
              {#each pageNumbers as pageNum}
                {#if pageNum === "..."}
                  <span class="px-2 py-1 text-sm text-gray-500">...</span>
                {:else}
                  <button
                    on:click|preventDefault={() => goToPage(pageNum)}
                    class="px-3 py-1 text-sm border rounded-md {currentPage ===
                    pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-100'}"
                    type="button"
                  >
                    {pageNum}
                  </button>
                {/if}
              {/each}
            </div>

            <!-- Next Button -->
            <button
              on:click|preventDefault={goToNextPage}
              disabled={currentPage === totalPages}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Next
            </button>

            <!-- Jump to Page -->
            <form
              on:submit|preventDefault={handleJumpToPage}
              class="flex items-center space-x-2 ml-4"
            >
              <span class="text-sm text-gray-600">Go to:</span>
              <input
                type="number"
                bind:value={jumpToPage}
                min="1"
                max={totalPages}
                placeholder="Page"
                class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .bg-gray-25 {
    background-color: #fafafa;
  }
</style>
