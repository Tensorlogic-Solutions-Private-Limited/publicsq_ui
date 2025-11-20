<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import QuizRunner from "$lib/components/quiz/QuizRunner.svelte";
  import ExamResultsView from "$lib/components/new-quiz/ExamResultsView.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import ExamStatusMessage from "$lib/components/reusable/ExamStatusMessage.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let data;

  $: examDetails = data.examDetails;
  $: examStatus = data.status;
  $: designs = examDetails?.designs || [];

  let loadingQuestions = true;
  let allQuestions = [];
  let fetchError = null;
  let generatedQuiz = null;
  let currentStep = "running"; // 'running' or 'results'
  let quizResults = null;
  let quizContainer = null; // reference for font scaling

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

  // Transform questions to QuizRunner format
  function transformQuestionsForQuizRunner(fetchedData) {
    const questions = [];

    fetchedData?.forEach(({ design, questionPaper }) => {
      // Extract questions from the question paper
      const designQuestions = questionPaper.qns || [];


      // Transform each question to match QuizRunner's expected format
      const transformedQuestions = designQuestions?.map((q, index) => {
      
        
        // Generate a unique ID if not present
        const questionId =  `q_${design.exam_code}_${q.id}_${index}`;

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
        } else {
          // If options come as individual properties
          if (q.option1) options.push({ id: 1, text: q.option1, is_correct: q.correct_answer === "1" });
          if (q.option2) options.push({ id: 2, text: q.option2, is_correct: q.correct_answer === "2" });
          if (q.option3) options.push({ id: 3, text: q.option3, is_correct: q.correct_answer === "3" });
          if (q.option4) options.push({ id: 4, text: q.option4, is_correct: q.correct_answer === "4" });
        }

        const correct_answer = options.filter(item => item.is_correct)

        return {
          id: questionId,
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
        chapters_topics: designs.map(d => ({
          subject_name: d.subject,
          standard: d.standard,
          medium: d.medium,
        })),
      },
    };
  }

  // Update exam status to "started"
  async function updateExamStatusToStarted(examCode) {
    try {
      const updateRes = await apiClient(`/apis/v2/exams/${examCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "started" }),
      });

      if (!updateRes || !updateRes.ok) {
        // Extract error message from response by parsing JSON
        try {
          const errorData = await updateRes.json();
          const errorMessage = errorData?.error;
          console.error("Failed to update exam status to started:", errorMessage);
        } catch (jsonError) {
          console.error("Failed to update exam status to started:", jsonError.message);
        }
      }
    } catch (err) {
      console.error("Error updating exam status to started:", err?.message);
    }
  }

  // Load all questions on mount
  onMount(async () => {
    if (designs.length === 0) {
      loadingQuestions = false;
      fetchError = "No exam sections found";
      return;
    }

    try {
      const { success, failed } = await fetchAllQuestionPapers(designs);

      if (failed.length > 0) {
        console.warn(`Failed to fetch ${failed.length} design(s):`, failed);
        fetchError = `Failed to load questions for ${failed.length} subject section(s)`;
      }

      if (success.length > 0) {
        allQuestions = transformQuestionsForQuizRunner(success);
        generatedQuiz = buildQuizObject(allQuestions, examDetails, designs);
        console.log('generatedQuiz',generatedQuiz)
        
        // Update exam status to "started" after 5 seconds of page load
        setTimeout(() => {
          if (examDetails?.exam_code) {
            updateExamStatusToStarted(examDetails.exam_code);
          }
        }, 5000);
      } else {
        fetchError = "Failed to load any questions. Please try again.";
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      fetchError = "An error occurred while loading questions. Please try again.";
    } finally {
      loadingQuestions = false;
    }
  });

  // Font size management - handle scaling at page level
  function handleFontSizeChange(event) {
    const { size, scale } = event.detail || {};

    // Apply font scaling to the quiz container
    if (quizContainer) {
      // Use transform scale with transform-origin (better cross-browser support)
      quizContainer.style.transform = `scale(${scale})`;
      quizContainer.style.transformOrigin = "top left";
      quizContainer.style.width = `${100 / scale}%`;
      quizContainer.style.height = `${100 / scale}%`;
    }
  }

  function handleBackToEdit() {
    if (examDetails?.exam_code) {
      goto(`/exams/${examDetails.exam_code}/details`);
    }
  }

  function goToResults(event) {
    quizResults = event.detail;
    currentStep = "results";
  }

  function handleQuizError(event) {
    fetchError = event.detail;
    currentStep = "error";
  }

  function handleCreateNewExam() {
    goto("/exams/create");
  }

  function gotoExams() {
    goto("/exams");
  }

  function handleRestart() {
    handleCreateNewExam();
  }
</script>

{#if examStatus === "completed"}
  <!-- Completed Exam State -->
  <ExamStatusMessage
    icon="completed"
    title="Exam Already Completed"
    message="This exam has already been completed and cannot be attempted again."
    examName={examDetails?.exam_name || "Unknown Exam"}
    actions={[
      {
        label: "Back to Exams",
        handler: gotoExams,
        btnType: "secondary"
      },
      {
        label: "Create New Exam", 
        handler: handleCreateNewExam,
        btnType: "primary"
      }
    ]}
  />
{:else if currentStep === "running"}
  <!-- Quiz Runner View -->
  <div class="min-h-screen" bind:this={quizContainer}>
    {#if loadingQuestions}
      <!-- Loading State -->
      <div class="flex flex-col items-center justify-center py-12 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <LoadingSpinner />
        <p class="text-gray-600 mt-4">Loading quiz...</p>
      </div>
    {:else if fetchError}
      <!-- Error State -->
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-6">
        <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div class="text-center">
            <svg
              class="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Failed to Load Exam</h3>
            <p class="text-gray-600 mb-6">{fetchError}</p>
            <div class="flex gap-3 justify-center">
              <Button btnType="secondary" on:click={handleBackToEdit}>
                Back to Edit
              </Button>
              <Button btnType="primary" on:click={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    {:else if generatedQuiz}
      <!-- Quiz Runner -->
      <QuizRunner
        quiz={generatedQuiz}
        showAnswers={false}
        mode="attempt"
        on:complete={goToResults}
        on:back={handleBackToEdit}
        on:error={handleQuizError}
        on:fontSizeChange={handleFontSizeChange}
      />
    {/if}
  </div>
{:else if currentStep === "results"}
  <!-- Results View -->
  <ExamResultsView
    {quizResults}
    {generatedQuiz}
    on:createNew={handleCreateNewExam}
    on:goToList={gotoExams}
    on:restart={handleRestart}
  />
{/if}
