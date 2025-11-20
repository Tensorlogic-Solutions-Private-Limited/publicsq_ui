<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import Modal from "$lib/components/reusable/Modal.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import QuizAttemptHeader from "./attempt/QuizAttemptHeader.svelte";
  import {
    quizSessionStore,
    quizRemarksStore,
    remarksHelpers,
  } from "$lib/stores/quizStore.js";

  import QuestionRemarks from "$lib/components/quiz/QuestionRemarks.svelte";
  import TextQuestionInPreview from "$lib/components/quiz/TextQuestionInPreview.svelte";
  import {
    decodeHTMLEntities,
    cleanQuestionText,
  } from "$lib/utils/textUtils.js";
  import { goto } from "$app/navigation";
  import ImageBasedQuestionInPreview from "./ImageBasedQuestionInPreview.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  import QnListingTable from "$lib/questions/QnListingtable.svelte";
  // import GroupButton from "../reusable/GroupButton.svelte";
  import GroupButton from "$lib/components/reusable/GroupButton.svelte";
  import { List, Presentation } from "@lucide/svelte";
  import { page } from "$app/stores";
  const dispatch = createEventDispatcher();

  export let quiz = null;
  export let showAnswers = false;
  export let mode = "attempt"; //attempt || preview
  export let viewState = "minimise";
  export let showActions = true
  

  // Quiz state
  let questions = [];
  let currentQuestionIndex = 0;
  let selectedAnswer = null;
  let answers = {};
  let questionRemarks = {};
  let revealedAnswers = {};
  let showExplanations = {};
  let timeRemaining = 900;
  let startTime = null;
  let isCompleted = false;
  let isPaused = false;
  let submitting = false;

  // UI state
  let questionNavigationOpen = false;
  let showSubmitConfirmation = false;
  let showExitConfirmation = false;

  // Error state
  let errorMessage = {
    type: "",
    message: "",
    show: false,
  };

  // Add view mode state
  let currentViewMode = "presentation";

  // Font size state
  let fontSize = "medium";
  let quizContainer = null;

  // Current question
  $: currentQuestion = questions[currentQuestionIndex];
  $: selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  // Subscribe to remarks store
  $: quizRemarksStore.subscribe((remarks) => {
    questionRemarks = remarks || {};
  });

  const tableHeadersDisplay = [{ key: "text", name: "Question", width: "50%" }];

  // Initialize quiz when component loads
  let isMounted = false;
  onMount(() => {
    isMounted = true;
  });

  // Define the view mode buttons
  $: viewModeButtons = [
    {
      value: "presentation",
      text: "Presentation",
      icon: Presentation,
      title: "Presentation view - single question display",
    },
    {
      value: "list",
      text: "List",
      icon: List,
      title: "List view - all questions at once",
    },
  ];

  function handleViewModeChange(event) {
    setViewMode(event.detail.value);
  }
  // Mapping the questions
  $: qnListingTableQuestions = questions.map((q) => ({
    code: q.id,
    id: q.id,
    text: q.text,
    type: "MCQ",
    marks: 1,
    correct_answer: q.options?.find((opt) => opt.is_correct)?.id || "",
    format_code:
      q.qmt_question_text_media ||
      q.qmt_option1_media ||
      q.qmt_option2_media ||
      q.qmt_option3_media ||
      q.qmt_option4_media
        ? "6000"
        : "1000",
    is_image: !!(
      q.qmt_question_text_media ||
      q.qmt_option1_media ||
      q.qmt_option2_media ||
      q.qmt_option3_media ||
      q.qmt_option4_media
    ),
    option1: q.options?.[0]?.text || "",
    option2: q.options?.[1]?.text || "",
    option3: q.options?.[2]?.text || "",
    option4: q.options?.[3]?.text || "",
    qmt_option1_media: q.qmt_option1_media || [],
    qmt_option2_media: q.qmt_option2_media || [],
    qmt_option3_media: q.qmt_option3_media || [],
    qmt_option4_media: q.qmt_option4_media || [],
    qmt_question_text_media: q.qmt_question_text_media || [],
    selected_option: answers[q.id] || null,
    is_revealed: !!revealedAnswers[q.id],
    options: q.options || [],
  }));

  $: initializeQuiz(isMounted, quiz);

  function initializeQuiz() {
    if (!isMounted) return;

    if (!quiz || !quiz.questions) {
      dispatch("error", "Invalid quiz data");
      return;
    }

    // Clean all question data when initializing
    questions = quiz?.questions?.map((question) => {
      const cleaned = cleanQuestionText(question);

      // Also clean options
      if (cleaned.options && Array.isArray(cleaned.options)) {
        cleaned.options = cleaned.options.map((option) => ({
          ...option,
          text: decodeHTMLEntities(option.text || option.option_text || ""),
        }));
      }

      // Clean explanation
      if (cleaned.explanation) {
        cleaned.explanation = decodeHTMLEntities(cleaned.explanation);
      }

      return cleaned;
    });
   
    startTime = new Date();
    currentQuestionIndex = 0;
    answers = {};
    questionRemarks = {};
    revealedAnswers = {};
    showExplanations = {};
    isCompleted = false;
    isPaused = false;

    // Initialize session store
    quizSessionStore.set({
      startTime,
      currentQuestionIndex,
      answers,
      remarks: questionRemarks,
      timeRemaining,
      isCompleted,
      isPaused,
    });

    loadCurrentAnswer();
  }



  function loadCurrentAnswer() {
    if (currentQuestion) {
      selectedAnswer = answers[currentQuestion.id] || null;
    }
  }

  function handleAnswerSelect(optionId) {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    selectedAnswer = optionId;
    answers[currentQuestion.id] = optionId;

    // Update session store
    quizSessionStore.update((session) => ({
      ...session,
      answers: { ...answers },
    }));
  }

  function handleRemarkSave(event) {
    const { questionId, remarks } = event.detail;
    remarksHelpers.saveRemark(questionId, remarks);
  }

  function revealAnswer(questionId) {
    revealedAnswers[questionId] = true;
    // Force reactivity by reassigning the object
    revealedAnswers = { ...revealedAnswers };
  }

  function getQuestionStatus(index) {
    const question = questions[index];
    if (!question) return "unanswered";

    return answers[question.id] ? "answered" : "unanswered";
  }

  function goToQuestion(event) {
    const { index } = event.detail;
    if (index >= 0 && index < questions.length) {
      currentQuestionIndex = index;
      loadCurrentAnswer();
      questionNavigationOpen = false;

      // Switch to presentation view when navigating to a specific question
      currentViewMode = "presentation";
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      loadCurrentAnswer();
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      loadCurrentAnswer();
    }
  }

  function handleSubmitClick() {
    showSubmitConfirmation = true;
  }

  function confirmSubmit() {
    showSubmitConfirmation = false;
    submitQuiz();
  }

  function cancelSubmit() {
    showSubmitConfirmation = false;
  }

  async function updateExamStatus(examCode) {
    try {
      const updateRes = await apiClient(`/apis/v2/exams/${examCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!updateRes || !updateRes.ok) {
        // Extract error message from response by parsing JSON
        try {
          const errorData = await updateRes.json();
          const errorMessage = errorData?.error;
          throw new Error(errorMessage);
        } catch (jsonError) {
          // If JSON parsing fails, use a generic error message
          throw new Error(jsonError.message || "Failed to update exam status");
        }
      }
      return updateRes;
    } catch (err) {
      throw new Error(err?.message || "Error updating exam status");
    }
  }

  async function submitQuiz() {
    submitting = true;
    isCompleted = true;

    try {
      const endTime = new Date();
      const timeTaken = endTime - startTime;

      const quizResults = {
        quiz,
        config: {},
        session: {
          startTime,
          endTime,
          timeTaken,
          answers,
          remarks: questionRemarks,
          totalQuestions: questions.length,
          attemptedQuestions: Object.keys(answers).length,
        },
      };

      quizSessionStore.update((session) => ({
        ...session,
        isCompleted: true,
        answers,
        remarks: questionRemarks,
      }));

      // PATCH API call before dispatching complete
      try {
        await updateExamStatus(quiz.metadata.exam_code);
        // Only dispatch complete if PATCH is successful
        dispatch("complete", quizResults);
      } catch (err) {
        console.error("Error updating exam status:", err.message);
        errorMessage = {
          type: "error",
          message:
            err?.message || "Failed to update exam status. Please try again.",
          show: true,
        };
        submitting = false;
        isCompleted = false;
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      dispatch("error", "Failed to submit quiz. Please try again.");
      submitting = false;
      isCompleted = false;
    }
  }

  function handleKeydown(event) {
    if (isPaused || isCompleted) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        previousQuestion();
        break;
      case "ArrowRight":
        event.preventDefault();
        nextQuestion();
        break;
      case "1":
      case "2":
      case "3":
      case "4":
        if (currentQuestion && currentQuestion.options) {
          const optionIndex = parseInt(event.key) - 1;
          if (optionIndex < currentQuestion.options.length) {
            handleAnswerSelect(currentQuestion.options[optionIndex].id);
          }
        }
        break;
    }
  }

  // Switch view mode
  function setViewMode(mode) {
    currentViewMode = mode;
  }

  // Reactive statements
  $: currentQuestionStatus = currentQuestion
    ? revealedAnswers[currentQuestion.id] === true
    : false;
  $: answeredCount = Object.keys(answers).length;
  $: unansweredCount = questions.length - answeredCount;
  $: currentQuestionRevealed =
    currentQuestion && revealedAnswers[currentQuestion.id] === true;
  $: currentQuestionAnswered =
    currentQuestion && answers[currentQuestion.id] !== undefined;

  function handleConfirmExit() {
    showExitConfirmation = true;
  }
  function handleExitConfirm() {
    //ask for confirmation
    dispatch("back");
  }
  function handleExitCancel() {
    showExitConfirmation = false;
  }

  // Font size management - just forward the event
  function handleFontSizeChange(event) {
    const { size, scale } = event.detail;
    fontSize = size;

    // Forward the event to parent component
    dispatch("fontSizeChange", { size, scale });
  }

  function resetErrorMessage() {
    errorMessage = {
      type: "",
      message: "",
      show: false,
    };
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  bind:this={quizContainer}
  class={` w-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-200 ${mode === "preview" ? "h-full" : "min-h-screen"}`}
  data-quiz-runner="true"
  style="--font-scale: 1; "
>
  <!-- Error Notification -->
  {#if errorMessage.show}
    <div class="px-4 pt-4">
      <InlineNotification
        kind={errorMessage.type}
        title={errorMessage.message}
        on:close={resetErrorMessage}
      />
    </div>
  {/if}

  <div class="bg-white border-b-2 border-slate-200 px-4 py-2 shadow-lg">
    <div class="flex items-center justify-between w-full">
      <QuizAttemptHeader
        {quiz}
        {mode}
        {viewState}
        {currentQuestionIndex}
        {questions}
        {answeredCount}
        {revealedAnswers}
        {fontSize}
        on:closePreview
        on:exitQuiz={handleConfirmExit}
        on:viewStateToggle
        on:goToQuestion={(e) => goToQuestion(e.detail.index)}
        on:fontSizeChange={handleFontSizeChange}
        {getQuestionStatus}
      />
    </div>
  </div>

  <!-- View switcher for presentation and list  -->
  {#if mode === "preview"}
    <div class=" w-full flex justify-center mt-6 gap-2">
      <GroupButton
        buttons={viewModeButtons}
        activeButton={currentViewMode}
        size="md"
        variant="primary"
        on:buttonClick={handleViewModeChange}
      />
    </div>
  {/if}
  <!-- Main Quiz Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Question Content Area -->
    <div class="flex-1 flex flex-col overflow-y-auto">
      {#if currentViewMode === "presentation" && currentQuestion}
        <!-- Presentation View (Single Question) -->
        <div class="flex-1 py-4 mx-auto w-full h-full flex justify-center">
          <div
            class=" flex 1000px:flex-row flex-col 1000px:flex-nowrap flex-wrap gap-4 w-full px-4"
          >
            <!-- Teacher Remarks Section -->

            <div
              class={`${mode === "attempt" ? "w-full 1000px:w-4/6" : "w-full"} flex flex-col items-center  `}
            >
              {#if currentQuestion.qmt_question_text_media || currentQuestion.qmt_option1_media || currentQuestion.qmt_option1_media || currentQuestion.qmt_option2_media || currentQuestion.qmt_option3_media}
                <ImageBasedQuestionInPreview
                  question={currentQuestion}
                  {currentQuestionIndex}
                  {selectedAnswer}
                  totalQuestions={questions?.length ? questions?.length : 0}
                  revealAnswer={currentQuestionRevealed}
                  showExplanation={showExplanations[currentQuestion.id]}
                  on:answer={(e) => handleAnswerSelect(e.detail.optionId)}
                  on:deleteQuestion
                  {mode}
                  {showActions}
                />
              {:else}
                <TextQuestionInPreview
                  question={currentQuestion}
                  {currentQuestionIndex}
                  {selectedAnswer}
                  totalQuestions={questions?.length ? questions?.length : 0}
                  revealAnswer={currentQuestionRevealed}
                  showExplanation={showExplanations[currentQuestion.id]}
                  on:answer={(e) => handleAnswerSelect(e.detail.optionId)}
                  on:deleteQuestion
                  {mode}
                  {showActions}
                />
              {/if}

              <!-- Action Buttons Row: Reveal Answer + Navigation Controls -->

              <div class="mt-6 border-slate-200 pb-2">
                <!-- Reveal Answer Button (disabled until answered, hidden if already revealed or not in practice mode) -->

                <!-- Navigation Controls -->
                <div class="flex gap-4 ml-auto flex-wrap">
                  {#if showAnswers}
                    <Button
                      on:click={() => revealAnswer(currentQuestion.id)}
                      disabled={!currentQuestionAnswered}
                      btnType="secondary"
                      title="Click to reveal the correct answer"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Reveal Answer
                    </Button>
                  {/if}
                  <Button
                    on:click={previousQuestion}
                    btnType="secondary"
                    disabled={currentQuestionIndex === 0}
                    customClass="flex items-center gap-2   hover:bg-slate-50 hover:border-slate-400 transition-all duration-200  disabled:cursor-not-allowed "
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </Button>

                  <Button
                    on:click={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                    <svg
                      class="w-5 h-5"
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
                  </Button>
                  {#if mode === "attempt"}
                    <Button
                      on:click={handleSubmitClick}
                      disabled={submitting ||
                        currentQuestionIndex !== questions.length - 1}
                      btnType="custom"
                      class="flex items-center gap-2 px-6 py-1  rounded-[4px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 font-medium disabled:cursor-not-allowed"
                    >
                      {#if submitting}
                        <div
                          class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                        ></div>
                      {/if}
                      Submit Exam
                    </Button>
                  {/if}
                </div>
              </div>
            </div>
            {#if mode === "attempt"}
              <div class="w-full 1000px:w-2/6 max-h-80">
                <QuestionRemarks
                  questionId={currentQuestion.id}
                  remarks={questionRemarks[currentQuestion.id]?.text || ""}
                  placeholder="Add notes about student responses, common mistakes, or teaching points..."
                  on:save={handleRemarkSave}
                />
              </div>
            {/if}
          </div>
        </div>
      {:else if currentViewMode === "list"}
        <!-- List View using QnListingTable with proper data mapping -->
        <div class="flex-1 p-6 mx-auto w-full overflow-y-auto">
          <div class="bg-white rounded-lg shadow border border-slate-200">
            <QnListingTable
              questions={qnListingTableQuestions}
              board={quiz?.metadata?.board_name || ""}
              state=""
              subject={quiz?.metadata?.chapters_topics?.[0]?.subject_name || ""}
              showOptions={true}
              {showAnswers}
              {mode}
              on:selectOption={(event) => {
                const { questionId, optionId } = event.detail;
                handleAnswerSelect(optionId);
              }}
              on:viewQuestion={(event) => {
                const index = questions.findIndex(
                  (q) => q.id === event.detail.questionId
                );
                if (index !== -1) goToQuestion(index);
              }}
              on:revealAnswer={(event) => {
                revealAnswer(event.detail.questionId);
              }}
              showActions={false}
              {tableHeadersDisplay}
            />
          </div>

          <!-- Submit Button (Only in list view and attempt mode) -->
          {#if mode === "attempt"}
            <div class="sticky bottom-4 right-0 text-right mt-6">
              <Button
                on:click={handleSubmitClick}
                disabled={submitting}
                btnType="custom"
                class="flex items-center gap-2 px-6 py-2 rounded-[4px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 font-medium disabled:cursor-not-allowed ml-auto"
              >
                {#if submitting}
                  <div
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                {/if}
                Submit Exam
              </Button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Submit Confirmation Modal -->
<Modal
  isOpen={showSubmitConfirmation}
  closeModal={cancelSubmit}
  title="Confirm submission"
>
  <div class="text-center p-2">
    <svg
      class="w-16 h-16 text-yellow-500 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.1 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
    <h3 class="text-xl font-semibold text-slate-900 mb-2">Submit Exam?</h3>
    <p class="text-slate-600 mb-2">
      You have answered {answeredCount} out of {questions.length} questions.
    </p>
    {#if unansweredCount > 0}
      <p class="text-red-600 text-sm mb-6">
        {unansweredCount} question{unansweredCount > 1 ? "s" : ""} will be marked
        as unanswered.
      </p>
    {:else}
      <p class="text-emerald-600 text-sm mb-6">
        All questions have been answered.
      </p>
    {/if}
    <div class="flex gap-3 justify-center">
      <Button on:click={cancelSubmit} btnType="secondary">Continue exam</Button>
      <Button
        on:click={confirmSubmit}
        class="basic-btn bg-emerald-600 text-white  hover:bg-emerald-700 transition-all duration-200 font-medium"
      >
        Submit Now
      </Button>
    </div>
  </div>
</Modal>

{#if showExitConfirmation}
  <Portal>
    <div
      class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 flex flex-col items-center justify-center"
    >
      <h2 class="heading-L mb-4">Confirm exit</h2>
      <p class="mb-6 text-center font-medium">
        Are you sure to exit this exam?
      </p>

      <div class="flex gap-4 justify-center w-full">
        <Button btnType="secondary" on:click={handleExitCancel}>Cancel</Button>
        <Button btnType="danger" on:click={handleExitConfirm}>Confirm</Button>
      </div>
    </div>
  </Portal>
{/if}

<style>
  .quiz-fullscreen {
    font-size: calc(1rem * var(--font-scale));
  }
</style>
