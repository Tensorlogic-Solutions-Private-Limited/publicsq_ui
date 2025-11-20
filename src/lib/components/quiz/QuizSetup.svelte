<script>
  import { onMount, createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import NestedSelectionTable from "./NestedSelectionTable.svelte";
  import ToggleButton from "$lib/components/reusable/ToggleButton.svelte";
  import ClassSubjectMediumForm from "$lib/components/quiz/create/ClassSubjectMediumForm.svelte";
  import SubjectCard from "$lib/components/quiz/create/SubjectCard.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { goto } from "$app/navigation";
  import {
    buildPreviewData,
    getSubjectIcon,
    getSubjectBgColor,
    getSubjectBorderColor,
    getSubjectTextColor,
    getSubjectSelectedBorderColor,
  } from "$lib/utils/helper.js";
  import { formatDate } from "$lib/utils/dateUtils.js";
  const dispatch = createEventDispatcher();
  import QuizClassSubjectMediumForm from "$lib/components/quiz/create/QuizClassSubjectMediumForm.svelte";
  import QuizPreviewModal from "$lib/components/quiz/create/QuizPreviewModal.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  // Set default selection type to mixed and remove the radio button logic
  let selectedType = "mixed"; // Always mixed

  // Update the quizConfig to always use mixed
  export let quizConfig = {
    standard: "",
    division: "",
    subject_code: "",
    medium_code: "",
    chapter_topic_type: "mixed", // Always mixed
    selected_codes: [],
    exam_name: "",
    total_time: 15,
    total_questions: 5,
    no_of_sets: 1,
    no_of_versions: 1,
  };
  export let loading = false;
  export let subjectsData = [];
  export let mediumsData = [];
  export let boardsData = [];
  export let statesList = [];

  $: prefetchErrors = findErrorStates(subjectsData, mediumsData, statesList);

  function findErrorStates() {
    const errorStates = [];
    if (subjectsData?.length == 0) errorStates.push("subjects");
    if (mediumsData?.length == 0) errorStates.push("mediums");
    if (statesList?.length == 0) errorStates.push("states");
    return errorStates;
  }

  // Form data
  let chaptersTopics = [];
  let availableItems = []; // chapters or topics based on selection

  // Form state
  let selectedStandard = quizConfig.standard || "";
  let selectedDivision = quizConfig.division || "";
  let selectedSubject = quizConfig.subject_code || "";
  let selectedSubjectName = "";
  let selectedMedium = quizConfig.medium_code || "";
  let selectedMediumName = "";
  let selectedCodes = [...(quizConfig.selected_codes || [])];
  let customExamName = quizConfig.exam_name || "";
  let noOfQns = 5;

  // Loading states
  let loadingChaptersTopics = false;
  let generating = false; // For quiz creation
  let isCreatingExam = false; // For saving draft
  let loadingPreview = false; // For showing preview

  // Error states
  let errors = {};

  // Quiz creation state
  let draftResponse = {};
  let draftPayload = {};
  // Dynamic subject cards - will be populated from API data
  let subjectCards = [];

  // Track selected card
  let selectedCard = null;

  // Add a variable to track the type of each selected code
  let selectedCodeTypes = {};

  // Exam papers state
  let isLoading = true;
  let exams = [];

  // Preview state
  let showPreviewModal = false;

  let toggleBtnRef = null;

  let selectionMode = "auto";
  let deletionSucceeded = false;
  let previewMessage = {
    type: "",
    message: "",
    cbFn: null,
  };

  let qpPreviewData = {};
  let showModalBeforeQuizStart = false;
  let isDraftLoading = false;
  let apiRespMsg = {
    type: "",
    message: "",
    cbFn: null,
  };

  // New state variable for question formats
  let questionFormats = [];

  onMount(async () => {
    await loadInitialData();
    await loadPapers(); // Load exam papers
    await loadQuestionFormats(); // Fetch question formats
  });

  async function loadQuestionFormats() {
    try {
      const res = await apiClient("/apis/formats");
      if (res && res.ok) {
        const formatsData = await res.json();
        questionFormats = (formatsData.data || []).map((f) => ({
          id: f.qfm_format_code,
          name: f.qfm_format_name,
        }));
      }
    } catch (e) {
      questionFormats = [];
    }
  }

  async function loadInitialData() {
    // await loadMediums(); // Load mediums using existing API

    // If all required fields are selected, load chapters/topics
    if (selectedStandard && selectedSubject && selectedMedium) {
      await loadChaptersTopics();
    }
  }

  async function loadPapers() {
    try {
      const response = await apiClient(
        `/apis/question-papers?status=closed&limit=20`
      );
      if (!response || !response.ok) {
        let errMsg = "Failed to fetch mediums";
        try {
          const errData = await response?.json();
          errMsg =
            (typeof errData?.error === "string" ? errData.error : null) ||
            errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      exams = data || [];
      // Generate subject cards from the exam data
      generateSubjectCardsFromData(exams);
    } catch (error) {
      exams = [];
    } finally {
      isLoading = false;
    }
  }
  // Method to generate unique subject cards from exam data and auto-select latest
  function generateSubjectCardsFromData(examData) {
    if (!examData || !Array.isArray(examData) || examData.length === 0) {
      return;
    }

    // Create a Set to track unique combinations
    const uniqueCards = new Map();
    const subjectNameToCodeMap = subjectsData.reduce((acc, item) => {
      acc[item.subject_code] = item.subject_name;
      return acc;
    }, {});

    const mediumNameToCodeMap = mediumsData.reduce((acc, item) => {
      acc[item.name] = item.id;
      return acc;
    }, {});

    const boardIdToNameMapping = boardsData.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});

    examData.forEach((exam, index) => {
      // Check multiple possible property names for subject code and medium code
      const {
        board_id,
        state_id,
        state_name,
        board_name,
        medium,
        subject,
        standard,
        division,
        subject_code,
      } = exam;

      const subjectCode = subject_code;
      const mediumCode = mediumNameToCodeMap[medium];
      const boardName = boardIdToNameMapping[board_id]
        ? boardIdToNameMapping[board_id]
        : "Unknown";
      // Create a unique key - if subjectCode is missing, use subject name as fallback
      const uniqueKey = `${state_id}-${board_id}-${mediumCode}-${standard}-${division}-${subjectCode}`;

      // Only add if we have minimum required fields (subject, standard) and it's not already added
      if (subject && standard && !uniqueCards.has(uniqueKey)) {
        // Create the card object
        const card = {
          id: uniqueCards.size + 1, // Unique ID
          state_id: state_id,
          state_name: state_name,
          board_id: board_id,
          board_name: board_name ? board_name : boardName,
          subject: subject,
          subject_code: subjectCode,
          boardName: boardName,
          medium_name: medium, // Store medium name for display
          medium_code: mediumCode, // Store medium code for API calls
          standard: standard.toString(),
          division: division,
          icon: getSubjectIcon(subject),
          bgColor: getSubjectBgColor(subject),
          borderColor: getSubjectBorderColor(subject),
          textColor: getSubjectTextColor(subject),
          selectedBorderColor: getSubjectSelectedBorderColor(subject),
          // Store the creation date from the most recent exam with this combination
          latestDate: exam.created_at,
        };

        uniqueCards.set(uniqueKey, card);
      } else if (uniqueCards.has(uniqueKey)) {
        // Update latest date if this exam is newer
        const existingCard = uniqueCards.get(uniqueKey);
        if (
          exam.created_at &&
          (!existingCard.latestDate ||
            new Date(exam.created_at) > new Date(existingCard.latestDate))
        ) {
          existingCard.latestDate = exam.created_at;
        }
      }
    });

    // Convert Map values to array
    subjectCards = Array.from(uniqueCards.values());

    // Sort by latest date and auto-select the most recent one
    subjectCards.sort((a, b) => {
      if (!a.latestDate && !b.latestDate) return 0;
      if (!a.latestDate) return 1;
      if (!b.latestDate) return -1;
      return new Date(b.latestDate) - new Date(a.latestDate);
    });
    // Auto-select the latest (first) card if available
    if (subjectCards.length > 0) {
      selectSubjectCard(subjectCards[0]);
    }
  }

  // Handle card selection
  async function selectSubjectCard(card) {
    selectedCard = card;

    selectedDivision = card.division;
    selectedStandard = card.standard;
    selectedSubject = card.subject_code;
    selectedSubjectName = card.subject;
    selectedMedium = card.medium_code; // Use the medium_code from the card
    selectedMediumName = card.medium_name;
    board_id = card.board_id;
    selectedStateId = card.state_id;
    // Clear previous selections
    selectedCodes = [];
    chaptersTopics = [];
    errors = {};

    // Load chapters/topics since we have all required fields now
    if (selectedStandard && selectedSubject && selectedMedium) {
      await loadChaptersTopics();
    }
  }

  // Use existing API method for chapters/topics
  async function loadChaptersTopics() {
    if (!selectedStandard || !selectedSubject || !selectedMedium) {
      return;
    }

    try {
      loadingChaptersTopics = true;
      chaptersTopics = [];
      availableItems = [];

      const params = new URLSearchParams();
      params.append("standard", classId);
      params.append("subject_code", subjectId);
      params.append("medium_code", mediumId);
      params.append("board_id", boardId);
      // Only include optional params when present
      if (stateId !== undefined && stateId !== null && stateId !== "") {
        params.append("state_id", stateId);
      }
      
      const res = await apiClient(
        `/apis/questions/chapter-topics?${params.toString()}`
      );

      if (!res || !res.ok) {
        throw new Error(res?.error || "Failed to load chapters/topics");
      }

      chaptersTopics = await res.json();

      updateAvailableItems();
    } catch (error) {
      errors.chaptersTopics = error.message;
    } finally {
      loadingChaptersTopics = false;
    }
  }

  function updateAvailableItems() {
    if (selectedType === "chapter") {
      availableItems = chaptersTopics.map((chapter) => ({
        code: chapter.code || chapter.chapter_code,
        name: chapter.name || chapter.chapter_name,
        question_count: chapter.question_count || 0,
      }));
    } else {
      // Flatten all topics from all chapters
      availableItems = [];
      chaptersTopics.forEach((chapter) => {
        if (chapter.topics && Array.isArray(chapter.topics)) {
          chapter.topics.forEach((topic) => {
            availableItems.push({
              code: topic.code || topic.topic_code,
              name: `${chapter.name || chapter.chapter_name} > ${topic.name || topic.topic_name}`,
              question_count: topic.question_count || 0,
            });
          });
        }
      });
    }

    // Reset selection if previously selected codes are not available
    selectedCodes = selectedCodes.filter((code) =>
      availableItems.some((item) => item.code === code)
    );
  }

  // Handle selection from the table
  function handleSelectionToggle(event) {
    const { code, type } = event.detail;
    toggleItemSelection(code);

    // Store the type information for each selected code
    if (!selectedCodeTypes) {
      selectedCodeTypes = {};
    }

    if (selectedCodes.includes(code)) {
      selectedCodeTypes[code] = type;
    } else {
      delete selectedCodeTypes[code];
    }
  }

  // Event handlers
  async function fetchChapterTopics() {
    selectedCodes = [];
    errors = {};

    if (selectedStandard && selectedSubject && selectedMedium) {
      await loadChaptersTopics();
    }
  }

  function toggleItemSelection(code) {
    if (selectedCodes.includes(code)) {
      selectedCodes = selectedCodes.filter((c) => c !== code);
    } else {
      selectedCodes = [...selectedCodes, code];
    }
  }

  function generateExamName() {
    const now = new Date();

    const date = formatDate(now, "dd-MM-yyyy");
    // Format the time as HH:MM (24-hour format)
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;
    return `Quiz - ${selectedSubjectName} - Class ${selectedStandard} ${selectedDivision ? selectedDivision : ""} - ${selectedMediumName} - ${date} ${time}`;
  }

  function validateForm() {
    const newErrors = {};

    if (!selectedSubject || !selectedStandard || !selectedMedium) {
      newErrors.card = "Please select a subject card";
    }

    if (selectedCodes.length === 0) {
      newErrors.selection = "Please select at least one chapter or topic";
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // Function to separate chapter and topic codes
  function separateChapterAndTopicCodes(selectedCodes, chaptersTopicsData) {
    const chapters = [];
    const topics = [];

    if (!chaptersTopicsData || !Array.isArray(chaptersTopicsData)) {
      return { chapters, topics };
    }

    // Create lookup maps for faster searching
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

    // Separate the selected codes
    selectedCodes.forEach((code) => {
      if (chapterCodeMap.has(code)) {
        chapters.push(code);
      } else if (topicCodeMap.has(code)) {
        topics.push(code);
      } else {
      }
    });

    return { chapters, topics };
  }

  async function createQuiz() {
    if (!validateForm()) {
      return;
    }

    isCreatingExam = true;
    // generateError = "";
    draftResponse = {};
    draftPayload = {};

    try {
      const finalExamName = customExamName || generateExamName();
      validateChaptersTopics(chaptersTopics);
      const { chapters, topics } = separateChapterAndTopicCodes(
        selectedCodes || [],
        chaptersTopics || []
      );
      const chaptersTopicsArray = buildChaptersTopicsArray(chapters, topics);
      ensureAtLeastOneSelection(chaptersTopicsArray);
      draftPayload = buildQuestionPaperPayload({
        finalExamName,
        selectedSubject,
        selectedMedium,
        selectedStandard,
        selectedStateId,
        chaptersTopicsArray,
        board_id: board_id,
        status: 1, // Draft mode
      });

      const res = await apiClient(`/apis/question-papers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...draftPayload, status: 1 }),
      });

      if (!res || !res.ok) {
        let errMsg = "Failed to create quiz";
        try {
          const errData = await res?.json();

          errMsg =
            (typeof errData?.detail === "string" ? errData.detail : null) ||
            errMsg;
          return { success: false, error: errMsg };
        } catch {
          throw new Error(errMsg);
        }
      }

      const data = await res.json();
      draftResponse = data;

      return { success: true, data };
      // Show success message or redirect
      // alert("Quiz saved as draft successfully!");
    } catch (error) {
      // generateError = error.message || "Failed to create quiz";
      return {
        success: false,
        error: error.message || "Failed to create quiz",
      };
    } finally {
      isCreatingExam = false;
    }
  }

  async function startQuizAttempt() {
    try {
      const examResp = await createQuiz();
      if (examResp.success) {
        const exam_code = examResp?.data.exam_code;
        goto(`/quiz/${exam_code}/attempt`);
      } else {
        throw new Error(examResp.error);
      }
    } catch (error) {
      apiRespMsg = {
        type: "error",
        message: error.message || "Failed to start quiz",
        cbFn: startQuizAttempt,
      };
      return false;
    } finally {
    }
  }

  function isPreviewAlreadyGenerated() {
    if (Object.keys(qpPreviewData)?.length > 0) {
      return true;
    }
    return false;
  }

  async function createQuizPreview(triggerSource = "") {
    loadingPreview = true;
    resetErrorStates();
    if (triggerSource === "popup") {
      resetPreviewMessage();
    }
    if (isPreviewAlreadyGenerated()) {
      // if there is already preview generated, show that.
      showPreviewModal = true;
      loadingPreview = false;
      return;
    }

    try {
      const examResp = await createQuiz();

      if (examResp.success) {
        // Use question papers data directly from createQuiz response
        const questionPapers = examResp?.data?.question_papers;

        if (questionPapers && questionPapers.length > 0) {
          const firstPaper = questionPapers[0];
          if (firstPaper.qns) {
            // Create exam metadata similar to examDetails.design structure
            const { exam_name, total_questions, total_time, exam_type } =
              examResp.data;

            const missingDataInPostResp = {
              subject_code: draftPayload.subject_code || "",
              medium_code: draftPayload.medium_code || "",
              standard: draftPayload.standard || "",
              division: draftPayload.division || "",
              exam_type_code: draftPayload.exam_type_code || "",
            };

            // Transform the data using buildPreviewData function
            qpPreviewData = buildPreviewData(firstPaper, {
              ...examResp?.data,
              ...missingDataInPostResp,
            });
            showPreviewModal = true;

            return { success: true };
          }
        }
        // Fallback if question papers data is not available
        throw new Error("No question papers found in response");
      } else {
        throw new Error(examResp.error);
      }
    } catch (error) {
      const fallbackErrMsg = "Failed to prepare quiz preview";
      const errorMessage = error.message
        ? error.message + " - " + fallbackErrMsg
        : fallbackErrMsg;

      apiRespMsg = {
        type: "error",
        message: errorMessage,
        cbFn: () => createQuizPreview(triggerSource),
      };
      return { success: false, error: errorMessage };
    } finally {
      loadingPreview = false;
    }
  }

  function resetErrorStates() {
    apiRespMsg = {
      type: "",
      message: "",
      cbFn: null,
    };
  }

  function resetPreviewMessage() {
    previewMessage = {
      type: "",
      message: "",
      cbFn: null,
    };
  }

  async function saveAsDraft() {
    isDraftLoading = true;
    resetErrorStates();
    try {
      const examResp = await createQuiz();
      if (examResp.success) {
        apiRespMsg = {
          type: "success",
          message: `Successfully created draft quiz - ${examResp.data.exam_name}`,
          cbFn: () => {
            goto(`/quiz/${examResp.data.exam_code}/details`);
          },
        };
      } else {
        apiRespMsg = {
          type: "error",
          message: "Failed to create draft quiz",
          cbFn: saveAsDraft,
        };
      }
    } catch (error) {
      apiRespMsg = {
        type: "error",
        message: "Failed to create draft quiz",
        cbFn: saveAsDraft,
      };
    } finally {
      isDraftLoading = false;
    }
  }

  // --- Abstracted helper functions for quiz payload logic ---
  function validateChaptersTopics(chaptersTopics) {
    if (!chaptersTopics || chaptersTopics.length === 0) {
      throw new Error(
        "Chapters/Topics data is missing. Please reselect your options."
      );
    }
  }

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

  function ensureAtLeastOneSelection(chaptersTopicsArray) {
    if (chaptersTopicsArray.length === 0) {
      throw new Error(
        "No chapters or topics selected. Please select some chapters or topics."
      );
    }
  }

  function buildQuestionPaperPayload({
    finalExamName,
    selectedSubject,
    selectedMedium,
    selectedStandard,
    selectedStateId,
    chaptersTopicsArray,
    board_id,
    status,
  }) {
    return {
      status, // Finalized
      is_ai_selected: true, // AI will select questions automatically
      exam_name: finalExamName,
      exam_type_code: "1000",
      board_id,
      state_id: selectedStateId ? selectedStateId : null,
      subject_code: selectedSubject,
      medium_code: selectedMedium,
      exam_mode: "online", // Fixed for quiz mode
      total_time: 15,
      division: selectedDivision,
      total_questions: noOfQns,
      no_of_versions: 1, // Fixed for quiz mode
      no_of_sets: 1, // Fixed for quiz mode
      standard: selectedStandard,
      chapters_topics: chaptersTopicsArray,
    };
  }

  async function askForPreviewOrAttempt() {
    showModalBeforeQuizStart = true;
  }

  function handleRetrySubjMediumFetch() {
    if (
      prefetchErrors.includes("subjects") ||
      prefetchErrors.includes("mediums")
    ) {
      dispatch("retrySubjMedFetch");
      return;
    }
    if (prefetchErrors.includes("states")) {
      dispatch("retryStatesFetch");
    }
  }

  // Reactive statements
  $: if (selectedCodes?.length > 0) {
    customExamName = generateExamName();
    qpPreviewData = {};
  }

  $: if (selectedType) {
    updateAvailableItems();
  }

  function setSelectionMethod(e) {
    const { checked } = e.detail;
    selectionMode = checked ? "auto" : "manual";
  }

  let board_id = null;
  let selectedStateId = null;
  function handleFilterSubmit(e) {
    const {
      subjectId,
      classId,
      division,
      mediumId,
      mediumName,
      subjectName,
      boardId,
      stateId,
    } = e.detail;
    selectedSubject = subjectId;
    selectedStandard = classId;
    selectedDivision = division;
    selectedMedium = mediumId;
    selectedSubjectName = subjectName;
    selectedMediumName = mediumName;
    board_id = boardId;
    selectedStateId = stateId;
    fetchChapterTopics();
  }

  function clearClassMediumSelection(e) {
    selectedStandard = "";
    selectedStateId = "";
    selectedSubject = "";
    selectedMedium = "";
    selectedCard = null;
    selectedCodes = [];
    chaptersTopics = [];
    errors = {};
    draftResponse = {};
  }

  async function deleteExamByCode(exam_code) {
    // if (!exam_code) return false;
    try {
      const res = await apiClient(`/apis/exams/${exam_code}`, {
        method: "DELETE",
      });
      if (!res || !res.ok) {
        let errMsg = "Failed to delete quiz";
        try {
          const errData = await res?.json();
          errMsg = errData?.detail || errMsg;
          return { success: false, error: errMsg };
        } catch {
          throw new Error(errMsg);
        }
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  let isDeletingQuiz = false;
  // Wrapper function for deleting quiz with semantic naming
  async function deleteQuiz(examCode) {
    if (!examCode) {
      return {
        success: false,
        error: "Quiz you are trying to delete cannot be found",
      };
    }
    return await deleteExamByCode(examCode);
  }

  let isRegeneratingQuiz = false;
  async function handleRegenerateQuiz() {
    try {
      resetErrorStates();
      isRegeneratingQuiz = true;
      let exam_code = draftResponse?.exam_code;
      qpPreviewData = {};
      resetPreviewMessage();

      if (!deletionSucceeded && exam_code) {
        const deletionResult = await deleteExamByCode(exam_code);
        if (!deletionResult.success) {
          // Show error and return, allow retry
          previewMessage = {
            type: "error",
            message: "Failed to delete previous quiz. Please try again.",
            cbFn: handleRegenerateQuiz,
          };
          throw new Error("Failed to delete previous quiz");
        }
        deletionSucceeded = true;
      }

      // try to create quiz again
      const creationRep = await createQuizPreview("popup");
      if (!creationRep.success) {
        previewMessage = {
          type: "error",
          message: creationRep.error,
          cbFn: () => createQuizPreview("popup"),
        };
        throw new Error("Failed to delete previous quiz");
      }

      deletionSucceeded = false;
    } catch (err) {
      isRegeneratingQuiz = false;
    } finally {
      isRegeneratingQuiz = false;
    }
  }

  async function handleDeleteQuiz() {
    let exam_code = draftResponse?.exam_code;
    resetErrorStates();
    isDeletingQuiz = true;

    const result = await deleteQuiz(exam_code);

    isDeletingQuiz = false;

    if (result.success) {
      apiRespMsg = {
        type: "success",
        message: `Quiz deleted successfully `,
        cbFn: null,
      };
      draftResponse = {};
      qpPreviewData = {};
      showPreviewModal = false;
      // Clear preview messages on success
      resetPreviewMessage();
    } else {
      apiRespMsg = {
        type: "error",
        message: `Quiz deletion failed `,
        cbFn: handleDeleteQuiz,
      };
      // Set preview modal error states
      previewMessage = {
        type: "error",
        message: "Quiz deletion failed",
        cbFn: handleDeleteQuiz,
      };
    }
  }

  function handleQuizDeletionSuccessMessage(event) {
    const { quiz, message } = event.detail;

    // Show success message via apiRespMsg
    apiRespMsg = {
      type: "success",
      message: message || `Successfully deleted quiz '${quiz?.exam_name}'`,
      cbFn: null,
    };
    draftResponse = {};
    qpPreviewData = {};
    showPreviewModal = false;
    // Clear preview messages on success
    resetPreviewMessage();
  }

  async function handleStartQuizFromPreview() {
    let exam_code = draftResponse?.exam_code;
    if (!exam_code) {
      previewMessage = {
        type: "error",
        message: "Failed to start quiz. Couldn't find the quiz.",
        cbFn: handleStartQuizFromPreview,
      };
      return;
    }
    goto(`/quiz/${exam_code}/attempt`);
  }

  function closeConfirmationModal() {
    showModalBeforeQuizStart = false;
  }

  function closePreviewModal() {
    showPreviewModal = false;
  }

  function handlePreviewFromConfirmation() {
    showModalBeforeQuizStart = false;
    createQuizPreview();
  }
</script>

<div class="sr-only">Board, Medium, Class, Subject Filter</div>
<div class="p-6">
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <span class="ml-3 text-gray-600">Loading your subjects...</span>
    </div>
  {:else}
    <form on:submit|preventDefault={askForPreviewOrAttempt} class="space-y-6">
      <!-- Subject Card Selection (dynamic from API data) -->

      <div>
        <label class="block text-base font-medium text-gray-900 mb-4">
          Select Class, Subject & Medium <span class="text-red-500">*</span>
          <!-- {#if selectedCard && selectionMode === "auto"}
            <span class="text-green-600 ml-2">✓ Auto-selected latest</span>
          {/if} -->
        </label>

        {#if prefetchErrors?.length > 0}
          <div class="mb-4">
            <InlineNotification
              title={`Failed to fetch ${prefetchErrors.join(", ")}`}
              kind="error"
            >
              <span slot="actions">
                <Button
                  btnType="secondary"
                  on:click={handleRetrySubjMediumFetch}>Retry</Button
                >
              </span>
            </InlineNotification>
          </div>
        {/if}
        <div class="text-sm flex items-center gap-2 mb-4">
          <span
            class={`${selectionMode === "manual" ? "font-medium text-accent" : ""}`}
            >Select manually</span
          >
          <ToggleButton
            bind:this={toggleBtnRef}
            on:change={setSelectionMethod}
            checked={selectionMode === "auto"}
          />
          <span
            class={`${selectionMode === "auto" ? "font-medium text-accent" : ""}`}
            >Select from latest quizzes</span
          >
        </div>
        {#if selectionMode === "auto"}
          {#if subjectCards.length === 0}
            <div
              class="flex flex-col items-center text-center py-8 border-2 border-dashed border-gray-300 rounded-lg"
            >
              <span class="text-gray-400 text-4xl mb-2">📚</span>
              <h3 class="text-lg font-medium text-gray-900 mb-1">
                No Subjects Available
              </h3>
              <p class="text-sm text-gray-500 mb-4">No exam papers found</p>
              <Button on:click={() => toggleBtnRef.toggle()}
                >Select Manually</Button
              >
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each subjectCards as card}
                <SubjectCard
                  {card}
                  selected={selectedCard?.id === card.id}
                  onClick={() => selectSubjectCard(card)}
                />
              {/each}
            </div>
          {/if}

          {#if errors.card}
            <p class="text-red-500 text-sm mt-2">{errors.card}</p>
          {/if}

          <!-- Class/Subject/Medium Selection Form -->
        {/if}
        <QuizClassSubjectMediumForm
          on:submit={handleFilterSubmit}
          on:clear={clearClassMediumSelection}
          {loading}
          {statesList}
          showInUI={selectionMode === "manual"}
        />
      </div>

      <!-- Chapters/Topics Selection (only show if card is selected) -->

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Select Chapters and Topics <span class="text-red-500">*</span>
          {#if selectedCodes.length > 0}
            <span class="text-blue-600">({selectedCodes.length} selected)</span>
          {/if}
        </label>

        <!-- Use the NestedSelectionTable component with mixed type -->
        <NestedSelectionTable
          data={chaptersTopics}
          {selectedCodes}
          selectionType="mixed"
          loading={loadingChaptersTopics}
          on:toggle={handleSelectionToggle}
        />

        {#if errors.selection}
          <p class="text-red-500 text-sm mt-2">{errors.selection}</p>
        {/if}
        {#if errors.chaptersTopics}
          <p class="text-red-500 text-sm mt-2">{errors.chaptersTopics}</p>
        {/if}
      </div>

      <!-- Quiz Configuration (only show if selections are made) -->
      {#if selectedCodes.length > 0}
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Quiz Configuration
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Exam Name -->
            <div class="md:col-span-2">
              <label
                for="examName"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Quiz Name
              </label>
              <input
                id="examName"
                type="text"
                bind:value={customExamName}
                placeholder={generateExamName()}
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                Leave blank to use auto-generated name
              </p>
            </div>
            <div class="md:col-span-2">
              <label
                for="questionCount"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Questions to add
              </label>
              <input
                id="questionCount"
                type="number"
                min="1"
                max="50"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5"
                bind:value={noOfQns}
              />
              <p class="text-xs text-gray-500 mt-1">
                Insert number of questions
              </p>
            </div>
          </div>
        </div>
      {/if}

      {#if apiRespMsg.message}
        <div class="mb-2">
          <InlineNotification
            kind={apiRespMsg.type}
            title={apiRespMsg.message}
            on:close={resetErrorStates}
          >
            <span slot="actions">
              {#if apiRespMsg.cbFn}
                <Button btnType="secondary" on:click={apiRespMsg.cbFn}
                  >{apiRespMsg.type === "error"
                    ? "Retry"
                    : "View details"}</Button
                >
              {/if}
            </span>
          </InlineNotification>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <!-- Preview Button -->
        <Button
          type="button"
          on:click={() => createQuizPreview()}
          disabled={loading || loadingPreview || selectedCodes.length === 0}
          class="px-6 py-2 sm:text-sm text-xs rounded-[4px] bg-gray-600 text-white font-medium  hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {#if loadingPreview}
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
            ></div>
            Loading Preview...
          {:else}
            <svg
              class="w-4 h-4 mr-2"
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
            Preview
          {/if}
        </Button>

        <!-- Save as Draft Button -->
        <Button
          type="button"
          on:click={saveAsDraft}
          disabled={loading || isDraftLoading || selectedCodes.length === 0}
        >
          {#if isDraftLoading}
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
            ></div>
            Saving Draft...
          {:else}
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            Save as Draft
          {/if}
        </Button>

        <!-- Start Quiz Button -->
        <Button
          type="submit"
          disabled={loading || generating || selectedCodes.length === 0}
          btnType="custom"
          class="px-6 py-2 sm:text-sm text-xs rounded-[4px] font-medium bg-green-600 text-white  hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {#if generating}
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
            ></div>
            Creating Quiz...
          {:else}
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Quiz
          {/if}
        </Button>
      </div>
    </form>
  {/if}
</div>

<!-- Preview Modal -->
{#if showPreviewModal}
  <QuizPreviewModal
    {isDeletingQuiz}
    {questionFormats}
    {loadingPreview}
    {qpPreviewData}
    {previewMessage}
    {resetPreviewMessage}
    {closePreviewModal}
    {handleRegenerateQuiz}
    {handleStartQuizFromPreview}
    on:quizDeletionSuccess={handleQuizDeletionSuccessMessage}
  />
{/if}

{#if showModalBeforeQuizStart}
  <Portal>
    <div class="text-center rounded-lg bg-white p-6">
      <div class="flex justify-between items-center">
        <h2 class="heading-L">Confirmation</h2>
        <button
          on:click={closeConfirmationModal}
          aria-label="Close confirmation popup"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg></button
        >
      </div>
      <hr class="  border-t-gray-200 my-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-1">
        Do you wish to preview the quiz before starting?
      </h3>
      <p class="text-slate-600 mb-2 text-sm">
        Helps to view the questions and regenerate if required.
      </p>

      <!-- <p class="text-emerald-600 text-sm mb-6">
          All questions have been answered.
        </p> -->

      {#if apiRespMsg.message && apiRespMsg.type === "error"}
        <div class="mb-4">
          <InlineNotification kind="error" title={apiRespMsg.message}>
            <span slot="actions">
              {#if apiRespMsg.cbFn}
                <Button btnType="secondary" on:click={apiRespMsg.cbFn}
                  >Retry</Button
                >
              {/if}
            </span>
          </InlineNotification>
        </div>
      {/if}

      <div class="flex gap-3 justify-center mt-6">
        <Button on:click={handlePreviewFromConfirmation} btnType="secondary"
          >Preview Quiz</Button
        >
        <Button
          on:click={startQuizAttempt}
          class="basic-btn bg-green-600 text-white  hover:bg-green-700 transition-all duration-200 font-medium"
        >
          Start anyway
        </Button>
      </div>
    </div>
  </Portal>
{/if}

<style>
  .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #8a929d;
    border-radius: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
