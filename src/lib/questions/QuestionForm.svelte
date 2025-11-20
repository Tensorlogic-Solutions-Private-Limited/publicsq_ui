<script>
  import { onMount, createEventDispatcher } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import ImageBasedQuestionContent from "$lib/components/ImageBasedQuestionContent.svelte";
  import MCQForm from "$lib/questions/MCQForm.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import SessionQuestionTable from "$lib/questions/SessionQuestionTable.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import DynamicSubChapAdd from "./DynamicSubChapAdd.svelte";
  import { mapApiError } from "$lib/utils/helper.js";
  import { validateSubjectCreation } from "$lib/questions/form-helper.js";

  const dispatch = createEventDispatcher();

  export let mode = "add"; //add || edit || add-temp
  export let endpoint = "";
  export let existingQuestion = null;
  export let subjects = [];
  export let mediums = [];
  export let boards = [];
  export let formats = [];
  export let questionTypes = [];
  export let classes = [];
  export let cognitiveLearning = [];
  export let difficultyLevels = [];
  export let states = [];
  export let tempQuestionAdd = false;
  export let tempQuestionMetadata = {
    subject: "",
    medium: "",
    standard: "",
    state: "",
    board_name: "",
    chapterTopics: [],
  };
  export let showMessageAboveQuestion = false;

  let notification = {
    show: false,
    kind: "",
    message: "",
    subtext: "",
  };

  let notificationRef;

  let validationErrors = {};
  let isLoading = false;

  let allChaptersData = [];
  let chapters = [];
  let topics = [];
  let subtopics = [];
  let selectedChapter = null;
  let selectedTopic = null;
  let questionSubmissionSuccess = false;
  let chaptersLoading = false;
  let subjectsLoading = false;
  let questionList = [];
  let subjectsList = [];

  // Dynamic item addition popup state
  let showDynamicAddPopup = false;
  let dynamicAddType = ""; //  "chapter", "topic", "subtopic"
  let newChapTopicSubTopic = {
    chapter_name: "", // For entering new chapter name
    topic_name: "", // For entering new topic name
    subtopic_name: "", // For entering new subtopic name
  }; // variable to store dynamically added data

  // For image-based edit mode, initialize questionData/options/correctAnswer from existingQuestion.imageBasedEditData
  let questionData = { question: "", images: [] };
  let options = [...Array(4)].map((_, i) => ({
    id: "",
    text: "",
    files: [],
    previews: [],
    isCorrect: false,
    error: "",
  }));
  let correctAnswer = "";

  $: if (
    (mode === "edit" || (mode === "add-temp" && existingQuestion)) &&
    existingQuestion?.imageBasedEditData
  ) {
    questionData = existingQuestion.imageBasedEditData.questionData;
    options = existingQuestion.imageBasedEditData.options;
    correctAnswer = existingQuestion.imageBasedEditData.correctAnswer;
  }

  // Filtered subjects based on selected standard and medium - use fetched subjects if available, fallback to props
  // $: subjectsList =
  //   subjectsList.length > 0
  //     ? subjectsList
  //     : subjects?.filter((subject) => subject?.standard == formData?.standard);

  let formData = {
    // Academic Classification
    state_id: "",
    board_id: "",
    medium_code: "",
    standard: "",
    subject_code: "",
    chapter_code: "",
    topic_code: "",
    subtopic_code: "",

    // Question Properties
    cognitive_learning_id: "",
    difficulty_id: "",
    type_code: "",
    format_code: "",

    // Existing fields
    question_text: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correct_answer: "",

    // Image Fields
    question_text_media: [],
    option1_media: [],
    option2_media: [],
    option3_media: [],
    option4_media: [],
  };

  const optionLabels = {
    option1: "A",
    option2: "B",
    option3: "C",
    option4: "D",
  };

  // Reactive statement to generate available correct answers
  $: availableCorrectAnswers = ["option1", "option2", "option3", "option4"]
    .filter((key) => formData[key] && formData[key].trim())
    .map((key) => ({
      id: key,
      name: `Option ${optionLabels[key]}: ${formData[key]}`,
    }));

  // -----------------Reactive declarations for chapters, topics, and subtopics-----------------

  function filterMasterDataForTempQuestions(
    allChaptersData,
    tempQuestionMetadata
  ) {
    if (!tempQuestionMetadata?.chapterTopics?.length) {
      return allChaptersData;
    }

    // Get chapters from type: 'chapter' (these should include ALL their topics)
    const fullChapterCodes = new Set();
    tempQuestionMetadata.chapterTopics
      .filter((ct) => ct.type === "chapter")
      .forEach((ct) => {
        ct.codes.forEach((c) => fullChapterCodes.add(c.code));
      });

    // Get chapter codes from type: 'topic' (these should only include specific topics)
    const topicChapterCodes = new Set();
    const allowedTopicCodes = new Set();
    tempQuestionMetadata.chapterTopics
      .filter((ct) => ct.type === "topic")
      .forEach((ct) => {
        ct.codes.forEach((c) => {
          if (c.chapter_details?.code) {
            topicChapterCodes.add(c.chapter_details.code);
            allowedTopicCodes.add(c.code);
          }
        });
      });

    // Get all allowed chapter codes
    const allAllowedChapterCodes = new Set([
      ...fullChapterCodes,
      ...topicChapterCodes,
    ]);

    // Filter master data to only include allowed chapters
    return allChaptersData
      .filter((chapter) => allAllowedChapterCodes.has(chapter.code))
      .map((chapter) => {
        // If chapter comes from type: 'chapter', include ALL its topics
        if (fullChapterCodes.has(chapter.code)) {
          return {
            ...chapter,
            topics: chapter.topics || [],
          };
        }
        // If chapter comes from type: 'topic', filter to only allowed topics
        else if (topicChapterCodes.has(chapter.code)) {
          return {
            ...chapter,
            topics:
              chapter.topics?.filter((topic) =>
                allowedTopicCodes.has(topic.code)
              ) || [],
          };
        }

        return chapter;
      });
  }

  function getFilteredChapters(allChaptersData) {
    return allChaptersData.map((chap) => ({ id: chap.code, name: chap.name }));
  }

  $: chapters = getFilteredChapters(allChaptersData) || [];

  $: {
    // Find selected chapter from allChaptersData (already filtered for temp questions)
    selectedChapter = allChaptersData.find(
      (chap) => String(chap.code) === String(formData.chapter_code)
    );

    if (selectedChapter?.topics) {
      // Preserve any dynamically added topics (with id: "temp")
      topics = selectedChapter.topics.map((topic) => ({
        id: topic.code,
        name: topic.name,
      }));
    } else {
      // Only keep dynamically added topics when no chapter topics exist
      // topics = topics.filter(topic => topic.id === "temp");
    }
  }

  $: {
    if (selectedChapter && formData.topic_code) {
      selectedTopic = selectedChapter?.topics?.find(
        (topic) => String(topic.code) === String(formData.topic_code)
      );

      if (selectedTopic?.subtopics) {
        // Preserve any dynamically added subtopics (with id: "temp")
        const tempSubtopics = subtopics.filter(
          (subtopic) => subtopic.id === "temp"
        );
        subtopics = [
          ...tempSubtopics,
          ...selectedTopic.subtopics.map((subtopic) => ({
            id: subtopic.code,
            name: subtopic.name,
          })),
        ];
      } else {
        // Only keep dynamically added subtopics when no topic subtopics exist
        // subtopics = subtopics.filter(subtopic => subtopic.id === "temp");
      }
    } else {
      selectedTopic = null;
      // Only keep dynamically added subtopics when no topic is selected
      // subtopics = subtopics.filter(subtopic => subtopic.id === "temp");
    }
  }

  // ---------------------------- Subjects Fetching ----------------------------

  async function loadSubjects() {
    subjectsList = [];
    subjectsLoading = true;

    // Only clear subject_code if we're not in edit mode
    if (mode == "add") {
      formData = {
        ...formData,
        subject_code: "",
        chapter_code: "",
        topic_code: "",
        subtopic_code: "",
      };
    }

    if (!formData.standard || !formData.medium_code) {
      subjectsLoading = false;
      return;
    }

    try {
      const response = await apiClient(
        `/apis/subjects?standard=${formData.standard}&medium_code=${formData.medium_code}`
      );

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch subjects data.`);
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        // Transform the API response to match SearchableComboBox format
        subjectsList = result.map((subject) => ({
          id: subject.subject_code,
          subject_code: subject.subject_code,
          name: subject.subject_name,
        }));

        validationErrors.subject_code = "";
      } else {
        console.error("Unexpected API response format:", result);
        subjectsList = [];
        validationErrors.subject_code = "Failed to load subjects.";
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      subjectsList = [];
      validationErrors.subject_code = "Failed to load subjects.";
    } finally {
      subjectsLoading = false;
      validationErrors = { ...validationErrors };
    }
  }

  // ---------------------------- Chapters and Subtopics ----------------------------

  async function loadChaptersAndAll() {
    allChaptersData = [];
    chaptersLoading = true;

    // Only clear codes if we're not in edit mode or if explicit reset is needed
    if (mode == "add") {
      formData = {
        ...formData,
        chapter_code: "",
        topic_code: "",
        subtopic_code: "",
      };
    }

    if (!formData.standard || !formData.medium_code || !formData.subject_code) {
      chaptersLoading = false;
      return;
    }

    try {
      const response = await apiClient(
        `/apis/subjects/chapters-topics?standard=${formData.standard}&medium_code=${formData.medium_code}&subject_code=${formData.subject_code}&state_id=${formData.state_id}&board_id=${formData.board_id}`
      );

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch chapter topics data.`);
      }

      const result = await response.json();
      // const result = [
      //   {
      //     code: "C011",
      //     qn_count: null,
      //     name: "PLANT ANATOMY AND PLANT PHYSIOLOGY",
      //   },
      // ];

      if (Array.isArray(result)) {
        // Apply temp question filtering if applicable
        if (
          tempQuestionAdd &&
          tempQuestionMetadata?.chapterTopics?.length > 0
        ) {
          allChaptersData = filterMasterDataForTempQuestions(
            result,
            tempQuestionMetadata
          );
        } else {
          allChaptersData = result;
        }
        allChaptersData = [...allChaptersData];
        validationErrors.chapter_code = "";
      } else {
        console.error("Unexpected API response format:", result);
        allChaptersData = [];
        validationErrors.chapter_code = "Failed to load chapters.";
      }
    } catch (error) {
      console.error("Error loading curriculum data:", error);
      allChaptersData = [];
      validationErrors.chapter_code = "Failed to load chapters.";
    } finally {
      chaptersLoading = false;
      validationErrors = { ...validationErrors };
    }
  }

  // --------------------------- Input and Dropdown related functions --------------------------

  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
    formData = { ...formData, [name]: value };
  }

  function handleDropdownSelect(fieldName) {
    return async function (event) {
      const { selectedOption } = event.detail;

      // Reset dependent fields to avoid stale data
      if (fieldName === "standard") {
        formData = {
          ...formData,
          standard: selectedOption.id,
          subject_code: "",
          chapter_code: "",
          topic_code: "",
          subtopic_code: "",
        };
        allChaptersData = [];
        // Preserve dynamically added items
        // topics = topics.filter((topic) => topic.id === "temp");
        // subtopics = subtopics.filter((subtopic) => subtopic.id === "temp");
      } else if (fieldName === "medium_code") {
        formData = {
          ...formData,
          medium_code: selectedOption.id,
          subject_code: "",
          chapter_code: "",
          topic_code: "",
          subtopic_code: "",
        };
        allChaptersData = [];
        // Preserve dynamically added items
        // topics = topics.filter((topic) => topic.id === "temp");
        // subtopics = subtopics.filter((subtopic) => subtopic.id === "temp");
      } else if (fieldName === "subject_code") {
        formData = {
          ...formData,
          subject_code: selectedOption.id,
          chapter_code: "",
          topic_code: "",
          subtopic_code: "",
        };
        // Preserve dynamically added items
        // topics = topics.filter((topic) => topic.id === "temp");
        // subtopics = subtopics.filter((subtopic) => subtopic.id === "temp");
      } else if (fieldName === "chapter_code") {
        formData = {
          ...formData,
          chapter_code: selectedOption.id,
          topic_code: "",
          subtopic_code: "",
        };
        // Preserve dynamically added items
        // topics = topics.filter((topic) => topic.id === "temp");
        // subtopics = subtopics.filter((subtopic) => subtopic.id === "temp");
      } else if (fieldName === "topic_code") {
        formData = {
          ...formData,
          topic_code: selectedOption.id,
          subtopic_code: "",
        };
        // Preserve dynamically added items
        // subtopics = subtopics.filter((subtopic) => subtopic.id === "temp");
      } else if (fieldName === "format_code") {
        formData = {
          ...formData,
          format_code: selectedOption.id,
          question_text: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct_answer: "",
          question_text_media: [],
          option1_media: [],
          option2_media: [],
          option3_media: [],
          option4_media: [],
        };
        validationErrors = {
          ...validationErrors,
          question_text: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct_answer: "",
          question: "",
          option1_media: "",
          option2_media: "",
          option3_media: "",
          option4_media: "",
        };
        validationErrors = { ...validationErrors };
      } else {
        formData = {
          ...formData,
          [fieldName]: selectedOption.id,
        };
      }
      if (validationErrors[fieldName]) {
        validationErrors[fieldName] = "";
        validationErrors = { ...validationErrors };
      }

      // Only fetch chapters when standard, medium, or subject change
      if (["standard", "medium_code", "subject_code"].includes(fieldName)) {
        await loadChaptersAndAll();
      }

      // Fetch subjects when standard or medium change
      if (["standard", "medium_code"].includes(fieldName)) {
        await loadSubjects();
      }
    };
  }

  function handleDropdownCancel(fieldName) {
    return function () {
      // Clear the selected value and any dependent fields
      if (
        fieldName === "standard" ||
        fieldName === "medium_code" ||
        fieldName === "subject_code"
      ) {
        formData = {
          ...formData,
          [fieldName]: "",
          chapter_code: "",
          topic_code: "",
          subtopic_code: "",
        };
        if (fieldName === "standard" || fieldName === "medium_code") {
          formData.subject_code = "";
          subjectsList = [];
        }
        allChaptersData = [];
        // Preserve dynamically added items
        topics = [];
        subtopics = [];
        selectedChapter = null;
        selectedTopic = null;
      } else if (fieldName === "chapter_code") {
        formData = {
          ...formData,
          chapter_code: "",
          topic_code: "",
          subtopic_code: "",
        };
        // Preserve dynamically added items
        topics = [];
        subtopics = [];
        selectedTopic = null;
      } else if (fieldName === "topic_code") {
        formData = {
          ...formData,
          topic_code: "",
          subtopic_code: "",
        };
        // Preserve dynamically added items
        subtopics = [];
      } else if (fieldName === "format_code") {
        formData = {
          ...formData,
          format_code: "",
          question_text: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct_answer: "",
          question_text_media: [],
          option1_media: [],
          option2_media: [],
          option3_media: [],
          option4_media: [],
        };
        validationErrors = {
          ...validationErrors,
          question_text: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct_answer: "",
          question: "",
          option1_media: "",
          option2_media: "",
          option3_media: "",
          option4_media: "",
        };
        validationErrors = { ...validationErrors };
      } else {
        formData = {
          ...formData,
          [fieldName]: "",
        };
      }

      formData = { ...formData };

      if (validationErrors[fieldName]) {
        validationErrors[fieldName] = "";
        validationErrors = { ...validationErrors };
      }
    };
  }

  // --------------------------- Dynamic Item Addition Handler --------------------------

  async function createSubject(subjectName) {
    try {
      // Validate required fields using helper function
      const validation = validateSubjectCreation(subjectName, formData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Prepare API payload for subject creation
      const subjectPayload = {
        subject_name: subjectName.trim(),
        standard: formData.standard,
        medium_code: formData.medium_code,
      };

      // Make API call to create subject
      const response = await fetch("/apis/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subjectPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const customErrorMessage = mapApiError(response.status, "subject");
        throw new Error(errorData.message || customErrorMessage);
      }

      const responseData = await response.json();

      return {
        success: true,
        data: {
          id: responseData.subject_code || responseData.id,
          subject_code: responseData.subject_code || responseData.id,
          name: responseData.subject_name || subjectName.trim(),
        },
      };
    } catch (error) {
      console.error("Error creating subject:", error);
      return {
        success: false,
        error: error.message || "Failed to create subject. Please try again.",
      };
    }
  }

  async function handleDynamicItemAddition(event) {
    const type = event.detail.type || event.type;

    const newItemName = event.detail.value;

    if (type === "subject") {
      // Handle subject creation via API

      if (newItemName && newItemName.trim()) {
        const result = await createSubject(newItemName);

        if (result.success) {
          // Add the new subject to the list and auto-select it
          subjectsList = [result.data, ...subjectsList];

          // Auto-select the newly created subject
          formData.subject_code = result.data.id;
          formData = { ...formData };
        } else {
          // Show error to user
          validationErrors.subject_code = result.error;
          validationErrors = { ...validationErrors };
        }
      }
    } else {
      // Use popup for chapters, topics, and subtopics
      dynamicAddType = type;
      if (type === "chapter") {
        newChapTopicSubTopic = {
          ...newChapTopicSubTopic,
          chapter_name: newItemName,
        };
      }
      if (type === "topic") {
        newChapTopicSubTopic = {
          ...newChapTopicSubTopic,
          topic_name: newItemName,
        };
      }
      if (type === "subtopic") {
        newChapTopicSubTopic = {
          ...newChapTopicSubTopic,
          subtopic_name: newItemName,
        };
      }
      showDynamicAddPopup = true;
    }
  }

  function updateAllChaptersData(newData) {
    // Find existing chapter
    const existingChapterIndex = allChaptersData.findIndex(
      (chapter) => chapter.code === newData.chapter_code
    );
    if (existingChapterIndex === -1) {
      // Chapter doesn't exist, create new chapter with topics and subtopics
      const newChapter = {
        code: newData.chapter_code,
        name: newData.chapter_name,
        question_count: 0,
        topics: [],
      };

      // Add topic if provided
      if (newData.topic_code && newData.topic_name) {
        const newTopic = {
          code: newData.topic_code,
          name: newData.topic_name,
          question_count: 0,
          subtopics: [],
        };

        // Add subtopic if provided
        if (newData.subtopic_code && newData.subtopic_name) {
          newTopic.subtopics.push({
            code: newData.subtopic_code,
            name: newData.subtopic_name,
            question_count: 0,
          });
        }

        newChapter.topics.push(newTopic);
      }

      // Add new chapter to the beginning of the array
      allChaptersData = [newChapter, ...allChaptersData];
    } else {
      // Chapter exists, update or add topic/subtopic
      const existingChapter = allChaptersData[existingChapterIndex];
      if (newData.topic_code && newData.topic_name) {
        // Find existing topic
        const existingTopicIndex = existingChapter.topics.findIndex(
          (topic) => topic.code === newData.topic_code
        );

        if (existingTopicIndex === -1) {
          // Topic doesn't exist, create new topic
          const newTopic = {
            code: newData.topic_code,
            name: newData.topic_name,
            question_count: 0,
            subtopics: [],
          };

          // Add subtopic if provided
          if (newData.subtopic_code && newData.subtopic_name) {
            newTopic.subtopics.push({
              code: newData.subtopic_code,
              name: newData.subtopic_name,
              question_count: 0,
            });
          }

          // Add new topic to the beginning of the topics array
          existingChapter.topics = [newTopic, ...existingChapter.topics];
        } else {
          // Topic exists, add subtopic if provided
          if (newData.subtopic_code && newData.subtopic_name) {
            const existingTopic = existingChapter.topics[existingTopicIndex];
            const existingSubtopicIndex = existingTopic.subtopics.findIndex(
              (subtopic) => subtopic.code === newData.subtopic_code
            );

            if (existingSubtopicIndex === -1) {
              // Subtopic doesn't exist, add it
              const newSubtopic = {
                code: newData.subtopic_code,
                name: newData.subtopic_name,
                question_count: 0,
              };

              // Add new subtopic to the beginning of the subtopics array
              existingTopic.subtopics = [
                newSubtopic,
                ...existingTopic.subtopics,
              ];
            }
          }
        }
      }

      // Update the allChaptersData array to trigger reactivity
      allChaptersData = [...allChaptersData];
    }
  }

  function resetDynamicAddData() {
    newChapTopicSubTopic = {
      chapter_name: "",
      topic_name: "",
      subtopic_name: "",
    };
  }

  function handleDynamicAddSubmit(event) {
    const { type, data } = event.detail;

    // Update formData with the response data - including empty values to clear stale data
    if (data.chapter_name && data.chapter_code) {
      formData.chapter_code = data.chapter_code;
    }

    if (data.topic_name && data.topic_code) {
      formData.topic_code = data.topic_code;
    } else if (data.topic_code === "") {
      // Clear stale topic_code if API returns empty
      formData.topic_code = "";
    }

    if (data.subtopic_name && data.subtopic_code) {
      formData.subtopic_code = data.subtopic_code;
    } else if (data.subtopic_code === "") {
      // Clear stale subtopic_code if API returns empty
      formData.subtopic_code = "";
    }

    // Update allChaptersData with the new hierarchy data
    updateAllChaptersData(data);

    // Update formData to trigger reactivity
    formData = { ...formData };

    // Close the popup
    showDynamicAddPopup = false;
    dynamicAddType = "";
    resetDynamicAddData();
  }

  function handleDynamicAddCancel() {
    showDynamicAddPopup = false;
    dynamicAddType = "";
    resetDynamicAddData();
  }

  // -------------------------------- Form Validation ---------------------------------------
  function validateForm() {
    validationErrors = {};
    validationErrors = validationErrors;

    // Common required fields
    const requiredFields = [
      "state_id",
      "board_id",
      "medium_code",
      "format_code",
      "standard",
      "subject_code",
      "chapter_code",
      // "topic_code",
      "cognitive_learning_id",
      "difficulty_id",
      "type_code",
      "correct_answer",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || String(formData[field]).trim() === "") {
        const displayField = field
          .replace(/_id$/, "")
          .replace(/_code$/, "")
          .replace(/_/, " ");
        validationErrors[field] =
          `${displayField.charAt(0).toUpperCase() + displayField.slice(1)} is required.`;
      }
    });

    // Image-based question validation
    if (formData.format_code == "6000") {
      // Question: require either text or media
      const hasQuestionText =
        formData.question_text && formData?.question_text.trim() !== "";
      const hasQuestionMedia =
        Array.isArray(formData["question_text_media"]) &&
        formData["question_text_media"].length > 0;
      if (!hasQuestionText && !hasQuestionMedia) {
        validationErrors.question = "Question text or image is required.";
      }

      // Options: require either text or media for each
      for (let i = 1; i <= 4; i++) {
        const optionKey = `option${i}`;
        const optionMediaKey = `${optionKey}_media`;
        const hasOptionText =
          formData[optionKey] && formData[optionKey].trim() !== "";
        const hasOptionMedia =
          Array.isArray(formData[optionMediaKey]) &&
          formData[optionMediaKey].length > 0;
        if (!hasOptionText && !hasOptionMedia) {
          validationErrors[optionKey] =
            `Option ${String.fromCharCode(64 + i)} text or image is required.`;
        }
      }
    } else {
      // Non-image-based: require text for question and options
      if (!formData.question_text || formData.question_text.trim() === "") {
        validationErrors.question_text = "Question text is required.";
      }
      const optionValues = new Set();
      for (let i = 1; i <= 4; i++) {
        const optionKey = `option${i}`;
        const optionValue = formData[optionKey]?.trim();
        if (!optionValue) {
          validationErrors[optionKey] =
            `Option ${String.fromCharCode(64 + i)} is required.`;
        } else if (optionValues.has(optionValue.toLowerCase())) {
          validationErrors[optionKey] =
            `Option ${String.fromCharCode(64 + i)} must be unique.`;
        } else {
          optionValues.add(optionValue.toLowerCase());
        }
      }
    }

    // Correct answer must point to a non-empty option
    if (
      formData.correct_answer &&
      !(
        (formData[formData.correct_answer] &&
          formData[formData.correct_answer].trim()) ||
        (Array.isArray(formData[`${formData.correct_answer}_media`]) &&
          formData[`${formData.correct_answer}_media`].length > 0)
      )
    ) {
      validationErrors.correct_answer =
        "Selected answer option cannot be empty (text or image required).";
    }

    return Object.keys(validationErrors).length === 0;
  }

  function getHttpMethod(mode) {
    switch (mode) {
      case "add":
        return "POST";
      case "edit":
        return "PUT";
      case "add-temp":
        return "POST";
    }
  }
  //------------------------ Handle Image Questions ---------------------
  function handleImageBasedContentChange(event) {
    const { questionData, options, correctAnswer } = event.detail;

    // Add image media fields
    formData[`question_text_media`] =
      questionData.images?.map((img) => img.file) || [];
    formData.question_text = questionData.question || "";

    // Map option media and text
    ["option1", "option2", "option3", "option4"].forEach((key, idx) => {
      const opt = options[idx];
      formData[`${key}_media`] = opt?.files || [];
      formData[key] = opt?.text || "";
    });

    // Set correct answer if provided
    if (correctAnswer) {
      const idx = options.findIndex((opt) => opt.id === correctAnswer);
      if (idx !== -1) {
        formData.correct_answer = `option${idx + 1}`;
      }
    }
    formData = { ...formData };

    // Forward child's image-based change to parent page in edit mode
    if (mode === "edit") {
      dispatch("imageChange", { questionData, options, correctAnswer });
    }
  }

  // ------------------------------------- Form Submissions --------------------------------

  async function handleSubmit(event) {
    let submissionData;
    questionSubmissionSuccess = false;
    event.preventDefault();
    clearNotification();
    if (isLoading) return;

    if (!validateForm()) {
      validationErrors = { ...validationErrors };
      return;
    }

    isLoading = true;
    dispatch("submissionInProgress", isLoading);
    try {
      // Check for temporary codes and convert them to actual codes
      // await handleTempCodeGeneration();

      const optionToLetter = {
        option1: "A",
        option2: "B",
        option3: "C",
        option4: "D",
      };

      // Check if any media files are present
      const mediaFields = [
        "question_text_media",
        "option1_media",
        "option2_media",
        "option3_media",
        "option4_media",
      ];
      // In normal add/create flows, presence of media triggers multipart FormData.
      // However, for edit + image-format (format_code === "6000"), images are
      // uploaded/managed by the child component; from here we should send only text data.
      let hasMedia = false;
      if (!(mode === "edit" && formData.format_code === "6000")) {
        for (const field of mediaFields) {
          if (Array.isArray(formData[field]) && formData[field].length > 0) {
            hasMedia = true;
            break;
          }
        }
      }

      let response, result;
      const method = getHttpMethod(mode);

      if (hasMedia) {
        const form = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (!mediaFields.includes(key) && key !== "correct_answer") {
            form.append(key, value ?? "");
          }
        });
        mediaFields.forEach((field) => {
          if (Array.isArray(formData[field])) {
            formData[field].forEach((file) => {
              form.append(field, file);
            });
          }
        });
        form.append(
          "correct_answer",
          optionToLetter[formData.correct_answer] || formData.correct_answer
        );
        // Assign submissionData for image-based questions as well (for dispatch)
        const {
          question_text_media,
          option1_media,
          option2_media,
          option3_media,
          option4_media,
          ...textPayload
        } = formData;
        submissionData = {
          ...textPayload,
          correct_answer:
            optionToLetter[formData.correct_answer] || formData.correct_answer,
        };
        response = await apiClient(endpoint, {
          method,
          body: form,
        });
      } else {
        // Exclude media fields for text-based questions OR for edit-image-case
        // Build a JSON payload that excludes any *_media fields.
        // This branch is used for text-only submissions AND for edit-mode image-format
        // where images are handled separately by the child component.
        const {
          question_text_media,
          option1_media,
          option2_media,
          option3_media,
          option4_media,
          ...textPayload
        } = formData;
        submissionData = {
          ...textPayload,
          correct_answer:
            optionToLetter[formData.correct_answer] || formData.correct_answer,
        };
        response = await apiClient(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });
      }
      // Try to parse response, handle network errors
      try {
        result = await response?.json();
      } catch (jsonErr) {
        throw new Error("Failed to submit question.");
      }
      if (!response || !response.ok) {
        if (response === null) {
          throw new Error("Failed to submit question.");
        }
        if (showMessageAboveQuestion) {
          notification = {
            show: true,
            kind: "error",
            message:
              result?.error || result?.message || "Failed to submit question.",
          };
        }
        throw new Error(
          result?.error || result?.message || "Failed to submit question."
        );
      }

      // Show success notification above content if enabled
      if (showMessageAboveQuestion) {
        notification = {
          show: true,
          kind: "success",
          message:
            mode === "add"
              ? `Succesfully added question '${result?.qmt_question_text}'`
              : `Successfully updated question '${result?.qmt_question_text}'`,
          subtext: "Add another question.",
        };
        setTimeout(scrollToNotification, 50);
      }

      if (!tempQuestionAdd) {
        questionList = [
          ...questionList,
          {
            ...result,
            state: states.find((s) => s.id == result.state_id)?.name || "",
            board: boards.find((b) => b.id == result.board_id)?.name || "",
            question_type:
              questionTypes.find((qt) => qt.id == formData.type_code)?.name ||
              "",
            format:
              formats.find((f) => f.id == formData.format_code)?.name || "",
            subject:
              subjectsList.find(
                (s) => String(s.subject_code) === String(formData.subject_code)
              )?.name ||
              result.subject.smt_subject_name ||
              "",
            options: [
              result.qmt_option1 ?? "",
              result.qmt_option2 ?? "",
              result.qmt_option3 ?? "",
              result.qmt_option4 ?? "",
            ],
            option1_media: result.qmt_option1_media ?? [],
            option2_media: result.qmt_option2_media ?? [],
            option3_media: result.qmt_option3_media ?? [],
            option4_media: result.qmt_option4_media ?? [],
            correct_answer: result.qmt_correct_answer,
            is_image: formData.format_code == "6000",
          },
        ];
      }

      dispatch("formSubmission", {
        type: "success",
        message:
          mode === "add"
            ? `Succesfully added question '${result?.qmt_question_text}'`
            : `Successfully updated question '${result?.qmt_question_text}'`,
        data: result,
        payload: submissionData,
      });

      formData.question_text = "";
      formData.option1 = "";
      formData.option2 = "";
      formData.option3 = "";
      formData.option4 = "";
      formData.correct_answer = "";
      formData.question_text_media = [];
      formData.option1_media = [];
      formData.option2_media = [];
      formData.option3_media = [];
      formData.option4_media = [];
      questionSubmissionSuccess = true;
    } catch (error) {
      console.error("Error submitting question:", error);
      validationErrors.submit = error.message || "Failed to submit question.";
      validationErrors = { ...validationErrors };

      if (showMessageAboveQuestion) {
        notification = {
          show: true,
          kind: "error",
          message: error.message || "Failed to submit question",
          subtext: "",
        };
        setTimeout(scrollToNotification, 50);
      }
      dispatch("formSubmission", {
        type: "error",
        message: error.message || "Failed to submit question",
        error: error,
        payload: submissionData,
      });
    } finally {
      isLoading = false;
      dispatch("submissionInProgress", isLoading);
    }
  }

  // ------------------- Lifecycle Functions -------------------------------------
  // Initial form data setup in edit mode
  onMount(async () => {
    if (mode === "edit" || (mode === "add-temp" && existingQuestion)) {
      const preparedData = {
        ...existingQuestion,
        standard: String(existingQuestion.standard || ""),
        medium_code: String(existingQuestion.medium_code || ""),
        subject_code: String(existingQuestion.subject_code || ""),
        chapter_code: String(existingQuestion.chapter_code || ""),
        topic_code: String(existingQuestion.topic_code || ""),
        subtopic_code: String(existingQuestion.subtopic_code || ""),
      };

      formData = preparedData;
      if (formData.standard && formData.medium_code && formData.subject_code) {
        await loadChaptersAndAll();
        allChaptersData = [...allChaptersData];
      }
    }
  });

  // -------------------------- General Functions -------------------------------------------
  function resetForm() {
    const initialFormData = {
      state_id: "",
      board_id: "",
      medium_code: "",
      standard: "",
      subject_code: "",
      chapter_code: "",
      topic_code: "",
      subtopic_code: "",
      cognitive_learning_id: "",
      difficulty_id: "",
      type_code: "",
      question_text: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct_answer: "",
      question_text_media: [],
      option1_media: [],
      option2_media: [],
      option3_media: [],
      option4_media: [],
    };
    formData = { ...initialFormData };
    validationErrors = {};
    allChaptersData = [];
  }

  function handleGoBack() {
    resetForm();
    if (tempQuestionAdd) {
      dispatch("cancel");
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }

  function resetInChildSuccessful() {
    questionSubmissionSuccess = false;
  }

  function scrollToNotification() {
    if (
      notificationRef &&
      typeof notificationRef.scrollIntoView === "function"
    ) {
      notificationRef.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function clearNotification() {
    notification = {
      show: false,
      kind: "",
      message: "",
      subtext: "",
    };
  }
</script>

{#if showMessageAboveQuestion && notification.show & (notification.kind == "error")}
  <div class="mt-2" bind:this={notificationRef}>
    <InlineNotification
      kind={notification.kind}
      title={notification.message}
      on:close={() => clearNotification()}
    />
  </div>
{/if}
<div class="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 text-dark-gray">
  <div
    class="bg-slate-50 rounded-xl shadow-lg border border-gray-100 transition-all duration-200"
  >
    <div
      class="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-base sm:text-lg font-semibold text-dark-gray">
            {mode === "edit" ? "Edit Question" : "Add Question"}
          </h2>
        </div>
      </div>
    </div>

    <div class="px-2 sm:px-4 py-2 sm:py-4 bg-white">
      <form on:submit|preventDefault={handleSubmit} class="space-y-2">
        {#if !tempQuestionAdd}
          <div
            class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm"
          >
            <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
              Basic Details
            </h3>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4"
            >
              <div>
                <SearchableComboBox
                  title="State"
                  label="State"
                  placeholder="Select state"
                  options={states}
                  selectedItemName={formData.state_id
                    ? states?.find((s) => s.id == formData.state_id)?.name || ""
                    : ""}
                  selectedItemId={formData.state_id || ""}
                  validationErrors={validationErrors?.state_id}
                  required={true}
                  on:handleDispatchComboBoxData={(e) =>
                    handleDropdownSelect("state_id")({
                      detail: {
                        selectedOption: {
                          id: e.detail.selectedItemId,
                          name: e.detail.selectedItemName,
                        },
                      },
                    })}
                  on:handleDispatchFilterData={() =>
                    handleDropdownCancel("state_id")()}
                />
              </div>
              <div>
                <DropDown
                  title="Board"
                  placeholder="Select board"
                  options={boards}
                  selectedItemName={formData.board_id
                    ? boards.find((b) => b.id == formData.board_id)?.name || ""
                    : ""}
                  selectedItemUuid={formData.board_id || ""}
                  validationErrors={validationErrors.board_id}
                  required={true}
                  on:handleDispatchFilterData={handleDropdownSelect("board_id")}
                  on:handleCancelSelection={handleDropdownCancel("board_id")}
                />
              </div>
              <div>
                <DropDown
                  title="Medium"
                  placeholder="Select medium"
                  options={mediums}
                  selectedItemName={formData.medium_code
                    ? mediums.find((m) => m.id == formData.medium_code)?.name ||
                      ""
                    : ""}
                  selectedItemUuid={formData.medium_code || ""}
                  validationErrors={validationErrors.medium_code}
                  required={true}
                  on:handleDispatchFilterData={handleDropdownSelect(
                    "medium_code"
                  )}
                  on:handleCancelSelection={handleDropdownCancel("medium_code")}
                />
              </div>
              <div>
                <DropDown
                  title="Standard"
                  placeholder="Select Standard"
                  options={classes}
                  selectedItemName={formData.standard
                    ? classes.find((c) => c.id == formData.standard)?.name || ""
                    : ""}
                  selectedItemUuid={formData.standard || ""}
                  validationErrors={validationErrors.standard}
                  required={true}
                  on:handleDispatchFilterData={handleDropdownSelect("standard")}
                  on:handleCancelSelection={handleDropdownCancel("standard")}
                />
              </div>
            </div>
          </div>

          <div
            class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm"
          >
            <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
              Subject & Curriculum
            </h3>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4"
            >
              <div>
                <SearchableComboBox
                  dynamicItemAdd
                  title="Subject"
                  filterCategory="Subject"
                  label="Subject"
                  placeholder="Select subject"
                  options={subjectsList}
                  selectedItemName={formData.subject_code
                    ? subjectsList.find(
                        (s) => s.subject_code === formData.subject_code
                      )?.name || ""
                    : ""}
                  selectedItemId={formData.subject_code || ""}
                  validationErrors={validationErrors.subject_code}
                  disabled={!formData.standard || !formData.medium_code}
                  required={true}
                  loading={subjectsLoading}
                  on:handleDispatchComboBoxData={(e) =>
                    handleDropdownSelect("subject_code")({
                      detail: {
                        selectedOption: {
                          id: e.detail.selectedItemId,
                          name: e.detail.selectedItemName,
                        },
                      },
                    })}
                  on:handleDispatchFilterData={() =>
                    handleDropdownCancel("subject_code")()}
                  on:dynamicItemAddition={(e) =>
                    handleDynamicItemAddition({
                      ...e,
                      detail: { ...e.detail, type: "subject" },
                    })}
                />
              </div>
              <div>
                <SearchableComboBox
                  dynamicItemAdd
                  title="Chapter"
                  filterCategory="Chapter"
                  label="Chapter"
                  placeholder="Select chapter"
                  options={chapters}
                  selectedItemName={formData.chapter_code
                    ? chapters.find((c) => c.id === formData.chapter_code)
                        ?.name || ""
                    : ""}
                  selectedItemId={formData.chapter_code || ""}
                  validationErrors={validationErrors.chapter_code}
                  disabled={!formData.standard ||
                    !formData.medium_code ||
                    !formData.subject_code}
                  required={true}
                  loading={chaptersLoading}
                  on:handleDispatchComboBoxData={(e) =>
                    handleDropdownSelect("chapter_code")({
                      detail: {
                        selectedOption: {
                          id: e.detail.selectedItemId,
                          name: e.detail.selectedItemName,
                        },
                      },
                    })}
                  on:handleDispatchFilterData={() =>
                    handleDropdownCancel("chapter_code")()}
                  on:dynamicItemAddition={(e) =>
                    handleDynamicItemAddition({
                      ...e,
                      detail: { ...e.detail, type: "chapter" },
                    })}
                />
              </div>
              <div>
                <SearchableComboBox
                  dynamicItemAdd
                  title="Topic"
                  filterCategory="Topic"
                  label="Topic"
                  placeholder="Select topic"
                  options={topics}
                  selectedItemName={formData.topic_code
                    ? topics.find((t) => t.id === formData.topic_code)?.name ||
                      ""
                    : ""}
                  selectedItemId={formData.topic_code || ""}
                  validationErrors={validationErrors.topic_code}
                  disabled={!formData.chapter_code}
                  required={false}
                  on:handleDispatchComboBoxData={(e) =>
                    handleDropdownSelect("topic_code")({
                      detail: {
                        selectedOption: {
                          id: e.detail.selectedItemId,
                          name: e.detail.selectedItemName,
                        },
                      },
                    })}
                  on:handleDispatchFilterData={() =>
                    handleDropdownCancel("topic_code")()}
                  on:dynamicItemAddition={(e) =>
                    handleDynamicItemAddition({
                      ...e,
                      detail: { ...e.detail, type: "topic" },
                    })}
                />
              </div>
              <div>
                <SearchableComboBox
                  dynamicItemAdd
                  title="Subtopic"
                  filterCategory="Subtopic"
                  label="Subtopic"
                  placeholder="Select subtopic"
                  options={subtopics}
                  selectedItemName={formData.subtopic_code
                    ? subtopics.find((st) => st.id === formData.subtopic_code)
                        ?.name || ""
                    : ""}
                  selectedItemId={formData.subtopic_code || ""}
                  validationErrors={validationErrors.subtopic_code}
                  disabled={!formData.topic_code}
                  on:handleDispatchComboBoxData={(e) =>
                    handleDropdownSelect("subtopic_code")({
                      detail: {
                        selectedOption: {
                          id: e.detail.selectedItemId,
                          name: e.detail.selectedItemName,
                        },
                      },
                    })}
                  on:handleDispatchFilterData={() =>
                    handleDropdownCancel("subtopic_code")()}
                  on:dynamicItemAddition={(e) =>
                    handleDynamicItemAddition({
                      ...e,
                      detail: { ...e.detail, type: "subtopic" },
                    })}
                />
              </div>
            </div>
          </div>
        {:else}
          <div
            class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm"
          >
            <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
              Basic Details
            </h3>
            <div class="flex gap-6 flex-wrap w-full">
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >State: &nbsp;</span
                >
                <span class="text-sm">{tempQuestionMetadata.state}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >Board: &nbsp;</span
                >
                <span class="text-sm">{tempQuestionMetadata.board_name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >Subject: &nbsp;</span
                >
                <span class="text-sm">{tempQuestionMetadata.subject}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >Medium: &nbsp;</span
                >
                <span class="text-sm">{tempQuestionMetadata.medium}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >Standard: &nbsp;</span
                >
                <span class="text-sm">{tempQuestionMetadata.standard}</span>
              </div>
            </div>
          </div>
          <div
            class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm"
          >
            <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
              Chapter & Topic
            </h3>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4"
            >
              <div>
                <DropDown
                  title="Chapter"
                  placeholder="Select chapter"
                  options={chapters}
                  selectedItemName={formData.chapter_code
                    ? chapters.find((c) => c.id === formData.chapter_code)
                        ?.name || ""
                    : ""}
                  selectedItemUuid={formData.chapter_code || ""}
                  validationErrors={validationErrors.chapter_code}
                  disabled={!formData.standard ||
                    !formData.medium_code ||
                    !formData.subject_code}
                  required={true}
                  loading={chaptersLoading}
                  on:handleDispatchFilterData={handleDropdownSelect(
                    "chapter_code"
                  )}
                  on:handleCancelSelection={handleDropdownCancel(
                    "chapter_code"
                  )}
                />
              </div>
              <div>
                <DropDown
                  title="Topic"
                  placeholder="Select topic"
                  options={topics}
                  selectedItemName={formData.topic_code
                    ? topics.find((t) => t.id === formData.topic_code)?.name ||
                      ""
                    : ""}
                  selectedItemUuid={formData.topic_code || ""}
                  validationErrors={validationErrors.topic_code}
                  disabled={!formData.chapter_code}
                  required={false}
                  on:handleDispatchFilterData={handleDropdownSelect(
                    "topic_code"
                  )}
                  on:handleCancelSelection={handleDropdownCancel("topic_code")}
                />
              </div>
              <div>
                <DropDown
                  title="Subtopic"
                  placeholder="Select subtopic"
                  options={subtopics}
                  selectedItemName={formData.subtopic_code
                    ? subtopics.find((st) => st.id === formData.subtopic_code)
                        ?.name || ""
                    : ""}
                  selectedItemUuid={formData.subtopic_code || ""}
                  validationErrors={validationErrors.subtopic_code}
                  disabled={!formData.topic_code}
                  on:handleDispatchFilterData={handleDropdownSelect(
                    "subtopic_code"
                  )}
                  on:handleCancelSelection={handleDropdownCancel(
                    "subtopic_code"
                  )}
                />
              </div>
            </div>
          </div>
        {/if}
        <div class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm">
          <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
            Question Attributes
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <DropDown
                title="Cognitive Learning Level"
                placeholder="Select cognitive level"
                options={cognitiveLearning}
                selectedItemName={formData.cognitive_learning_id
                  ? cognitiveLearning.find(
                      (cl) => cl.id == formData.cognitive_learning_id
                    )?.name || ""
                  : ""}
                selectedItemUuid={formData.cognitive_learning_id || ""}
                validationErrors={validationErrors.cognitive_learning_id}
                required={true}
                on:handleDispatchFilterData={handleDropdownSelect(
                  "cognitive_learning_id"
                )}
                on:handleCancelSelection={handleDropdownCancel(
                  "cognitive_learning_id"
                )}
              />
            </div>
            <div>
              <DropDown
                title="Difficulty Level"
                placeholder="Select difficulty"
                options={difficultyLevels}
                required={true}
                selectedItemName={formData.difficulty_id
                  ? difficultyLevels.find(
                      (dl) => dl.id == formData.difficulty_id
                    )?.name || ""
                  : ""}
                selectedItemUuid={formData.difficulty_id || ""}
                validationErrors={validationErrors.difficulty_id}
                on:handleDispatchFilterData={handleDropdownSelect(
                  "difficulty_id"
                )}
                on:handleCancelSelection={handleDropdownCancel("difficulty_id")}
              />
            </div>
            <div>
              <DropDown
                title="Question Type"
                placeholder="Select question type"
                options={questionTypes}
                required={true}
                selectedItemName={formData.type_code
                  ? questionTypes.find((qt) => qt.id == formData.type_code)
                      ?.name || ""
                  : ""}
                selectedItemUuid={formData.type_code || ""}
                validationErrors={validationErrors.type_code}
                on:handleDispatchFilterData={handleDropdownSelect("type_code")}
                on:handleCancelSelection={handleDropdownCancel("type_code")}
              />
            </div>
            <div>
              <DropDown
                title="Question Format"
                placeholder="Select question format"
                options={formats}
                required={true}
                selectedItemName={formData.format_code
                  ? formats.find((ft) => ft.id == formData.format_code)?.name ||
                    ""
                  : ""}
                selectedItemUuid={formData.format_code || ""}
                validationErrors={validationErrors.format_code}
                disabled={mode === "edit"}
                on:handleDispatchFilterData={handleDropdownSelect(
                  "format_code"
                )}
                on:handleCancelSelection={handleDropdownCancel("format_code")}
              />
            </div>
          </div>
        </div>

        {#if showMessageAboveQuestion && notification.show & (notification.kind == "success")}
          <div class="my-4" bind:this={notificationRef}>
            <InlineNotification
              kind={notification.kind}
              title={notification.message}
              subtitle={notification.subtext}
              on:close={() => clearNotification()}
            />
          </div>
        {/if}

        {#if formData.type_code === "1000"}
          {#if formData.format_code === "5000"}
            <MCQForm
              {formData}
              {optionLabels}
              {availableCorrectAnswers}
              {validationErrors}
              {handleInputData}
              {handleDropdownSelect}
              {handleDropdownCancel}
            />
          {:else if formData.format_code === "6000"}
            {#if mode === "edit"}
              <ImageBasedQuestionContent
                {validationErrors}
                {questionSubmissionSuccess}
                {mode}
                questionId={existingQuestion?.question_code}
                resetForm={questionSubmissionSuccess}
                on:change={handleImageBasedContentChange}
                on:resetSuccessful={resetInChildSuccessful}
                {questionData}
                {options}
                {correctAnswer}
              />
            {:else}
              <ImageBasedQuestionContent
                {validationErrors}
                {questionSubmissionSuccess}
                {mode}
                resetForm={questionSubmissionSuccess}
                on:change={handleImageBasedContentChange}
                on:resetSuccessful={resetInChildSuccessful}
              />
            {/if}
          {/if}
        {/if}

        <div
          class="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap"
        >
          <Button
            btnType="secondary"
            on:click={handleGoBack}
            disabled={isLoading}
            title="Cancel"
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            btnType="primary"
            title="Submit"
          >
            {#if isLoading}
              <LoadingSpinner size="small" color="white" />
            {/if}
            <span> Submit </span>
          </Button>
        </div>
      </form>

      {#if questionList.length > 0}
        <hr class="my-6 border-gray-200" />
        <SessionQuestionTable {questionList} />
      {/if}
    </div>
  </div>
</div>

<!-- Dynamic Item Addition Popup -->
<DynamicSubChapAdd
  isOpen={showDynamicAddPopup}
  type={dynamicAddType}
  {formData}
  newItemData={newChapTopicSubTopic}
  {states}
  {boards}
  {mediums}
  subjects={subjectsList}
  {chapters}
  {topics}
  on:submit={handleDynamicAddSubmit}
  on:cancel={handleDynamicAddCancel}
/>
