<script>
  export let data = [
    // {
    //   type: "chapter",
    //   codes: [
    //     {
    //       code: "C001",
    //       qn_count: null,
    //       name: "Human Geography",
    //     },
    //   ],
    // },
    // {
    //   type: "topic",
    //   codes: [
    //     {
    //       code: "T001",
    //       qn_count: null,
    //       name: "Leaders",
    //       chapter_details: {
    //         code: "C002",
    //         name: "Indian Constitution",
    //       },
    //     },
    //     {
    //       code: "T339",
    //       qn_count: null,
    //       name: "introduction",
    //       chapter_details: {
    //         code: "C002",
    //         name: "Indian constitution",
    //       },
    //     },
    //   ],
    // },
  ];

  // Helper to group codes by type and maintain hierarchy using chapter_details
  function buildHierarchy(data) {
    const chapters = data.find((d) => d.type === "chapter")?.codes || [];
    const topics = data.find((d) => d.type === "topic")?.codes || [];
    const subtopics = data.find((d) => d.type === "subtopic")?.codes || [];

    // Build chapter map
    const chapterMap = {};
    chapters.forEach((ch) => {
      chapterMap[ch.code] = { ...ch, topics: [] };
    });

    // Group topics under chapters using chapter_details
    topics.forEach((tp) => {
      const parentCode = tp.chapter_details?.code;
      if (parentCode && chapterMap[parentCode]) {
        chapterMap[parentCode].topics.push({ ...tp, subtopics: [] });
      } else {
        // Orphan topic

        chapterMap[parentCode] = {
          ...tp.chapter_details,
          topics: [tp],
        };
      }
    });

   return Object.values(chapterMap);
  }

  $: hierarchy = buildHierarchy(data);

</script>

<div class="bg-white rounded-lg shadow p-4 text-base">
  {#each hierarchy as chapter}
    <div class="mb-6 pb-4 last:border-b-0 last:pb-0 last:mb-0 border-b border-gray-100">
      <div class="flex justify-between w-full mb-2">
        <div>
          <p class="text-sm font-semibold italic text-dark-gray">{chapter.name}</p>
          <p>
            <span
              class="bg-indigo-100 text-indigo-800 text-xs rounded px-2 py-0.5"
              >chapter</span
            >
            {#if chapter.topics && chapter.topics.length > 0}
              <span class="text-slate-500 text-xs ml-3 italic"
                >{chapter.topics.length}
                {chapter.topics.length === 1 ? "topic" : "topics"} selected</span
              >
            {:else}
              <span class="text-slate-500 text-xs ml-3 italic"
                >Full chapter selected</span
              >
            {/if}
          </p>
        </div>
      </div>
      {#if chapter.topics && chapter.topics.length > 0}
        {#each chapter.topics as topic}
          <div class="ml-6 flex items-center gap-2 mb-1">
            <span class="text-gray-400 text-lg">↳</span>
            <div>
              <p class="font-medium text-sm text-dark-gray">{topic.name}</p>
              <span
                class="bg-green-100 text-green-800 text-xs rounded px-2 py-0.5"
                >topic</span
              >
            </div>

            {#if topic.subtopics && topic.subtopics.length > 0}
              <span class="text-slate-500 text-xs ml-3"
                >{topic.subtopics.length}
                {topic.subtopics.length === 1 ? "subtopic" : "subtopics"} selected</span
              >
              <!-- {:else}
              <span class="text-slate-500 text-sm ml-3">Selected</span> -->
            {/if}
          </div>
          {#if topic.subtopics && topic.subtopics.length > 0}
            {#each topic.subtopics as subtopic}
              <div class="ml-12 flex items-center gap-2 mb-0.5">
                <span class="text-gray-400 text-lg">↳</span>
                <span class=" text-sm text-dark-gray">{subtopic.name}</span>
                <span
                  class="bg-indigo-100 text-indigo-800 text-xs rounded px-2 py-0.5 ml-2"
                  >subtopic</span
                >
                <span class="text-slate-500 text-xs ml-3">Selected</span>
              </div>
            {/each}
          {/if}
        {/each}
      {/if}
    </div>
  {/each}
</div>
