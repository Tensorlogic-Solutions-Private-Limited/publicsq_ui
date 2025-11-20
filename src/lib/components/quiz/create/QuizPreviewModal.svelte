<script>
  import { createEventDispatcher } from "svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import QuizRunner from "../QuizRunner.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import AddTempQuesPopup from "$lib/questions/AddTempQuesPopup.svelte";
  import TempQuestionDeletion from "$lib/components/quiz/details/TempQuestionDeletion.svelte";
  import QuizDeletion from "$lib/components/quiz/list/QuizDeletion.svelte";
  import { createQuestionFromSubmission } from "$lib/utils/helper.js";

  const dispatch = createEventDispatcher();

  export let loadingPreview = false;
  export let isDeletingQuiz = false;
  export let questionFormats = [];
  export let qpPreviewData = {};
  export let previewMessage = {
    type: "",
    message: "",
    cbFn: null,
  };
  export let resetPreviewMessage = () => {};
  export let closePreviewModal = () => {};
  export let handleRegenerateQuiz = () => {};
  // export let handleDeleteQuiz = () => {};
  export let handleStartQuizFromPreview = () => {};


// adding these props to control the button visibility of preview modal where they are not required 
  export let showRegenerateButton = true;
  export let showAddQuestionButton = true;
  export let showDeleteButton = true;
  export let deletionUrl = null; // Accept custom deletion URL
  


  let showAddQuestionPopup = false;
  let addQuestionError = {
    type: "",
    message: "",
    cbFn: null,
  };
  let showQuesDeletePopup = false;
  let qnToDelete = null;
  let showQuizDeletionConfirm = false;

  
  let viewState = "minimise";

  function resetAddQuestionError() {
    addQuestionError = {
      type: "",
      message: "",
      cbFn: null,
    };
  }

  async function handleAddQuestion() {
    resetAddQuestionError();
    showAddQuestionPopup = true;
  }

  function closeAddQuestionPopup() {
    showAddQuestionPopup = false;
    resetAddQuestionError();
  }

  // Extract props for AddTempQuesPopup
  $: examdata = qpPreviewData?.metadata || {};
  $: paperId =
    Array.isArray(examdata?.question_papers) &&
    examdata?.question_papers?.length > 0
      ? examdata?.question_papers[0]?.id
      : undefined;

  let addQuestionSuccessMsg = "";

  function handleQuestionFormSubmission(event) {
    const detail = event.detail;
    const result = detail.data;
    const payload = detail.payload;
    addQuestionSuccessMsg = "";
    resetAddQuestionError();

    if (detail.type === "error") {
      addQuestionError = {
        type: "error",
        message: detail.message || "Failed to add question.",
        // cbFn: () => handleQuestionFormSubmission(event), // need to device another way
        cbFn: null,
      };
      return;
    }

    if (detail.type === "success" && result && payload) {
      const newQuestion = createQuestionFromSubmission(result, payload);
      const initialQns = qpPreviewData.questions;
      qpPreviewData.questions = [...initialQns, newQuestion];
      qpPreviewData = qpPreviewData;
      showAddQuestionPopup = false;
      // addQuestionSuccessMsg=`Successfully added question to the end.`
      previewMessage = {
        type: "success",
        message: `Successfully added question to quiz -${newQuestion.text} `,
        cbFn: null,
      };
    }
  }

  async function hanldeDeleteQuesFromQuiz(event) {
    qnToDelete = event.detail;
    showQuesDeletePopup = true;
  }

  function closeDeleteQuesPopup() {
    showQuesDeletePopup = false;
    qnToDelete = null;
  }

  function handleQuestionDeleteSuccess(e) {
    showQuesDeletePopup = false;
    const { question, message } = e.detail;
    if (question && qpPreviewData.questions) {
      qpPreviewData.questions = qpPreviewData.questions.filter(
        (q) => q.id !== question.id
      );
      qpPreviewData = qpPreviewData;
    }

    // Show success message using previewMessage
    previewMessage = {
      type: "success",
      message: message || `Successfully removed question from quiz`,
      cbFn: null,
    };
  }

  function handleDeleteQuizClick() {
    showQuizDeletionConfirm = true;
  }

  function closeQuizDeletionConfirm() {
    showQuizDeletionConfirm = false;
  }

  function handleQuizDeletionSuccess(event) {
    const { quiz, message } = event.detail;
    showQuizDeletionConfirm = false;
    
    // Dispatch the success event to parent component with the success message
    // Parent will handle showing success message via apiRespMsg
    dispatch('quizDeletionSuccess', {
      quiz,
      message: message || `Successfully deleted quiz '${quiz?.exam_name}'`,
    });
  }

  // Create quiz object for deletion component
  $: quizForDeletion = {
    exam_code: examdata.exam_code,
    exam_name: examdata.exam_name,
    status: examdata.status || "draft",
  };

  function handleViewStateToggle() {
    viewState = viewState === "minimise" ? "fullscreen" : "minimise";
  }
</script>

<Portal>
  <div
    class={viewState === "fullscreen" 
      ? "bg-white w-[98%] h-[98vh] rounded-lg overflow-y-auto flex flex-col" 
      : "bg-white w-[90%] sm:w-4/5 max-w-4xl rounded-lg max-h-11/12 overflow-y-auto flex flex-col"}
  >
    <hr class="border-gray-200" />
    {#if loadingPreview}
      <div class="min-h-40">
        <LoadingSpinner />
      </div>
    {:else}
      <QuizRunner
        mode="preview"
        quiz={qpPreviewData}
        {viewState}
        on:closePreview={closePreviewModal}
        on:viewStateToggle={handleViewStateToggle}
        showAnswers={true}
        on:deleteQuestion={hanldeDeleteQuesFromQuiz}
      />
    {/if}
    <div class="my-2 px-4">
      {#if previewMessage.message}
        <div class="mb-2">
          <InlineNotification
            kind={previewMessage.type}
            title={previewMessage.message}
            on:close={resetPreviewMessage}
          >
            {#if previewMessage.type === "error" && previewMessage.cbFn}
              <Button
                slot="actions"
                btnType="secondary"
                on:click={previewMessage.cbFn}>Retry</Button
              >
            {/if}
          </InlineNotification>
        </div>
      {/if}
      <div class="flex gap-2 w-full justify-between flex-wrap">
  <div class="flex gap-2">
    {#if showRegenerateButton}
      <Button btnType="secondary" on:click={handleRegenerateQuiz}>
        <RefreshCw size={16} /> Regenerate Quiz
      </Button>
    {/if}
   
  </div>
  <div class="flex gap-2">
    {#if showDeleteButton}
      <Button
        btnType="danger"
        on:click={handleDeleteQuizClick}
        disabled={isDeletingQuiz}
      >
        <Trash2 size={16} />
        {#if isDeletingQuiz}
          <LoadingSpinner size={16} />
          Deleting...
        {:else}
          Delete quiz
        {/if}
      </Button>
    {/if}
    <Button on:click={handleStartQuizFromPreview}>Start Quiz</Button>
  </div>
</div>
    </div>
  </div>
</Portal>

{#if showAddQuestionPopup}
  <AddTempQuesPopup
    {questionFormats}
    {examdata}
    {addQuestionError}
    {paperId}
    onClose={closeAddQuestionPopup}
    onFormSubmission={handleQuestionFormSubmission}
    {resetAddQuestionError}
  />
{/if}

{#if showQuesDeletePopup}
  <TempQuestionDeletion
    question={qnToDelete}
    questionMetaData={{ exam_code: examdata.exam_code, qp_code: paperId }}
    on:deleteSuccess={handleQuestionDeleteSuccess}
    on:cancel={closeDeleteQuesPopup}
  />
{/if}

{#if showQuizDeletionConfirm}
  <QuizDeletion
    quiz={quizForDeletion}
    deletionUrl={deletionUrl}
    on:success={handleQuizDeletionSuccess}
    on:cancel={closeQuizDeletionConfirm}
  />
{/if}
