<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import QuizResults from "$lib/components/quiz/QuizResults.svelte";

  const dispatch = createEventDispatcher();

  export let quizResults = null;
  export let generatedQuiz = null;

  function handleCreateNewExam() {
    dispatch("createNew");
  }

  function handleGoToExams() {
    dispatch("goToList");
  }

  function handleRestart() {
    dispatch("restart");
  }
</script>

<div class="min-h-screen bg-white">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Exam Complete</h1>
          <p class="text-gray-600 mt-1">
            Review your performance and results
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex items-center space-x-4">
          <Button on:click={handleCreateNewExam} btnType="secondary">
            Create Another Exam
          </Button>
          <Button btnType="secondary" on:click={handleGoToExams}>
            Go to Exams
          </Button>
        </div>
      </div>
    </div>

    <!-- Results Component -->
    <div class="bg-white rounded-lg shadow-sm">
      <QuizResults
        {quizResults}
        quiz={generatedQuiz}
        on:restart={handleRestart}
      />
    </div>
  </div>
</div>
