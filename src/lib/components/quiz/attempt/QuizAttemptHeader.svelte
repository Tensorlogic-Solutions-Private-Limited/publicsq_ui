<script>
  import Button from "$lib/components/reusable/Button.svelte";
  import CloseBtn from "@lucide/svelte/icons/x";
  import { Maximize, Minimize } from "@lucide/svelte";
  import FontSizeSelector from "$lib/components/quiz/attempt/FontSizeSelector.svelte";
  import QuestionNavigation from "$lib/components/quiz/attempt/QuestionNavigation.svelte";
  import { createEventDispatcher } from "svelte";

  export let quiz = null;
  export let mode = "attempt";
  export let viewState = "minimise";
  export let currentQuestionIndex = 0;
  export let questions = [];
  export let revealedAnswers = {};
  export let getQuestionStatus = () => "unanswered";
  export let fontSize = "medium";

  const dispatch = createEventDispatcher();
  function handleClosePreview() {
    dispatch("closePreview");
  }
  function handleViewStateToggle() {
    dispatch("viewStateToggle");
  }
  function handleExitQuiz() {
    dispatch("exitQuiz");
  }

  function handleGoToQuestion(index) {
    dispatch("goToQuestion", { index });
  }

  function handleFontSizeChange(event) {
    dispatch("fontSizeChange", event.detail);
  }
</script>

<div class="w-full">
  {#if mode === "attempt"}
    <div class="flex w-full justify-between items-center flex-wrap gap-4">
      <!-- <div>
       
      </div> -->
       <h1 class="text-base font-semibold text-slate-900 mb-0.5">
          {quiz?.metadata?.exam_name || "Quiz"}
        </h1>
        <p class="text-xs text-slate-600 flex items-center gap-2">
          <span>Q {currentQuestionIndex + 1} of {questions.length}</span>
          <span
            class="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
          >
            Attempt
          </span>
        </p>
      <div class="flex gap-8 justify-between items-center flex-1">
        <!-- <div class="900px:block hidden ">
          <QuestionNavigation
            {questions}
            {currentQuestionIndex}
            {revealedAnswers}
            {getQuestionStatus}
            on:goToQuestion={handleGoToQuestion}
          />
        </div> -->
        <!-- <QuestionNavigation
          {questions}
          {currentQuestionIndex}
          {revealedAnswers}
          {getQuestionStatus}
          on:goToQuestion={handleGoToQuestion}
        /> -->
        <div class="flex items-center gap-2 ml-auto">
          {#if mode === "attempt"}
            <FontSizeSelector
              currentSize={fontSize}
              on:fontSizeChange={handleFontSizeChange}
            />
          {/if}
          <Button on:click={handleExitQuiz} btnType="danger" title="Exit Exam">
            <CloseBtn size={16} />
            Exit exam
          </Button>
        </div>
      </div>
    </div>
    <div class=" flex w-full mt-2 pt-2 border-t border-t-gray-200">
      <QuestionNavigation
        {questions}
        {currentQuestionIndex}
        {revealedAnswers}
        {getQuestionStatus}
        on:goToQuestion={handleGoToQuestion}
      />
    </div>
  {/if}
  {#if mode === "preview"}
    <div class="flex w-full justify-between">
      <h1 class="text-base font-semibold text-slate-900 mb-0.5">
        {quiz?.metadata?.exam_name || "Quiz"}
      </h1>
      <div class="flex gap-2 items-center">
        <div>
          <p class="text-xs text-slate-600 flex items-center gap-2">
            <span>Q {currentQuestionIndex + 1} of {questions.length}</span>
            <span
              class="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
            >
              Preview
            </span>
          </p>
        </div>
        <Button
          btnType="custom"
          title={viewState === "minimise"
            ? "View Fullscreen"
            : "Exit Fullscreen"}
          class="hover:bg-gray-50 px-1 rounded-sm hover:cursor-pointer"
          on:click={handleViewStateToggle}
        >
          {#if viewState === "minimise"}
            <Maximize size={20} />
          {:else}
            <Minimize size={20} />
          {/if}
        </Button>
        <Button
          btnType="custom"
          title="Close preview"
          class="hover:bg-gray-50 px-1 rounded-sm hover:cursor-pointer"
          on:click={handleClosePreview}
        >
          <CloseBtn />
        </Button>
      </div>
    </div>
  {/if}
</div>
