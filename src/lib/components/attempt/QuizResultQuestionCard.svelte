<script>
  export let result;
  export let selectedQuestionIndex;
  // export let showExplanations = true;
  export let toggleQuestionDetails;
  import QuestionRemarks from "$lib/components/quiz/QuestionRemarks.svelte";
  // Helper function to safely display text
  export let safeDisplayText = (text, maxLength = null) => text;
  export let getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  function findFormatCode(question) {
    if (
      question?.qmt_option1_media ||
      question?.qmt_option2_media ||
      question?.qmt_option3_media ||
      question?.qmt_option4_media ||
      question?.qmt_question_text_media
    )
      return "image";
    return "text";
  }

  $: qnFormat = findFormatCode(result?.question);
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Question Header -->
  <div
    class="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    on:click={() => toggleQuestionDetails(result.questionNumber - 1)}
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Status Icon -->
        <div class="flex-shrink-0">
          {#if result.status === "correct"}
            <div
              class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          {:else if result.status === "incorrect"}
            <div
              class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          {:else}
            <div
              class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          {/if}
        </div>
        <!-- Question Info -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900">
            Question {result.questionNumber}
          </h4>
          <p class="text-sm text-gray-600 truncate">
            {safeDisplayText(result.question.text, 100)}
          </p>
        </div>
        <!-- Status Badge -->
        <div class="flex-shrink-0">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            {result.status === 'correct'
              ? 'bg-green-100 text-green-800'
              : result.status === 'incorrect'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'}"
          >
            {result.status === "correct"
              ? "Correct"
              : result.status === "incorrect"
                ? "Incorrect"
                : "Unanswered"}
          </span>
        </div>
      </div>
      <!-- Expand Arrow -->
      <div class="ml-4">
        <svg
          class="w-5 h-5 text-gray-400 transform transition-transform
          {selectedQuestionIndex === result.questionNumber - 1
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  </div>

  <!-- Question Details (Expandable) -->
  {#if selectedQuestionIndex === result.questionNumber - 1}
    <div class="border-t border-gray-200 p-6">
      <!-- Question Text -->
      <div class="mb-6">
        <h5 class="text-lg font-medium text-gray-900 mb-2">
          {safeDisplayText(result?.question?.text)}
        </h5>
        {#if qnFormat === "image"}
          <div class=" flex w-full flex-wrap gap-4">
            {#each result?.question?.qmt_question_text_media as quesImage}
              <div class="w-40 rounded-sm border border-gray-200">
                <img src={quesImage} alt="" class="w-full object-contain" />
              </div>
            {/each}
          </div>
        {/if}
        {#if result?.question?.chapter || result?.question?.topic}
          <div class="flex items-center space-x-4 text-sm text-gray-500">
            {#if result?.question?.chapter}
              <span>📚 {safeDisplayText(result?.question?.chapter)}</span>
            {/if}
            {#if result?.question?.topic}
              <span>📝 {safeDisplayText(result?.question?.topic)}</span>
            {/if}
            <span class="capitalize">{result?.question?.difficulty}</span>
          </div>
        {/if}
      </div>
      <!-- Options -->
      <div class="space-y-3 mb-6">
        {#each result?.question?.options as option, optIndex}
          <div
            class=" p-3 rounded-lg border-2 transition-colors
            {option.is_correct
              ? 'border-green-300 bg-green-50'
              : result?.selectedOption?.id === option.id && !option.is_correct
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'}"
          >
            <div class="flex items-center space-x-3 w-full mb-4">
              <!-- Option Indicator -->
              <div
                class="w-6 h-6 border-2 rounded-full flex items-center justify-center
                {option.is_correct
                  ? 'border-green-500 bg-green-500'
                  : result.selectedOption?.id === option.id
                    ? 'border-red-500 bg-red-500'
                    : 'border-gray-300'}"
              >
                {#if option.is_correct}
                  <svg
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {:else if result?.selectedOption?.id === option.id}
                  <svg
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                {/if}
              </div>
              <!-- Option Label and Text -->
              <span class="font-medium text-gray-600 min-w-0"
                >{getOptionLabel(optIndex)}.</span
              >
              <span class="flex-1 text-gray-900"
                >{safeDisplayText(option.text)}</span
              >
              <!-- Status Labels -->
              <div class="flex space-x-2">
                {#if option?.is_correct}
                  <span
                    class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                    >Correct Answer</span
                  >
                {/if}
                {#if result?.selectedOption?.id === option.id}
                  <span
                    class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >Your Answer</span
                  >
                {/if}
              </div>
            </div>

            {#if qnFormat === "image"}
              <div class=" flex gap-4 flex-wrap w-full">
                {#if optIndex === 0 && result.question.qmt_option1_media}
                  {#each result.question.qmt_option1_media as img}
                    <img
                      src={img}
                      alt="Option A image"
                      class="w-24 h-24 object-contain rounded border border-gray-300"
                    />
                  {/each}
                {:else if optIndex === 1 && result.question.qmt_option2_media}
                  {#each result.question.qmt_option2_media as img}
                    <img
                      src={img}
                      alt="Option B image"
                      class="w-24 h-24 object-contain rounded border border-gray-300"
                    />
                  {/each}
                {:else if optIndex === 2 && result.question.qmt_option3_media}
                  {#each result.question.qmt_option3_media as img}
                    <img
                      src={img}
                      alt="Option C image"
                      class="w-24 h-24 object-contain rounded border border-gray-300"
                    />
                  {/each}
                {:else if optIndex === 3 && result.question.qmt_option4_media}
                  {#each result.question.qmt_option4_media as img}
                    <img
                      src={img}
                      alt="Option D image"
                      class="w-24 h-24 object-contain rounded border border-gray-300"
                    />
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      <!-- Answer Summary -->
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">Your Answer:</span>
            <span
              class="ml-2 {result.isCorrect
                ? 'text-green-600'
                : result.isAttempted
                  ? 'text-red-600'
                  : 'text-gray-600'}"
            >
              {result.isAttempted
                ? `${getOptionLabel(result.question.options.findIndex((opt) => opt.id === result?.userAnswer))} - ${safeDisplayText(result?.selectedOption?.text)}`
                : "Not answered"}
            </span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Correct Answer:</span>
            <span class="ml-2 text-green-600">
              {getOptionLabel(
                result.question.options.findIndex((opt) => opt?.is_correct)
              )} - {safeDisplayText(result?.correctOption?.text)}
            </span>
          </div>
        </div>
      </div>

      <!-- Teacher Remarks -->
      {#if result.remark}
        <div class="remarks-display-section">
          <QuestionRemarks
            questionId={result.question.id}
            remarks={result.remark.text || ""}
            readonly={true}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
