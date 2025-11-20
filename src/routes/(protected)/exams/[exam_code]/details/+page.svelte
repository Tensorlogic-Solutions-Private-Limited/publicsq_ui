<script>
  import { goto, invalidate } from "$app/navigation";
  import { Plus, FileText, Eye, Pencil, Trash2 } from "@lucide/svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import NoContentMsg from "$lib/components/reusable/NoContentMsg.svelte";
  import ExamInfoCard from "$lib/components/new-quiz/ExamInfoCard.svelte";
  import SubjectChapterTopicSelector from "$lib/components/new-quiz/SubjectChapterTopicSelector.svelte";
  import NewQuizPreviewModal from "$lib/components/new-quiz/NewQuizPreviewModal.svelte";
  import QuizDeletionModal from "$lib/components/new-quiz/QuizDeletionModal.svelte";
  import Accordion from "$lib/components/reusable/Accordion.svelte";
  import HierarchicalSelectedContentTable from "$lib/components/quiz/HierarchicalSelectedContentTable.svelte";
  import ExamMetadataForm from "$lib/components/new-quiz/ExamMetadataForm.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  import Divider from "$lib/components/reusable/Divider.svelte";

  import { tick, onMount } from "svelte";
  import { authStore } from "$lib/stores/authStore.js";
  import { page } from "$app/stores";
  import { replaceState } from "$app/navigation";

  import LineLoader from "$lib/components/reusable/LineLoader.svelte";

  export let data;

  // ============================================================================
  // PROPS & REACTIVE DECLARATIONS
  // ============================================================================

  // Exam details from preloaded data
  $: examDetails = data.examDetails;
  $: error = data.error;
  $: designs = examDetails?.designs || [];
  $: examStatus = examDetails?.status || "completed";

  const readOnlyExamStates = ["completed", "started"];
  const modifiableExamStates = ["draft", "saved"];
  const savedExam = ["saved"];

  // ============================================================================
  // STATE VARIABLES
  // ============================================================================

  // Loading state
  let invalidating = false; // Loading state for data refresh
  let savingExam = false; // Loading state for saving exam
  let subjectAddSectionRef;

  // Show/hide form for adding new subject
  let newSubjAdditionInProgress = false;

  // UNIFIED preview modal state (replaces showFullExamPreviewModal and showDesignPreviewModal)
  let showPreviewModal = false;
  let previewLoading = false;
  let previewData = null;
  let previewMessage = { type: "", message: "", cbFn: null };
  let previewSettings = {
    showRegenerateButton: false,
    showAddQuestionButton: false,
    showDeleteButton: false,
    deletionUrl: null,
  };
  let previewType = null; // 'full' | 'design'

  // Keep for button spinner compatibility
  let loadingFullExamPreview = false;
  let loadingDesignPreview = false;

  // Notification message state (for both success and error messages)
  let notificationMessage = {
    type: "",
    message: "",
    show: false,
  };

  // Design deletion modal state
  let showDesignDeletionModal = false;
  let designToDelete = null;

  // Keep for design preview compatibility
  let designToPreview = null;

  // Edit exam modal state
  let showEditExamModal = false;

  // Return design actions for a given exam status. By default only the preview (eye) action
  // is returned; when the status is modifiable, the delete action is appended.
  function getDesignActions(status) {
    const actions = [
      {
        icon: Eye,
        handler: "preview",
        color: "text-accent",
        class: "hover:text-blue-800",
      },
    ];

    if (modifiableExamStates.includes(status)) {
      actions.push({
        icon: Trash2,
        handler: "delete",
        color: "text-red-600",
        class: "hover:text-red-800",
      });
    }

    return actions;
  }

  // Reactive assignment so UI updates when `examStatus` changes
  $: designActions = getDesignActions(examStatus);

  function getViewAllQnsBtnName() {
    if (modifiableExamStates.includes(examStatus)) {
      return "Preview Exam";
    }
    return "View All Questions";
  }
  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  onMount(() => {
    // Check if there's a notification from navigation state
    if ($page.state?.notification) {
      notificationMessage = {
        type: $page.state.notification.type || "success",
        message: $page.state.notification.message || "",
        show: true,
      };

      // Clear the state after extracting the notification
      replaceState($page.url.pathname, {});
    }
  });

  // ============================================================================
  // NOTIFICATION HANDLING
  // ============================================================================

  function resetNotificationMessage() {
    notificationMessage = {
      type: "",
      message: "",
      show: false,
    };
  }

  // ============================================================================
  // DATA INVALIDATION WRAPPER
  // ============================================================================

  async function invalidateExamDetails() {
    invalidating = true;
    try {
      await invalidate("exam:details");
    } finally {
      invalidating = false;
    }
  }

  // ============================================================================
  // SUBJECT SECTION MANAGEMENT
  // ============================================================================

  async function handleAddNewSubject() {
    newSubjAdditionInProgress = true;
    // Scroll to the form after it renders
    await tick();
    subjectAddSectionRef?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleDesignCreated(event) {
    const { design } = event.detail;

    // Show success message
    notificationMessage = {
      type: "success",
      message: `Subject section "${design.exam_name}" created successfully!`,
      show: true,
    };

    // Close the form
    newSubjAdditionInProgress = false;

    // Invalidate only this page's load function to refresh exam details
    await invalidateExamDetails();
  }

  function handleCancelSelector() {
    newSubjAdditionInProgress = false;
  }

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  function handleEditExamInfo() {
    if (!modifiableExamStates.includes(examStatus)) {
      return;
    }
    showEditExamModal = true;
  }

  function handleCancelEditExam() {
    showEditExamModal = false;
  }

  async function handleExamEditSuccess(event) {
    const { data, mode } = event.detail;

    // Show success message
    notificationMessage = {
      type: "success",
      message: "Exam details updated successfully!",
      show: true,
    };

    // Close the modal
    showEditExamModal = false;

    // Invalidate only this page's load function to refresh exam details
    await invalidateExamDetails();
  }

  function handleStartExam() {
    if (examDetails?.exam_code) {
      goto(`/exams/${examDetails.exam_code}/attempt`);
    }
  }

  // ============================================================================
  // SAVE EXAM HANDLER
  // ============================================================================

  async function handleSaveExam() {
    if (!examDetails?.exam_code) return;

    savingExam = true;
    try {
      const updateRes = await apiClient(
        `/apis/v2/exams/${examDetails.exam_code}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "saved" }),
        }
      );

      if (!updateRes || !updateRes.ok) {
        // Extract error message from response
        let errorMessage = "Failed to save exam";
        try {
          const errorData = await updateRes.json();
          errorMessage = errorData?.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
        }

        notificationMessage = {
          type: "error",
          message: errorMessage,
          show: true,
        };
        return;
      }

      // Success - show notification and refresh data
      notificationMessage = {
        type: "success",
        message: "Exam saved successfully!",
        show: true,
      };

      await invalidateExamDetails();
    } catch (err) {
      console.error("Error saving exam:", err);
      notificationMessage = {
        type: "error",
        message: err?.message || "An error occurred while saving the exam",
        show: true,
      };
    } finally {
      savingExam = false;
    }
  }

  // ============================================================================
  // DATA FETCHING (Parallel Question Paper Fetching)
  // ============================================================================

  // Retry-enabled fetch function
  async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // Fetch all question papers for all designs in parallel
  async function fetchAllQuestionPapers(designs) {
    const results = await Promise.allSettled(
      designs.map(async (design) => {
        // Get the first paper ID from the papers array
        const paperId = design.papers?.[0];
        if (!paperId) {
          throw new Error(`No paper ID found for design ${design.exam_code}`);
        }

        // Fetch the question paper
        const questionPaper = await fetchWithRetry(
          `/apis/question-papers/${paperId}`
        );

        return {
          design,
          questionPaper,
        };
      })
    );

    const success = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failed = designs.filter((_, i) => results[i].status === "rejected");

    return { success, failed };
  }

  // ============================================================================
  // DATA TRANSFORMATION (Question Format Conversion)
  // ============================================================================

  // Transform questions to QuizRunner format
  function transformQuestionsForQuizRunner(fetchedData) {
    const questions = [];

    fetchedData?.forEach(({ design, questionPaper }) => {
      // Extract questions from the question paper
      const designQuestions = questionPaper.qns || [];

      // Transform each question to match QuizRunner's expected format
      const transformedQuestions = designQuestions?.map((q, index) => {
        // Generate a unique ID if not present
        const questionId = `q_${design.exam_code}_${q.id}_${index}`;

        // Transform options to match QuizRunner format
        let options = [];

        if (q.options && Array.isArray(q.options)) {
          // If options come as an array
          options = q?.options?.map((opt, idx) => ({
            id: opt.id || idx + 1,
            text: opt.text || opt.option_text || "",
            is_correct: opt.is_correct || q.correct_answer === String(idx + 1),
          }));
        }

        const correct_answer = options?.filter((item) => item.is_correct);
        return {
          id: questionId,
          q_code: q.id,
          paper_code: design?.papers?.[0],
          text: q.text || q.question_text || "",
          options: options,
          correct_answer: correct_answer?.[0]?.id,
          explanation: q.explanation || "",
          marks: q.marks || 1,
          // Image-based question fields
          qmt_question_text_media: q.qmt_question_text_media || null,
          qmt_option1_media: q.qmt_option1_media || null,
          qmt_option2_media: q.qmt_option2_media || null,
          qmt_option3_media: q.qmt_option3_media || null,
          qmt_option4_media: q.qmt_option4_media || null,
          // Metadata
          design_code: design.exam_code,
          design_name: design.exam_name,

          subject: design.subject,
          medium: design.medium,
          standard: design.standard,
        };
      });

      questions.push(...transformedQuestions);
    });

    return questions;
  }

  // Build quiz object for QuizRunner
  function buildQuizObject(questions, examDetails, designs) {
    return {
      questions: questions,
      metadata: {
        exam_code: examDetails.exam_code,
        exam_name: examDetails.exam_name,
        total_time: examDetails.total_time,
        total_questions: questions.length,
        exam_mode: examDetails.exam_mode,
        status: examDetails.status,
        board_name: designs[0]?.board_name || "",
        state_name: designs[0]?.state_name || "",
        chapters_topics: designs.map((d) => ({
          subject_name: d.subject,
          standard: d.standard,
          medium: d.medium,
        })),
      },
    };
  }

  // ============================================================================
  // FULL EXAM PREVIEW HANDLERS
  // ============================================================================

  async function handlePreviewFullExam() {
    if (designs.length === 0) {
      notificationMessage = {
        type: "error",
        message: "No exam sections to preview. Please add subjects first.",
        show: true,
      };
      return;
    }

    // Set both legacy flags (for button spinner) and unified state
    loadingFullExamPreview = true;
    previewLoading = true;
    showPreviewModal = true;
    previewType = "full";
    previewMessage = { type: "", message: "", cbFn: null };
    previewSettings = {
      showRegenerateButton: false,
      showAddQuestionButton: false,
      showDeleteButton: false,
      deletionUrl: null,
    };

    try {
      const { success, failed } = await fetchAllQuestionPapers(designs);

      if (failed.length > 0) {
        console.warn(`Failed to fetch ${failed.length} design(s):`, failed);
        previewMessage = {
          type: "error",
          message: `Failed to load questions for ${failed.length} subject section(s)`,
          cbFn: null,
        };
      }

      if (success.length > 0) {
        const allQuestions = transformQuestionsForQuizRunner(success);

        previewData = buildQuizObject(allQuestions, examDetails, designs);
      } else {
        previewMessage = {
          type: "error",
          message: "Failed to load any questions. Please try again.",
          cbFn: handlePreviewFullExam,
        };
      }
    } catch (error) {
      console.error("Error fetching questions for preview:", error);
      previewMessage = {
        type: "error",
        message: "An error occurred while loading questions. Please try again.",
        cbFn: handlePreviewFullExam,
      };
    } finally {
      loadingFullExamPreview = false;
      previewLoading = false;
    }
  }

  function closeUnifiedPreview() {
    showPreviewModal = false;
    previewData = null;
    previewMessage = { type: "", message: "", cbFn: null };
    previewSettings = {
      showRegenerateButton: false,
      showAddQuestionButton: false,
      showDeleteButton: false,
      deletionUrl: null,
    };
    previewType = null;
    designToPreview = null;
  }

  function resetPreviewMessage() {
    previewMessage = { type: "", message: "", cbFn: null };
  }

  // ============================================================================
  // DESIGN DELETION HANDLERS
  // ============================================================================

  async function handleDeleteDesign(design) {
    designToDelete = design;
    await tick();
    showDesignDeletionModal = true;
  }

  function handleCancelDeletion() {
    showDesignDeletionModal = false;
    designToDelete = null;
  }

  async function handleDesignDeleted(event) {
    const { quiz, message } = event.detail;

    // Filter out the deleted design from the list
    examDetails.designs = examDetails?.designs?.filter(
      (d) => d.exam_code !== designToDelete?.exam_code
    );
    examDetails = examDetails; // Trigger reactivity

    // Show success message
    notificationMessage = {
      type: "success",
      message: message || "Design deleted successfully!",
      show: true,
    };

    // Close the modal
    showDesignDeletionModal = false;
    designToDelete = null;
  }

  // ============================================================================
  // DESIGN PREVIEW HANDLERS
  // ============================================================================

  async function handlePreviewDesign(design) {
    designToPreview = design;

    loadingDesignPreview = true;
    previewLoading = true;
    showPreviewModal = true;
    previewType = "design";
    previewMessage = { type: "", message: "", cbFn: null };
    previewSettings = {
      showRegenerateButton: false,
      showAddQuestionButton: true,
      showDeleteButton: true,
      deletionUrl: design?.exam_code
        ? `/apis/designs/${design.exam_code}`
        : null,
    };

    try {
      // Get the first paper ID from the papers array
      const paperId = design.papers?.[0];
      if (!paperId) {
        throw new Error(`No paper ID found for design ${design.exam_code}`);
      }

      // Fetch the question paper
      const questionPaper = await fetchWithRetry(
        `/apis/question-papers/${paperId}`
      );

      // Transform the design and question paper to preview format
      const transformedData = transformDesignToPreviewData(
        design,
        questionPaper
      );

      if (
        !transformedData ||
        !transformedData.questions ||
        transformedData.questions.length === 0
      ) {
        previewMessage = {
          type: "error",
          message: "No questions found for this design",
          cbFn: null,
        };
      } else {
        previewData = transformedData;
      }
    } catch (error) {
      console.error("Error fetching design preview:", error);
      previewMessage = {
        type: "error",
        message: "Failed to load design preview. Please try again.",
        cbFn: () => handlePreviewDesign(design),
      };
    } finally {
      loadingDesignPreview = false;
      previewLoading = false;
    }
  }

  // Transform a single design to preview modal format
  function transformDesignToPreviewData(design, questionPaper) {
    const designQuestions = questionPaper.qns || [];

    // Transform each question to match QuizRunner's expected format
    const transformedQuestions = designQuestions.map((q, index) => {
      const questionId = `q_${design.exam_code}_${q.id}_${index}`;

      let options = [];
      if (q.options && Array.isArray(q.options)) {
        options = q.options.map((opt, idx) => ({
          id: opt.id || idx + 1,
          text: opt.text || opt.option_text || "",
          is_correct: opt.is_correct || q.correct_answer === String(idx + 1),
        }));
      }

      const question_papers = [
        { id: design?.papers?.[0] ? design?.papers?.[0] : null },
      ];
      const correct_answer = options?.filter((item) => item.is_correct);
      return {
        id: questionId,
        q_code: q.id,
        paper_code: design?.papers?.[0],
        question_papers: question_papers,
        text: q.text || q.question_text || "",
        options: options,
        correct_answer: correct_answer?.[0]?.id,
        explanation: q.explanation || "",
        marks: q.marks || 1,
        qmt_question_text_media: q.qmt_question_text_media || null,
        qmt_option1_media: q.qmt_option1_media || null,
        qmt_option2_media: q.qmt_option2_media || null,
        qmt_option3_media: q.qmt_option3_media || null,
        qmt_option4_media: q.qmt_option4_media || null,
        design_code: design.exam_code,
        design_name: design.exam_name,
        subject: design.subject,
        medium: design.medium,
        standard: design.standard,
      };
    });

    return {
      questions: transformedQuestions,
      metadata: {
        design_code: design.exam_code,
        exam_code: design.exam_code,
        exam_name: design.exam_name,
        status: design.status,
        subject: design.subject,
        medium: design.medium,
        exam_type: design.exam_type,
        board_id: design.board_id,
        board_name: design.board_name,
        state_id: design.state_id,
        state_name: design.state_name,
        subject_code: design.subject_code,
        medium_code: design.medium_code,
        division: design.division,
        standard: design.standard,
        chapters_topics: design.chapters_topics,
        question_papers: [
          { id: design?.papers?.[0] ? design?.papers?.[0] : null },
        ],
        total_questions: design.total_questions,
      },
    };
  }

  async function handleDesignPreviewDeleted(event) {
    const { quiz, message } = event.detail;

    // Filter out the deleted design from the list
    examDetails.designs = examDetails.designs.filter(
      (d) => d.exam_code !== designToPreview?.exam_code
    );
    examDetails = examDetails; // Trigger reactivity

    // Close unified preview
    closeUnifiedPreview();

    // Show success message
    notificationMessage = {
      type: "success",
      message: message || "Design deleted successfully!",
      show: true,
    };
  }

  // Action handler for question deletion events from preview modal
  async function handleQuestionDeletionSuccess(event) {
    const { question, message } = event.detail;

    await invalidateExamDetails();
  }

  // Action handler for question addition events from preview modal
  async function handleTempQuestionAddSuccess(event) {
    const { question, message } = event.detail;

    await invalidateExamDetails();
  }
</script>

<div class="bg-white min-h-screen">
  <!-- Page Header -->
  {#if invalidating}
    <LineLoader loaderColor={"bg-accent"} />
  {/if}
  <div
    class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100"
  >
    <div class="max-w-7xl flex justify-between">
      <h1 class="text-xl sm:text-xl font-bold text-dark-gray">Exam Details</h1>
      <div class="flex gap-3">
        <Button
          btnType="secondary"
          disabled={designs.length === 0 ||
            loadingFullExamPreview ||
            newSubjAdditionInProgress}
          on:click={handlePreviewFullExam}
        >
          {#if loadingFullExamPreview}
            <LoadingSpinner size={16} />
          {:else}
            <Eye size={16} />
          {/if}
          {getViewAllQnsBtnName()}
        </Button>

        {#if modifiableExamStates.includes(examStatus)}
          <Button
            btnType="successSecondary"
            disabled={designs.length === 0 || newSubjAdditionInProgress}
            on:click={handleStartExam}
          >
            Start Exam
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-6 py-6">
    <!-- Notification (Success/Error) -->
    {#if error || notificationMessage.show}
      <div class="mb-6">
        <InlineNotification
          kind={notificationMessage.type || "error"}
          title={error || notificationMessage.message}
          on:close={resetNotificationMessage}
        ></InlineNotification>
      </div>
    {/if}

    <!-- Exam Info Section -->
    <ExamInfoCard
      {examDetails}
      {designs}
      onEdit={handleEditExamInfo}
      allowEdit={modifiableExamStates.includes(examStatus)}
    />

    <!-- Subject Chapter Topic Selector (shown when adding new subject) -->

    <!-- Subject-wise Quizzes Section -->
    <div class="bg-white pb-6 mb-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-base font-semibold text-dark-gray">
          Subject Sections {designs?.length ? `- (${designs.length})` : ""}
        </h2>
        {#if !newSubjAdditionInProgress && modifiableExamStates.includes(examStatus)}
          <Button btnType="primary" on:click={handleAddNewSubject}>
            <Plus size={16} class="mr-1" />
            Add Subject Section
          </Button>
        {/if}
      </div>

      <!-- List of Designs/Sub-quizzes -->
      {#if designs?.length === 0 && !newSubjAdditionInProgress}
        <NoContentMsg
          title="No subjects added yet"
          description={'Start adding by clicking on "+ Add Subject section" button'}
          icon={FileText}
        />
      {:else}
        <!-- <div class="flex w-full justify-end mb-2">

          <Button btnType="custom" class="underline text-accent text-sm">Expand all</Button>
      </div> -->
        <div class="space-y-4 mb-6 pb-6">
          {#each designs as design, index (design.exam_code)}
            <Accordion
              title={design.exam_name}
              loading={invalidating}
              isExpanded={true}
              showActions={true}
              actions={designActions}
              on:delete={() => handleDeleteDesign(design)}
              on:preview={() => handlePreviewDesign(design)}
            >
              <!-- Metadata slot -->
              <div slot="metadata" class="flex flex-wrap gap-4 text-sm">
                <div class="flex gap-1 text-gray-500 font-normal">
                  <span class=" ">{design.subject}</span> •
                  <span class="ml-1 text-gray-500">{design.medium} medium</span>
                  •
                  <span class="text-gray-500"
                    >{design.total_questions} Questions</span
                  >
                </div>
              </div>

              <!-- Expandable content: Hierarchical Content Table -->
              {#if design.chapters_topics && design.chapters_topics.length > 0}
                <HierarchicalSelectedContentTable
                  data={design.chapters_topics}
                />
              {:else}
                <div class="text-sm text-gray-500">
                  No chapters or topics selected
                </div>
              {/if}
            </Accordion>
          {/each}
        </div>
      {/if}

      {#if newSubjAdditionInProgress}
        <div
          class="my-6 p-4 border border-gray-200 rounded-lg"
          id="new-section-form"
          bind:this={subjectAddSectionRef}
        >
          <h2 class="text-base font-semibold text-dark-gray mb-4">
            Add New Subject Section
          </h2>
          <SubjectChapterTopicSelector
            {examDetails}
            showActions={modifiableExamStates.includes(examStatus)}
            on:designCreated={handleDesignCreated}
            on:questionDeletionSuccess
            on:cancelSubjSectionAdd={handleCancelSelector}
            on:questionAdditionSuccess={handleTempQuestionAddSuccess}
          />
        </div>
        <Divider />
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between mt-6 flex-wrap gap-4">
      <Button btnType="secondary" on:click={() => goto("/exams")}>
        Back to Exams
      </Button>
      <div class="flex gap-3 flex-wrap">
        <Button
          btnType="secondary"
          disabled={designs.length === 0 ||
            loadingFullExamPreview ||
            newSubjAdditionInProgress}
          on:click={handlePreviewFullExam}
        >
          {#if loadingFullExamPreview}
            <LoadingSpinner size={16} />
          {:else}
            <Eye size={16} />
          {/if}
          {getViewAllQnsBtnName()}
        </Button>
        <!-- {#if !readOnlyExamStates.includes(examStatus)}
          <Button
            btnType="primary"
            disabled={designs.length === 0 ||
              savingExam ||
              newSubjAdditionInProgress}
            on:click={handleSaveExam}
          >
            {#if savingExam}
              <LoadingSpinner size={16} />
            {/if}
            Save Exam
          </Button>
        {/if} -->
        {#if modifiableExamStates.includes(examStatus)}
          <Button
            btnType="success"
            disabled={designs.length === 0 || newSubjAdditionInProgress}
            on:click={handleStartExam}
          >
            Start Exam
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if showPreviewModal}
  <NewQuizPreviewModal
    loadingPreview={previewLoading}
    showActions={modifiableExamStates.includes(examStatus)}
    qpPreviewData={previewData}
    {previewMessage}
    {resetPreviewMessage}
    closePreviewModal={closeUnifiedPreview}
    showRegenerateButton={previewSettings.showRegenerateButton}
    showAddQuestionButton={previewSettings.showAddQuestionButton}
    showDeleteButton={previewSettings.showDeleteButton}
    deletionUrl={previewSettings.deletionUrl}
    on:quizDeletionSuccess={handleDesignPreviewDeleted}
    on:questionDeletionSuccess={handleQuestionDeletionSuccess}
    on:questionAdditionSuccess={handleTempQuestionAddSuccess}
  />
{/if}

{#if showDesignDeletionModal && designToDelete}
  <QuizDeletionModal
    item={designToDelete}
    itemType="Subject section"
    deletionUrl={`/apis/designs/${designToDelete.exam_code}`}
    on:success={handleDesignDeleted}
    on:cancel={handleCancelDeletion}
  />
{/if}

{#if showEditExamModal}
  <Portal>
    <ExamMetadataForm
      mode="edit"
      initialData={examDetails}
      on:success={handleExamEditSuccess}
      on:cancel={handleCancelEditExam}
    />
  </Portal>
{/if}
