<script>
  import { createEventDispatcher } from "svelte";
  import { quizStore } from "$lib/stores/quizStore.js";
  import {
    decodeHTMLEntities,
    cleanQuestionText,
  } from "$lib/utils/textUtils.js";
  import QuestionRemarks from "$lib/components/quiz/QuestionRemarks.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import QuizResultQuestionCard from "$lib/components/attempt/QuizResultQuestionCard.svelte";
  import { goto } from "$app/navigation";

  const dispatch = createEventDispatcher();

  export let quizResults = null;
  export let quiz = null;
  export let config = {};

  // Calculated results
  let calculatedResults = null;
  let questions = [];
  let detailedResults = [];

  // Display options
  let showCorrectAnswersOnly = false;
  let showIncorrectAnswersOnly = false;
  let showUnansweredOnly = false;
  let selectedQuestionIndex = null;
  let showExplanations = true;

  // Initialize results when component loads
  $: if (quizResults && quiz) {
    processResults();
  }

  function processResults() {
    // Clean the quiz data before processing
    const cleanedQuiz = {
      ...quiz,
      metadata: {
        ...quiz.metadata,
        exam_name: decodeHTMLEntities(quiz.metadata?.exam_name || "Quiz"),
        subject_name: decodeHTMLEntities(quiz.metadata?.subject_name || ""),
        standard_name: decodeHTMLEntities(quiz.metadata?.standard_name || ""),
      },
      questions:
        quiz.questions?.map((question) => {
          // Clean the question using textUtils
          const cleanedQuestion = cleanQuestionText(question);

          // Clean options
          if (
            cleanedQuestion.options &&
            Array.isArray(cleanedQuestion.options)
          ) {
            cleanedQuestion.options = cleanedQuestion.options.map((option) => ({
              ...option,
              text: decodeHTMLEntities(option.text || option.option_text || ""),
              description: option.description
                ? decodeHTMLEntities(option.description)
                : "",
            }));
          }

          // Clean other fields
          if (cleanedQuestion.explanation) {
            cleanedQuestion.explanation = decodeHTMLEntities(
              cleanedQuestion.explanation
            );
          }

          if (cleanedQuestion.chapter) {
            cleanedQuestion.chapter = decodeHTMLEntities(
              cleanedQuestion.chapter
            );
          }

          if (cleanedQuestion.topic) {
            cleanedQuestion.topic = decodeHTMLEntities(cleanedQuestion.topic);
          }

          return cleanedQuestion;
        }) || [],
    };

    // Calculate detailed results using the cleaned quiz data
    calculatedResults = quizStore.calculateResults(
      cleanedQuiz,
      quizResults.session
    );
    questions = cleanedQuiz.questions || [];

    // Create detailed results for each question
    detailedResults = questions.map((question, index) => {
      const userAnswer = quizResults.session.answers[question.id];

      // Find correct option using both is_correct flag and correct_answer field
      let correctOption = question.options?.find((opt) => opt.is_correct);
      if (!correctOption && question.correct_answer) {
        correctOption = question.options?.find(
          (opt) => opt.id === question.correct_answer
        );
      }

      const selectedOption = question.options?.find(
        (opt) => opt.id === userAnswer
      );
      const isCorrect =
        userAnswer === (question.correct_answer || correctOption?.id);
      const isAttempted = userAnswer !== undefined && userAnswer !== null;

      // Get remarks for this question
      const questionRemark = quizResults.session.remarks?.[question.id];

      return {
        questionNumber: index + 1,
        question: {
          ...question,
          // Ensure text is clean for display
          text: decodeHTMLEntities(question.text || ""),
          chapter: question.chapter ? decodeHTMLEntities(question.chapter) : "",
          topic: question.topic ? decodeHTMLEntities(question.topic) : "",
          explanation: question.explanation
            ? decodeHTMLEntities(question.explanation)
            : "",
          options:
            question.options?.map((opt) => ({
              ...opt,
              text: decodeHTMLEntities(opt.text || ""),
            })) || [],
        },
        userAnswer,
        selectedOption: selectedOption
          ? {
              ...selectedOption,
              text: decodeHTMLEntities(selectedOption.text || ""),
            }
          : null,
        correctOption: correctOption
          ? {
              ...correctOption,
              text: decodeHTMLEntities(correctOption.text || ""),
            }
          : null,
        isCorrect,
        isAttempted,
        status: isAttempted
          ? isCorrect
            ? "correct"
            : "incorrect"
          : "unanswered",
        remark: questionRemark || null,
      };
    });
  }

  function getOptionLabel(index) {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }

  function toggleQuestionDetails(index) {
    selectedQuestionIndex = selectedQuestionIndex === index ? null : index;
  }

  function getFilteredResults() {
    let filtered = detailedResults;

    if (showCorrectAnswersOnly) {
      filtered = filtered.filter((result) => result.status === "correct");
    } else if (showIncorrectAnswersOnly) {
      filtered = filtered.filter((result) => result.status === "incorrect");
    } else if (showUnansweredOnly) {
      filtered = filtered.filter((result) => result.status === "unanswered");
    }

    return filtered;
  }

  function handleRestart() {
    dispatch("restart");
  }

  function handleBackToSetup() {
    dispatch("back");
  }

  function downloadResults() {
    // Create a downloadable report with cleaned text
    const reportData = {
      quizName: decodeHTMLEntities(quiz?.metadata?.exam_name || "Quiz"),
      completedAt: formatDate(calculatedResults.completedAt),
      results: calculatedResults,
      remarks: quizResults.session.remarks || {},
      questions: detailedResults.map((result) => ({
        questionNumber: result.questionNumber,
        questionText: result.question.text,
        userAnswer: result.selectedOption?.text || "Not answered",
        correctAnswer: result.correctOption?.text || "",
        isCorrect: result.isCorrect,
        status: result.status,
        explanation: result.question.explanation || "",
        chapter: result.question.chapter || "",
        topic: result.question.topic || "",
        remark: result.remark?.text || "",
      })),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `quiz-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function printResults() {
    window.print();
  }

  // Clear all filters
  function clearFilters() {
    showCorrectAnswersOnly = false;
    showIncorrectAnswersOnly = false;
    showUnansweredOnly = false;
  }

  // Helper function to safely display text
  function safeDisplayText(text, maxLength = null) {
    if (!text) return "";
    const cleaned = decodeHTMLEntities(text);
    return maxLength
      ? cleaned.length > maxLength
        ? cleaned.substring(0, maxLength) + "..."
        : cleaned
      : cleaned;
  }

  // Reactive statements
  $: filteredResults = getFilteredResults();
  $: hasFilters =
    showCorrectAnswersOnly || showIncorrectAnswersOnly || showUnansweredOnly;
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-6xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h1>
      <p class="text-gray-600">
        {safeDisplayText(quiz?.metadata?.exam_name || "Quiz")}
      </p>
      <p class="text-sm text-gray-500">
        Completed on {formatDate(calculatedResults?.completedAt)}
      </p>
    </div>

    {#if calculatedResults}
      <!-- Score Overview -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
      >
        <!-- Score Display -->
        <!-- <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold mb-4">
            {calculatedResults.percentage}%
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            {calculatedResults.correct} out of {calculatedResults.totalQuestions}
          </h2>
          <p class="text-gray-600">
            {calculatedResults.passed ? 'Passed' : 'Failed'} • 
            {calculatedResults.attempted} attempted • 
            {calculatedResults.unanswered} unanswered
          </p>
        </div> -->

        <!-- Detailed Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">
              {calculatedResults.totalQuestions}
            </div>
            <div class="text-sm text-blue-700">Total Questions</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">
              {calculatedResults.correct}
            </div>
            <div class="text-sm text-green-700">Correct</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">
              {calculatedResults.incorrect}
            </div>
            <div class="text-sm text-red-700">Incorrect</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-600">
              {calculatedResults.unanswered}
            </div>
            <div class="text-sm text-gray-700">Unanswered</div>
          </div>
        </div>
      </div>

      <!-- Questions List -->
      <div class="space-y-4 mb-8">
        {#each filteredResults as result, index}
          <QuizResultQuestionCard
            {result}
            {selectedQuestionIndex}
            {toggleQuestionDetails}
            {safeDisplayText}
            {getOptionLabel}
          />
        {/each}

        <!-- No Results Message -->
        {#if filteredResults.length === 0}
          <div
            class="text-center py-8 bg-white rounded-lg border border-gray-200"
          >
            <svg
              class="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              No Questions Found
            </h3>
            <p class="text-gray-600">
              No questions match the current filter criteria.
            </p>
            <button
              on:click={clearFilters}
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-3">
            <Button on:click={() => goto("/exams/create")} btnType="tertiary">
              
              Create Another Exam
            </Button>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button on:click={downloadResults} btnType="tertiary">
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Result JSON
            </Button>

            <!-- <Button
              on:click={printResults}
             btnType="tertiary"
            >
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Results
            </Button> -->
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @media print {
    .no-print {
      display: none !important;
    }

    body {
      font-size: 12px;
    }

    .page-break {
      page-break-before: always;
    }
  }

  .score-circle {
    animation: score-reveal 2s ease-out;
  }

  @keyframes score-reveal {
    from {
      stroke-dasharray: 0 339.292;
    }
    to {
      stroke-dasharray: var(--score-dash) 339.292;
    }
  }

  .question-expand {
    animation: expand 0.3s ease-out;
  }

  @keyframes expand {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 1000px;
    }
  }

  .remarks-display-section {
    margin-top: 1rem;
  }
</style>
