<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let loading = false;
  export let error = "";
  export let papers = [];
  export let paperDetails = null;
  export let examTitle = "";
  export let subject = "" ; 
  export let numberOfQuestions= "" ; 
  export let standard = "" ; 


  let selectedFormat = "json";
  let hideAnswers = false;

  function handlePaperAction(paperId) {
    // console.log("will it work", paperId);

    dispatch("viewPaper", {
      paperId,
      format: selectedFormat,
      questionsOnly: hideAnswers,
    });
  }

</script>

<div
  class="fixed inset-0 opacity-95 bg-gray-500   flex items-center justify-center z-50"
>
  <div
    class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
  >
    <div class="relative p-6">
      <!-- Close button -->
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        on:click={() => dispatch("close")}
      >
        <span class="sr-only">Close</span>
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {#if loading}
        <div class="flex items-center justify-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <span class="ml-2 text-gray-600">Loading paper details...</span>
        </div>
      {:else if error}
        <div class="text-red-600 p-4 bg-red-50 rounded">
          {error}
        </div>
      {:else if paperDetails}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Paper Details</h2>
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              on:click={() => dispatch("back")}
            >
              Back to Papers List
            </button>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <pre class="text-sm whitespace-pre-wrap">{JSON.stringify(
                paperDetails,
                null,
                2
              )}</pre>
          </div>
        </div>
      {:else}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold">View Paper Options</h2>

          <div>
            <p>Exam Title: {examTitle}</p>
            <!-- <p>Number of questions:{numberOfQuestions} </p> -->
            <p>Subject: {subject}</p>
            <p>Standard: {standard}</p>
            
          </div>

          <div class="grid gap-4">
            {#each papers as paperId}
              <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <h3 class="font-medium">Paper ID: {paperId}</h3>
                  <div class="flex items-center space-x-3">
                    <select
                      bind:value={selectedFormat}
                      class="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="json">View as JSON</option>
                      <option value="pdf">Download PDF</option>
                    </select>

                    <label
                      class="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <input
                        type="checkbox"
                        bind:checked={hideAnswers}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Questions Only</span>
                    </label>

                    <button
                      on:click={() => handlePaperAction(paperId)}
                      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {selectedFormat === "json" ? "View" : "Download"}
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
