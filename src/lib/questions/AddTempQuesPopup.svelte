<script>
  import Portal from "$lib/components/reusable/Portal.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import QuestionForm from "$lib/questions/QuestionForm.svelte";
  import { difficultyLevels, cognitiveLearning } from "$lib/constants.js";
  import LineLoader from "$lib/components/reusable/LineLoader.svelte";
  import { createEventDispatcher } from "svelte";

  export let examdata;
  export let paperId;
  export let endpoint; // API endpoint for adding questions
  // export let chapter_code;
  // export let topic_code;
  // export let subtopic_code;
  export let questionFormats = [];
  export let addQuestionError = {
    type: "",
    message: "",
    cbFn: null,
  };
  export let onClose;
  export let onFormSubmission;
  export let resetAddQuestionError;

  const dispatch = createEventDispatcher();
  let isSubmitting = false;

  let questionTypes = [
    {
      id: "1000",
      name: "MCQ",
    },
  ];

  $: tempQuestionMetadata = {
    subject: examdata.subject,
    medium: examdata.medium,
    standard: examdata.standard,
    state: examdata.state_name,
    board_name: examdata.board_name,
    chapterTopics: examdata.chapters_topics,
  };
  // Forward events
  function handleFormSubmission(event) {
    onFormSubmission && onFormSubmission(event);
  }
  function handleCancel() {
    onClose && onClose();
  }
  function handleSubmissionLoading(e) {
    isSubmitting = e.detail;
  }

 
</script>

<Portal>
  <div
    class="fixed inset-0 flex items-center justify-center z-50 bg-overlay my-auto"
  >
    <div
      class="bg-white rounded-lg shadow-lg max-w-4xl w-full relative max-h-[90%] overflow-y-auto"
    >
      {#if addQuestionError?.message}
        <InlineNotification
          kind={addQuestionError?.type || "error"}
          title="Failed to add question"
          subtitle={addQuestionError?.message}
          on:close={resetAddQuestionError}
        >
          <span slot="actions">
            {#if addQuestionError?.type === "error" && addQuestionError?.cbFn}
              <Button btnType="secondary" on:click={addQuestionError.cbFn}
                >Retry</Button
              >
            {/if}
          </span>
        </InlineNotification>
      {/if}
      {#if isSubmitting}
        <div class="mb-4">
          <LineLoader loaderColor={"bg-red-600"} />
        </div>
      {/if}
      <QuestionForm
        mode="add-temp"
        formats={questionFormats}
        {endpoint}
        tempQuestionAdd={true}
        {tempQuestionMetadata}
        {difficultyLevels}
        {cognitiveLearning}
        {questionTypes}
        existingQuestion={{
          state_id: examdata.state_id || "",
          board_id: examdata.board_id || "",
          medium_code: examdata.medium_code || "",
          standard: examdata.standard || "",
          subject_code: examdata.subject_code || "",
          // chapter_code: chapter_code || "",
          // topic_code: topic_code || null,
          // subtopic_code: subtopic_code || null,
          difficulty_id: "1",
          cognitive_learning_id: "1",
          type_code: "1000",
          format_code: "5000",
        }}
        on:formSubmission={handleFormSubmission}
        on:cancel={handleCancel}
        on:submissionInProgress={handleSubmissionLoading}
      />
    </div>
  </div>
</Portal>
