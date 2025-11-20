<script>
  import { createEventDispatcher, onMount } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import SubjectCard from "$lib/components/quiz/create/SubjectCard.svelte";
  import NestedSelectionTable from "$lib/components/quiz/NestedSelectionTable.svelte";
  import QuizDeletionModal from "$lib/components/new-quiz/QuizDeletionModal.svelte";
  import NewQuizClassSubjectMediumForm from "$lib/components/new-quiz/create/NewQuizClassSubjectMediumForm.svelte";
  import ToggleButton from "$lib/components/reusable/ToggleButton.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  import { getSubjectIcon } from "$lib/utils/helper.js";
  import { Trash2 } from "@lucide/svelte";
  import NewQuizPreviewModal from "$lib/components/new-quiz/NewQuizPreviewModal.svelte";
  import NoContentMsg from "$lib/components/reusable/NoContentMsg.svelte";
  import { FileText } from "@lucide/svelte";

  const dispatch = createEventDispatcher();

  // ============================================================================
  // PROPS
  // ============================================================================
  export let questionFormats = []; // For preview modal
  export let examDetails = {};
  export let showActions = true;

  // ============================================================================
  // STATE VARIABLES
  // ============================================================================

  // States list for the form
  let statesList = [];
  let boardsList = [];
  let mediumsList = [];

  // Track prefetch errors
  let prefetchErrors = [];

  // Subject cards for UI
  let subjectCards = [];
  let selectedCard = null;
  let isLoadingCards = true;
  let selectionMode = "auto"; // "auto" for cards, "manual" for form
  let toggleBtnRef = null;

  // Chapter/Topics data
  let chaptersTopics = [];
  let selectedCodes = [];
  let loadingChaptersTopics = false;
  let chaptersTopicsError = null;

  // Store form data for later use
  let currentFormData = null;

  // Quiz configuration
  let quizName = "";
  let questionCount = 5;

  // Loading states for actions
  let isCreatingDraft = false;
  let isGeneratingPreview = false;

  // Error/Success messages
  let actionMessage = {
    type: "",
    message: "",
    show: false,
  };

  // Store created design response
  let currentDesign = null;

  // Preview modal state
  let showPreviewModal = false;
  let previewData = {};
  let previewMessage = {
    type: "",
    message: "",
    show: false,
  };

  // Deletion modal state
  let showDeleteModal = false;
  let isDeletingQuiz = false;

  // ============================================================================
  // LIFECYCLE - Fetch initial data on component mount
  // ============================================================================
  onMount(() => {
    fetchInitialData();
    fetchQuestionFormats();
    loadExistingDesigns();
  });

  // ============================================================================
  // DATA FETCHING - API calls to fetch dropdown data
  // ============================================================================

  // Fetch states, boards and mediums in parallel
  async function fetchInitialData() {
    try {
      const [statesRes, boardsRes, mediumsRes] = await Promise.all([
        apiClient("/apis/states"),
        apiClient("/apis/boards"),
        apiClient("/apis/mediums"),
      ]);

      // Handle states response
      if (statesRes && statesRes.ok) {
        const statesData = await statesRes.json();
        statesList = (statesData?.data || statesData).map((s) => ({
          id: s.state_id || s.id,
          name: s.state_name || s.name,
        }));
        // Remove states from error list if successful
        prefetchErrors = prefetchErrors.filter((e) => e !== "states");
      } else {
        if (!prefetchErrors.includes("states")) {
          prefetchErrors = [...prefetchErrors, "states"];
        }
      }

      // Handle boards response
      if (boardsRes && boardsRes.ok) {
        const boardsData_raw = await boardsRes.json();
        boardsList = (boardsData_raw?.data || boardsData_raw).map((b) => ({
          id: b.board_id || b.id,
          name: b.board_name,
        }));
        // Remove boards from error list if successful
        prefetchErrors = prefetchErrors.filter((e) => e !== "boards");
      } else {
        if (!prefetchErrors.includes("boards")) {
          prefetchErrors = [...prefetchErrors, "boards"];
        }
      }

      // Handle mediums response
      if (mediumsRes && mediumsRes.ok) {
        const mediumsData_raw = await mediumsRes.json();
        mediumsList = (mediumsData_raw?.data || mediumsData_raw).map((m) => ({
          id: m.medium_code,
          name: m.medium_name,
        }));
        // Remove mediums from error list if successful
        prefetchErrors = prefetchErrors.filter((e) => e !== "mediums");
      } else {
        if (!prefetchErrors.includes("mediums")) {
          prefetchErrors = [...prefetchErrors, "mediums"];
        }
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      if (!prefetchErrors.includes("states")) {
        prefetchErrors = [...prefetchErrors, "states"];
      }
      if (!prefetchErrors.includes("boards")) {
        prefetchErrors = [...prefetchErrors, "boards"];
      }
      if (!prefetchErrors.includes("mediums")) {
        prefetchErrors = [...prefetchErrors, "mediums"];
      }
    }
  }

  // Load existing designs to generate subject cards
  async function loadExistingDesigns() {
    isLoadingCards = true;
    try {
      // Fetch latest draft designs (limited) from the API and generate cards from them
      const url = `/apis/designs?status=draft&limit=20`;
      const res = await apiClient(url);
      if (!res || !res.ok) {
        return;
      }

      const data = await res.json().catch(() => ({}));

      let designsByCode = (examDetails?.designs || []).reduce((acc, d) => {
        if (d && d.exam_code) acc[d.exam_code] = d;
        return acc;
      }, {});

      const existingCodes = new Set(Object.keys(designsByCode));
      const designsFromApi = (data?.exams || []).filter(
        (item) =>
          item &&
          item.exam_code &&
          !existingCodes.has(item.exam_code) &&
          item.exam_code !== examDetails.exam_code
      );
      if (designsFromApi && designsFromApi.length > 0) {
        generateSubjectCardsFromDesigns(designsFromApi);
      }
    } catch (err) {
      console.error("Error loading designs:", err);
    } finally {
      isLoadingCards = false;
    }
  }

  // Generate subject cards from existing designs
  function generateSubjectCardsFromDesigns(designs) {
    if (!designs || !Array.isArray(designs) || designs.length === 0) {
      subjectCards = [];
      return;
    }

    const uniqueCards = new Map();

    designs.forEach((design) => {
      const uniqueKey = `state:${design.state_id}-board:${design.board_id}-med:${design.medium_code}-std:${design.standard}-div:${design.division || ""}-subj:${design.subject_code}`;
      if (!uniqueCards.has(uniqueKey)) {
        const card = {
          id: uniqueKey,
          subject: design.subject,
          subject_code: design.subject_code,
          standard: design.standard,
          division: design.division || "",
          medium_code: design.medium_code,
          medium_name: design.medium,
          board_id: design.board_id,
          board_name: design.board_name,
          state_id: design.state_id,
          state_name: design.state_name,
          icon: getSubjectIcon(design.subject),
        };
        uniqueCards.set(uniqueKey, card);
      }
    });

    subjectCards = Array.from(uniqueCards.values());
    // Auto-select the first card if available
    if (subjectCards.length > 0) {
      selectSubjectCard(subjectCards[0]);
    }
  }

  // Handle card selection
  async function selectSubjectCard(card) {
    selectedCard = card;

    // Set form data from card
    currentFormData = {
      classId: card.standard,
      className: `Class ${card.standard}`,
      division: card.division,
      subjectId: card.subject_code,
      subjectName: card.subject,
      mediumId: card.medium_code,
      mediumName: card.medium_name,
      boardId: card.board_id,
      boardName: card.board_name,
      stateId: card.state_id,
      stateName: card.state_name,
    };

    // Clear previous selections
    selectedCodes = [];
    chaptersTopics = [];
    chaptersTopicsError = null;

    // Load chapters/topics since we have all required fields now
    await fetchChaptersTopics(currentFormData);
  }

  // Toggle between auto (cards) and manual (form) selection modes
  function setSelectionMethod(e) {
    const { checked } = e.detail;
    selectionMode = checked ? "auto" : "manual";
  }

  // Handle retry for failed prefetch operations
  function handleRetryPrefetch() {
    fetchInitialData();
  }

  // Fetch question formats on mount
  async function fetchQuestionFormats() {
    try {
      const response = await apiClient("/apis/formats");
      if (!response) return;
      if (!response.ok) return;

      const data = await response.json();
      questionFormats = (data.data || []).map((f) => ({
        id: f.qfm_format_code,
        name: f.qfm_format_name,
      }));
    } catch (err) {
      console.error("Error fetching question formats:", err);
      questionFormats = [];
    }
  }

  // Fetch chapters/topics based on class, subject, and medium
  async function fetchChaptersTopics(formData) {
    const { classId, subjectId, mediumId, stateId, boardId } = formData;

    if (!classId || !subjectId || !mediumId) {
      return;
    }

    loadingChaptersTopics = true;
    chaptersTopicsError = null;
    chaptersTopics = [];
    selectedCodes = [];

    try {
      const params = new URLSearchParams();
      params.append("standard", classId);
      params.append("subject_code", subjectId);
      params.append("medium_code", mediumId);
      params.append("board_id", boardId);
      // Only include optional params when present
      if (stateId !== undefined && stateId !== null && stateId !== "") {
        params.append("state_id", stateId);
      }
      
      const response = await apiClient(
        `/apis/questions/chapter-topics?${params}`
      );
      if (!response) {
        // Handle 401/403 redirect
        loadingChaptersTopics = false;
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch chapters and topics");
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        chaptersTopics = result.data;
      } else if (Array.isArray(result)) {
        chaptersTopics = result;
      } else {
        chaptersTopics = [];
      }

      if (chaptersTopics.length === 0) {
        chaptersTopicsError =
          "No chapters or topics available for this combination";
      }
    } catch (err) {
      console.error("Error fetching chapters/topics:", err);
      chaptersTopicsError = err.message || "Failed to load chapters and topics";
      chaptersTopics = [];
    } finally {
      loadingChaptersTopics = false;
    }
  }

  // ============================================================================
  // FORM HANDLERS - Handle form submissions and user interactions
  // ============================================================================

  async function handleFormSubmit(event) {
    currentFormData = event.detail;

    // Fetch chapters/topics for the selected combination
    await fetchChaptersTopics(event.detail);
  }

  function handleFormClear() {
    selectedCard = null;
    currentFormData = null;
    chaptersTopics = [];
    selectedCodes = [];
    chaptersTopicsError = null;
  }

  function handleCancelSelection() {
    chaptersTopics = [];
    selectedCodes = [];
    currentFormData = null;
    chaptersTopicsError = null;
    actionMessage = { type: "", message: "", show: false };
    currentDesign = null;
    quizName = "";
    questionCount = 5;
    dispatch('cancelSubjSectionAdd')
  }


  function handleSelectionToggle(event) {
    const { code } = event.detail;

    if (selectedCodes.includes(code)) {
      selectedCodes = selectedCodes.filter((c) => c !== code);
    } else {
      selectedCodes = [...selectedCodes, code];
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS - Helper functions for data transformation
  // ============================================================================

  function resetActionMessage() {
    actionMessage = { type: "", message: "", show: false };
  }

  function resetPreviewMessage() {
    previewMessage = { type: "", message: "", show: false };
  }

  // Generate quiz name from exam and subject
  function generateExamName(formData) {
    const examName = examDetails?.exam_name || "Exam";
    const subjectName = formData?.subjectName || "Subject";
    return `${subjectName} - ${examName}`;
  }

  // Separate selected codes into chapters and topics
  function separateChapterAndTopicCodes(selectedCodes, chaptersTopicsData) {
    const chapters = [];
    const topics = [];

    if (!chaptersTopicsData || !Array.isArray(chaptersTopicsData)) {
      return { chapters, topics };
    }

    const chapterCodeMap = new Map();
    const topicCodeMap = new Map();

    chaptersTopicsData.forEach((chapter) => {
      const chapterCode = chapter.code || chapter.chapter_code;
      if (chapterCode) {
        chapterCodeMap.set(chapterCode, chapter);
      }

      if (chapter.topics && Array.isArray(chapter.topics)) {
        chapter.topics.forEach((topic) => {
          const topicCode = topic.code || topic.topic_code;
          if (topicCode) {
            topicCodeMap.set(topicCode, topic);
          }
        });
      }
    });

    selectedCodes.forEach((code) => {
      if (chapterCodeMap.has(code)) {
        chapters.push(code);
      } else if (topicCodeMap.has(code)) {
        topics.push(code);
      }
    });

    return { chapters, topics };
  }

  // Build chapters/topics array for API payload
  function buildChaptersTopicsArray(chapters, topics) {
    const arr = [];
    if (chapters.length > 0) {
      arr.push({
        type: "chapter",
        codes: chapters.map((code) => ({ code })),
      });
    }
    if (topics.length > 0) {
      arr.push({
        type: "topic",
        codes: topics.map((code) => ({ code })),
      });
    }
    return arr;
  }

  // Build complete payload for quiz creation
  function buildQuestionPaperPayload(
    formData,
    chaptersTopicsArray,
    status,
    customExamName = "",
    totalQuestions = 5
  ) {
    const finalExamName = customExamName;
    const payload = {
      status,
      exam_name: finalExamName,
      subject_code: formData.subjectId,
      medium_code: formData.mediumId,
      standard: formData.classId,
      board_id: formData.boardId,
      chapters_topics: chaptersTopicsArray,
      division: formData.division || null,
      is_ai_selected: true,
      exam_type_code: "1000",
      exam_mode: "online",
      total_time: 15, // Default time
      total_questions: totalQuestions,
      no_of_sets: 1,
      no_of_versions: 1,
    };

    // Only include optional identifiers when they have valid values
    if (formData.stateId !== undefined && formData.stateId !== null && formData.stateId !== "") {
      payload.state_id = formData.stateId;
    }

    return payload;
  }

  function transformQuestions(design, q_paper) {
    if (!q_paper || !design) return [];
    const transformedQuestions = q_paper?.qns?.map((q, index) => {
      // Generate a unique ID if not present
      const questionId = `q_${design.exam_code}_${q.id}_${index}`;

      // Transform options to match QuizRunner format
      // Handle both array format (q.options) and individual properties (q.option1, q.option2, etc.)
      let options = [];

      if (q.options && Array.isArray(q.options)) {
        // If options come as an array
        options = q?.options?.map((opt, idx) => ({
          id: opt.id || idx + 1,
          text: opt.text || opt.option_text || "",
          is_correct: opt.is_correct || q.correct_answer === String(idx + 1),
        }));
      }
      const correct_answer = options.filter((item) => item.is_correct);

      return {
        id: questionId,
        q_code: q.id,
        design_code: design.exam_code,
        paper_code: q_paper.id,
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
      };
    });
    return transformedQuestions;
  }
  // Transform design API response to preview modal format
  function transformToPreviewData(design) {
    if (
      !design ||
      !design.question_papers ||
      design.question_papers.length === 0
    ) {
      return null;
    }
   
    let firstPaper = design?.question_papers?.[0];
    firstPaper.qns = transformQuestions(design, firstPaper);

    return {
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
        question_papers: design.question_papers,
        number_of_sets: design.number_of_sets,
        number_of_versions: design.number_of_versions,
        total_questions: design.no_of_qns,
      },
      questions: firstPaper.qns || [],
    };
  }

  // ============================================================================
  // QUIZ CREATION - Create and manage quiz designs
  // ============================================================================

  // Create a new quiz design
  async function createDesign() {
    if (!currentFormData || selectedCodes.length === 0) {
      actionMessage = {
        type: "error",
        message: "Please select at least one chapter or topic",
        show: true,
      };
      return null;
    }

    // Validate quiz name and question count
    if (!quizName.trim()) {
      actionMessage = {
        type: "error",
        message: "Please enter a quiz name",
        show: true,
      };
      return null;
    }

    if (!questionCount || questionCount < 1) {
      actionMessage = {
        type: "error",
        message: "Please enter a valid question count (minimum 1)",
        show: true,
      };
      return null;
    }

    isCreatingDraft = true;
    resetActionMessage();
    currentDesign = null;

    try {
      const { chapters, topics } = separateChapterAndTopicCodes(
        selectedCodes,
        chaptersTopics
      );

      if (chapters.length === 0 && topics.length === 0) {
        throw new Error("Please select at least one chapter or topic");
      }

      const chaptersTopicsArray = buildChaptersTopicsArray(chapters, topics);
      const payload = buildQuestionPaperPayload(
        currentFormData,
        chaptersTopicsArray,
        1, // Draft status
        quizName.trim(),
        parseInt(questionCount)
      );

      const response = await apiClient(
        `/apis/v2/exams/${examDetails.exam_code}/designs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response) {
        isCreatingDraft = false;
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create quiz design");
      }

      const data = await response.json();
      currentDesign = data;

      actionMessage = {
        type: "success",
        message: "Quiz generated successfully!",
        show: true,
      };

      return data;
    } catch (error) {
      // TO REVERT DURING API INTEGRATION
      actionMessage = {
        type: "error",
        message: error.message || "Failed to create quiz design",
        show: true,
      };
      return null;

      // TO REMOVE DURING API INTEGRATION
      // currentDesign = hardCodedDesign;
      // actionMessage = {
      //   type: "success",
      //   message: "Quiz design created successfully!",
      //   show: true,
      // };
      // isCreatingDraft = false;

      // return currentDesign;
    } finally {
      isCreatingDraft = false;
    }
  }

  function closePreviewModal() {
    showPreviewModal = false;

    // Dispatch event to parent to notify design was created (if design exists)
    if (currentDesign) {
      dispatch("designCreated", { design: currentDesign });
    }
  }

  // Generate preview for the current design
  async function handlePreviewQuiz() {
    isGeneratingPreview = true;
    resetActionMessage();
    resetPreviewMessage();

    try {
      // First create design if not already created
      let design = currentDesign;
      if (!design) {
        design = await createDesign();
        if (!design) {
          return;
        }
      }

      // Transform design response to preview format
      const transformedData = transformToPreviewData(design);

      if (
        !transformedData ||
        !transformedData.questions ||
        transformedData.questions.length === 0
      ) {
        throw new Error("No questions found in the quiz");
      }

      // Set preview data and show modal
      previewData = transformedData;
      showPreviewModal = true;
    } catch (error) {
      actionMessage = {
        type: "error",
        message: error.message || "Failed to generate preview",
        show: true,
      };
    } finally {
      isGeneratingPreview = false;
    }
  }
  // Regenerate an existing quiz design
  async function handleRegenerateQuiz() {
    if (!currentDesign || !currentDesign.exam_code) {
      previewMessage = {
        type: "error",
        message: "No subject section found to regenerate",
        show: true,
      };
      return;
    }

    isGeneratingPreview = true;
    resetPreviewMessage();

    try {
      // Step 1: Delete the existing design
      const deleteResponse = await apiClient(
        `/apis/designs/${currentDesign.exam_code}`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse) {
        isGeneratingPreview = false;
        return;
      }

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete existing subject section");
      }

      // Step 2: Create a new design with the same configuration
      const newDesign = await createDesign();

      if (!newDesign) {
        throw new Error("Failed to create new subject section");
      }

      currentDesign = newDesign;

      // Transform and update preview data
      const transformedData = transformToPreviewData(newDesign);
      if (transformedData) {
        previewData = transformedData;
        previewMessage = {
          type: "success",
          message: "Subject section regenerated successfully!",
          show: true,
        };
      }
    } catch (error) {
      previewMessage = {
        type: "error",
        message: error.message || "Failed to regenerate subject bection",
        show: true,
      };
    } finally {
      isGeneratingPreview = false;
    }
  }

  // ============================================================================
  // DELETION HANDLERS - Handle quiz deletion
  // ============================================================================

  function handleDeleteQuizClick() {
    if (!currentDesign || !currentDesign.exam_code) {
      actionMessage = {
        type: "error",
        message: "No quiz found to delete",
        show: true,
      };
      return;
    }
    showDeleteModal = true;
  }

  function handleDeleteModalCancel() {
    showDeleteModal = false;
  }

  // Handle successful deletion from direct delete button
  function handleDeleteSuccess(event) {
    const { quiz, message } = event.detail;

    // Close delete modal
    showDeleteModal = false;

    // Show success message
    actionMessage = {
      type: "success",
      message: message || `Successfully deleted quiz '${quiz?.exam_name}'`,
      show: true,
    };

    // Clear design response and selections
    currentDesign = null;
    selectedCodes = [];
    quizName = "";
    questionCount = 5;
  }

  // Handle successful deletion from preview modal
  function handleQuizDeletionSuccess(event) {
    const { quiz, message } = event.detail;

    // Close preview modal
    showPreviewModal = false;

    // Show success message
    actionMessage = {
      type: "success",
      message: message || `Successfully deleted quiz '${quiz?.exam_name}'`,
      show: true,
    };

    // Clear design response
    currentDesign = null;
    previewData = {};
  }

  // ============================================================================
  // REACTIVE STATEMENTS
  // ============================================================================

  // Auto-generate quiz name when form data changes
  $: if (currentFormData && !quizName) {
    quizName = generateExamName(currentFormData);
  }
</script>

<!-- Subject/Medium/Class Form -->

<div class="mb-6 pb-6 border-b border-b-gray-200">
  <div class="mb-4">
    <h2 class="text-sm font-semibold text-dark-gray">Basic Details</h2>
    <p class="text-xs text-gray-500">
      Add the basic details of the subject section
    </p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Quiz Name -->
    <InputField
      label="Section name"
      name="subject_section_name"
      type="text"
      placeholder="Enter section name"
      required={true}
      bind:value={quizName}
    />

    <!-- Question Count -->
    <InputField
      label="Number of Questions"
      name="question_count"
      type="number"
      placeholder="Enter number of questions"
      required={true}
      bind:value={questionCount}
      min="1"
      max="100"
    />
  </div>
</div>

<!-- Subject Cards Section -->
<div class="mb-6 pb-6 border-b border-b-gray-200">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h2 class="text-sm font-semibold text-dark-gray">Section content</h2>
      <p class="text-xs text-gray-500">Select a subject combination below</p>
    </div>

    <!-- Toggle between Auto and Manual selection -->
    <div class="text-sm flex items-center gap-2">
      <span
        class={`${selectionMode === "manual" ? "font-medium text-accent" : ""}`}
        >Select Manually</span
      >
      <ToggleButton
        bind:this={toggleBtnRef}
        checked={selectionMode === "auto"}
        on:change={setSelectionMethod}
      />
      <span
        class={`${selectionMode === "auto" ? "font-medium text-accent" : ""}`}
        >Select from latest exams</span
      >
    </div>
  </div>

  <!-- Prefetch Errors Notification -->
  {#if prefetchErrors.length > 0}
    <div class="mb-4">
      <InlineNotification
        title={`Failed to fetch ${prefetchErrors.join(", ")}`}
        kind="error"
      >
        <span slot="actions">
          <Button btnType="secondary" on:click={handleRetryPrefetch}>
            Retry
          </Button>
        </span>
      </InlineNotification>
    </div>
  {/if}

  {#if selectionMode === "auto"}
    {#if isLoadingCards}
      <div class="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    {:else if subjectCards?.length === 0}
      <div
        class="flex flex-col items-center text-center py-8 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <span class="text-gray-400 text-4xl mb-2">📚</span>
        <h3 class="text-base font-medium text-gray-900 mb-2">
          No previously created Subject combinations available
        </h3>

        <Button on:click={() => toggleBtnRef.toggle()}>Select Manually</Button>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each subjectCards as card (card.subject_code + card.standard + card.division + card.medium_code + card.division + card.board_id + card.state_id)}
          <SubjectCard
            {card}
            selected={selectedCard?.id === card.id}
            onClick={() => selectSubjectCard(card)}
          />
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Manual Selection Form -->
  <NewQuizClassSubjectMediumForm
    showInUI={selectionMode === "manual"}
    {statesList}
    {boardsList}
    {mediumsList}
    fetchDataInternally={false}
    on:submit={handleFormSubmit}
    on:clear={handleFormClear}
    on:questionDeletionSuccess
  />
</div>

<!-- Chapter/Topic Selection -->
<div class="flex justify-between items-center mb-4">
  <div>
    <h2 class="text-sm font-semibold text-dark-gray">
      Select Chapters and Topics <span class="text-red-600">*</span>
    </h2>
    {#if currentFormData}
      <p class="text-sm text-gray-600 mt-1">
        {currentFormData.subjectName} • Class {currentFormData.classId}
        {currentFormData.division ? currentFormData.division : ""} • {currentFormData.mediumName}
        medium
      </p>
    {/if}
  </div>
</div>
{#if loadingChaptersTopics}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner />
    <span class="ml-2 text-gray-600">Loading chapters and topics...</span>
  </div>
{:else if chaptersTopics.length > 0}
  <div class="mb-6">
    <!-- Action Messages -->
    {#if actionMessage.show}
      <div class="mb-4">
        <InlineNotification
          kind={actionMessage.type}
          title={actionMessage.message}
          on:close={resetActionMessage}
        />
      </div>
    {/if}

    {#if chaptersTopicsError}
      <InlineNotification
        kind="error"
        title={chaptersTopicsError}
        on:close={() => (chaptersTopicsError = null)}
      />
    {:else}
      <NestedSelectionTable
        data={chaptersTopics}
        {selectedCodes}
        selectionType="mixed"
        loading={false}
        on:toggle={handleSelectionToggle}
      />

      {#if selectedCodes.length > 0}
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-900 font-medium">
            {selectedCodes.length} item{selectedCodes.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      {/if}

      <div class="flex justify-end gap-3 mt-6">
        <Button btnType="secondary" on:click={handleCancelSelection}>
          Discard
        </Button>

        {#if currentDesign && currentDesign.exam_code}
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
              Delete Quiz
            {/if}
          </Button>
        {/if}
        <Button
          btnType="primary"
          disabled={selectedCodes.length === 0 ||
            isCreatingDraft ||
            isGeneratingPreview}
          on:click={handlePreviewQuiz}
        >
          {#if isGeneratingPreview}
            <LoadingSpinner size="small" color="gray" />
            <span class="ml-2">Generating Preview...</span>
          {:else}
            Generate & Preview Quiz
          {/if}
        </Button>
      </div>
    {/if}
  </div>
{:else}
  <NoContentMsg
    title="No chapter topics to display"
    description="Select class, subject, and medium above to get started"
    icon={FileText}
  />
{/if}

<!-- Quiz Preview Modal -->
{#if showPreviewModal}
  <NewQuizPreviewModal
    {questionFormats}
    {showActions}
    loadingPreview={isGeneratingPreview}
    isDeletingQuiz={false}
    qpPreviewData={previewData}
    {previewMessage}
    {resetPreviewMessage}
    {closePreviewModal}
    {handleRegenerateQuiz}
    showRegenerateButton={true}
    showAddQuestionButton={true}
    showDeleteButton={true}
    deletionUrl={currentDesign?.exam_code
      ? `/apis/designs/${currentDesign.exam_code}`
      : null}
    on:quizDeletionSuccess={handleQuizDeletionSuccess}
    on:questionAdditionSuccess
  />
{/if}

<!-- Quiz Deletion Modal -->
{#if showDeleteModal && currentDesign}
  <QuizDeletionModal
    item={currentDesign}
    deletionUrl={`/apis/designs/${currentDesign.exam_code}`}
    itemType="subject section"
    on:success={handleDeleteSuccess}
    on:cancel={handleDeleteModalCancel}
  />
{/if}
