<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  export let question;
  export let currentQuestionIndex = 0;
  export let selectedAnswer = null;
  export let revealAnswer = false;
  export let showExplanation = false;
  export let showActions = true;
  export let mode = "attempt";
  export let totalQuestions = 0;

  const dispatch = createEventDispatcher();
  
  function handleAnswerSelect(optionId) {
    console.log(' answered option', optionId, '-----', question.id)
    dispatch("answer", { questionId: question.id, optionId });
  }

  // Returns the style for the option circle based on status
  function getOptionCircleClass(optionId,selectedAnswer) {
    const status = getOptionStatus(optionId,selectedAnswer);
    if (status === "selected") return "border-blue-500 bg-blue-500";
    if (status === "correct" || status === "correct-selected")
      return "border-emerald-500 bg-emerald-500";
    if (status === "incorrect-selected") return "border-red-500 bg-red-500";
    return "border-slate-300";
  }

  function getOptionStatus(optionId,selectedAnswer) {
    const isSelected = selectedAnswer === optionId;
    const isCorrect =
      (question.correct_answer || "").toLowerCase() === optionId.toLowerCase();
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

  function getOptionClass(optionId,selectedAnswer) {
    const status = getOptionStatus(optionId,selectedAnswer);
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

  // Option data (map options to include their respective media arrays)
  $: options = (question.options || []).map((option, idx) => {
    let media = [];
    if (idx === 0) media = question.qmt_option1_media || [];
    if (idx === 1) media = question.qmt_option2_media || [];
    if (idx === 2) media = question.qmt_option3_media || [];
    if (idx === 3) media = question.qmt_option4_media || [];
    return { ...option, media };
  });
</script>

<div
  class="bg-white rounded-xl p-4 shadow-lg border border-slate-200 mb-3 max-w-3xl w-full"
>
  <!-- Question Header -->
  <div class="flex justify-between items-start flex-wrap gap-4">
    <div class="flex w-full justify-between">
      <span class="text-accent text-sm font-semibold mb-2">
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
    <!-- You can add tags for chapter/topic/difficulty if needed -->
  </div>

  <!-- Question Text -->
  <div class="{mode === 'attempt' ? 'text-lg' : 'text-base'} leading-relaxed text-slate-900 mb-4 font-semibold">
    {question.text}
  </div>

  <!-- Question Images -->
  {#if question.qmt_question_text_media && question.qmt_question_text_media.length > 0}
    <div class="flex flex-wrap gap-4 mb-6">
      {#each question.qmt_question_text_media.slice(0, 10) as imgUrl}
        <img
          src={imgUrl}
          alt=""
          class="max-h-40 rounded shadow border border-slate-200"
        />
      {/each}
    </div>
  {/if}

  <!-- Options -->
  <div class="space-y-4">
    
      {#each options as option, index (option.id + "-" + (revealAnswer || false))}
        <label
          class="block border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 font-medium  {getOptionClass(
            option.id,selectedAnswer
          )}"
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
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
              <div
                class={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${getOptionCircleClass(option.id,selectedAnswer)}`}
              >
                {#if getOptionStatus(option.id,selectedAnswer) === "correct" || getOptionStatus(option.id,selectedAnswer) === "correct-selected"}
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
                {:else if getOptionStatus(option.id,selectedAnswer) === "incorrect-selected"}
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
                {:else if getOptionStatus(option.id,selectedAnswer) === "selected"}
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                {/if}
              </div>
              <span class="font-semibold text-slate-600 min-w-[1.5rem]">
                {getOptionLabel(index)}.
              </span>
              <span class="flex-1 text-slate-900 {mode === 'attempt' ? 'text-base' : 'text-sm'}">{option.text}</span>
              <!-- Answer status indicators -->
              <div class="flex gap-2">
                {#if revealAnswer}
                  {#if option.is_correct}
                    <span
                      class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium"
                      >✓ Correct</span
                    >
                  {:else if selectedAnswer === option.id}
                    <span
                      class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md font-medium"
                      >✗ Your Answer</span
                    >
                  {/if}
                {/if}
              </div>
            </div>
            <!-- Option Images -->
            {#if option.media && option.media.length > 0}
              <div class="flex flex-wrap gap-2 mt-2">
                {#each option.media.slice(0, 3) as imgUrl}
                  <img
                    src={imgUrl}
                    alt=""
                    class="max-h-24 rounded border border-slate-200"
                  />
                {/each}
              </div>
            {/if}
          </div>
        </label>
      {/each}
    
  </div>

  <!-- Explanation Section (if needed) -->
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
