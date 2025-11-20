<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  export let question;
  export let currentQuestionIndex;
  export let selectedAnswer;
  export let revealAnswer = false; // If true, reveal the answer
  export let showExplanation = false; // If true, show the explanation
  export let showActions = true; 
  export let mode = "attempt";
  export let totalQuestions = 0;

  const dispatch = createEventDispatcher();

  function handleAnswerSelect(optionId) {
    dispatch("answer", { questionId: question.id, optionId });
  }

  function getOptionStatus(optionId) {
    const isSelected = selectedAnswer === optionId;
    const isCorrect = question.correct_answer === optionId;

    const isRevealed = revealAnswer;

    if (!isRevealed) {
      return isSelected ? "selected" : "";
    }
    if (isCorrect && isSelected) {
      return "correct-selected";
    } else if (isCorrect) {
      return "correct";
    } else if (isSelected) {
      return "incorrect-selected";
    }
    return "revealed";
  }

  function getOptionLabel(index) {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  function getOptionClass(optionId) {
    const status = getOptionStatus(optionId);
    if (status === "selected") return "border-blue-500 bg-blue-50";
    if (status === "correct") return "border-emerald-500 bg-emerald-50";
    if (status === "correct-selected")
      return "border-emerald-500 bg-emerald-100 shadow-lg shadow-emerald-200";
    if (status === "incorrect-selected")
      return "border-red-500 bg-red-50 shadow-lg shadow-red-200";
    return "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";
  }

  function triggerQuestionDelete() {
    dispatch("deleteQuestion", question);
  }

</script>

<div
  class="bg-white rounded-xl p-4 shadow-lg border border-slate-200 mb-3 max-w-3xl w-full"
>
  <!-- Question Header -->
  <div class="flex justify-between items-start flex-wrap gap-4">
    <div class="flex w-full justify-between">
      <span class=" text-accent text-sm font-semibold mb-2">
        Question {currentQuestionIndex + 1}
      </span>
      {#if mode == "preview" && totalQuestions > 1 && showActions}
        <Button
          btnType="custom"
          title="Remove question"
          on:click={triggerQuestionDelete}
        >
          <Trash2 size={16} class="text-danger" />
        </Button>
      {/if}
    </div>
  </div>

  <!-- Question Text -->
  <div
    class="{mode === 'attempt'
      ? 'text-lg'
      : 'text-base'} leading-relaxed text-slate-900 mb-4 font-semibold"
  >
    {question.text}
  </div>

  <!-- Options -->
  <div class="space-y-4">
    {#key selectedAnswer}
      {#each question.options as option, index (option.id + "-" + (revealAnswer || false))}
        <label
          class="block border-2 rounded-xl py-3 px-4 cursor-pointer transition-all duration-200 text-lg font-medium
          {getOptionClass(option.id)}"
        >
          <input
            type="radio"
            name="question-{question.id}"
            value={option.id}
            checked={selectedAnswer === option.id}
            on:change={() => handleAnswerSelect(option.id)}
            class="sr-only"
            disabled={revealAnswer}
          />
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <div
                class="w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200
                {getOptionStatus(option.id) === 'selected'
                  ? 'border-blue-500 bg-blue-500'
                  : getOptionStatus(option.id) === 'correct' ||
                      getOptionStatus(option.id) === 'correct-selected'
                    ? 'border-emerald-500 bg-emerald-500'
                    : getOptionStatus(option.id) === 'incorrect-selected'
                      ? 'border-red-500 bg-red-500'
                      : 'border-slate-300'}"
              >
                {#if selectedAnswer === option.id || getOptionStatus(option.id) === "correct" || getOptionStatus(option.id) === "correct-selected"}
                  {#if getOptionStatus(option.id) === "correct" || getOptionStatus(option.id) === "correct-selected"}
                    <svg
                      class="w-3 h-3 text-white"
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
                  {:else if getOptionStatus(option.id) === "incorrect-selected"}
                    <svg
                      class="w-3 h-3 text-white"
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
                  {:else}
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                  {/if}
                {/if}
              </div>
            </div>
            <span class="font-semibold text-slate-600 min-w-[1.5rem]">
              {getOptionLabel(index)}.
            </span>
            <span class="flex-1 text-slate-900">
              {option.text}
            </span>
            <!-- Answer status indicators -->
            <div class="flex gap-2">
              {#if revealAnswer}
                {#if question.correct_answer === option.id}
                  <span
                    class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium"
                  >
                    ✓ Correct
                  </span>
                {:else if selectedAnswer === option.id}
                  <span
                    class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md font-medium"
                  >
                    ✗ Your Answer
                  </span>
                {/if}
              {/if}
            </div>
          </div>
        </label>
      {/each}
    {/key}
  </div>

  <!-- Explanation Section (controlled by parent) -->
  {#if revealAnswer && showExplanation && question.explanation}
    <div class="mt-6 pt-6 border-t border-slate-200">
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="text-blue-800 leading-relaxed">
          {question.explanation}
        </div>
      </div>
    </div>
  {/if}
</div>
