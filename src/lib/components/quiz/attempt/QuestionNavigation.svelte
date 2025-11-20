<script>
  import { createEventDispatcher } from "svelte";

  export let questions = [];
  export let currentQuestionIndex = 0;
  export let revealedAnswers = {};
  export let getQuestionStatus = () => "unanswered";

  const dispatch = createEventDispatcher();

  function handleGoToQuestion(index) {
    dispatch("goToQuestion", { index });
  }
</script>

<div
  class=" gap-1.5 min-w-40 "
  data-question-navigation="true"
>
  <!-- <div class="flex items-center gap-2">
    <p class="text-xs font-semibold text-slate-900">Questions</p>
  </div> -->
  <div class="flex justify-center gap-1 flex-wrap">
    {#each questions as question, index}
      <button
        on:click={() => handleGoToQuestion(index)}
        class="w-7 h-7 border-2 rounded-md font-medium text-xs cursor-pointer transition-all duration-200 flex items-center justify-center relative flex-shrink-0
         {index === currentQuestionIndex
          ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md shadow-blue-200'
          : getQuestionStatus(index) === 'answered'
            ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'}"
        title={`Question ${index + 1}`}
      >
        {index + 1}
        {#if revealedAnswers[question.id]}
          <span class="absolute -top-0.5 -right-0.5 text-xs">👁️</span>
        {/if}
      </button>
    {/each}
  </div>
</div>