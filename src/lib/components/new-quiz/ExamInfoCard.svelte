<script>
  import Button from "$lib/components/reusable/Button.svelte";

  export let examDetails;
  export let designs = [];
  export let onEdit = () => {};
  export let allowEdit = false;

  // Calculate total questions from all designs
  $: totalQuestions = designs?.reduce(
    (sum, design) => sum + (design.total_questions || 0),
    0
  );

  // Get display label for status
  function getStatusLabel(status) {
    if (status === "completed") return "Conducted";
    return status;
  }
</script>

<div class="bg-white border-b border-b-gray-200 pb-6 mb-6">
  <div
    class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
  >
    <!-- Exam Info -->
    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-700"
    >
      <span class="font-semibold text-dark-gray">
        Exam name: <span class="font-normal">{examDetails?.exam_name}</span>
      </span>
      <span class="text-gray-400 hidden sm:inline">|</span>
      <span>
        Duration: <span class="font-medium">{examDetails?.total_time? `${examDetails?.total_time} min` :'-'} </span>
      </span>
      <span class="text-gray-400 hidden sm:inline">|</span>
      <span>
        Total Questions: <span class="font-medium">{totalQuestions}</span>
      </span>
      <span class="text-gray-400 hidden sm:inline">|</span>
      <span>
        Mode: <span class="font-medium capitalize"
          >{examDetails?.exam_mode}</span
        >
      </span>
      <span class="text-gray-400 hidden sm:inline">|</span>
      <span class="flex items-center gap-2">
        Status:
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          class:bg-gray-100={examDetails?.status === "draft"}
          class:text-gray-800={examDetails?.status === "draft"}
          class:bg-blue-100={examDetails?.status === "saved"}
          class:text-blue-800={examDetails?.status === "saved"}
          class:bg-yellow-100={examDetails?.status === "started"}
          class:text-yellow-800={examDetails?.status === "started"}
          class:bg-green-100={examDetails?.status === "completed"}
          class:text-green-800={examDetails?.status === "completed"}
        >
          {getStatusLabel(examDetails?.status)}
        </span>
      </span>
    </div>

    <!-- Edit Button -->
    {#if allowEdit}
      <Button btnType="secondary" size="sm" on:click={onEdit}>Edit</Button>
    {/if}
  </div>
</div>
