<script>
  // Skeleton loader for quiz preview/attempt view
  export let questionsCount = 1; // Number of question skeletons to show
</script>

<div class="bg-white min-h-screen animate-pulse">
  <!-- Header Skeleton -->
  <div class="px-6 py-4 bg-gray-100 border-b border-gray-200">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <div class="h-6 bg-gray-300 rounded w-48"></div>
      <div class="h-6 bg-gray-300 rounded w-32"></div>
    </div>
  </div>

  <!-- Content Area -->
  <div class="max-w-4xl mx-auto px-6 py-8">
    {#each Array(questionsCount) as _, index}
      <div class="mb-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
        <!-- Question Header -->
        <div class="flex justify-between items-start mb-4">
          <div class="h-5 bg-gray-300 rounded w-24"></div>
          <div class="h-8 w-8 bg-gray-300 rounded"></div>
        </div>

        <!-- Question Text -->
        <div class="mb-6 space-y-2">
          <div class="h-4 bg-gray-300 rounded w-full"></div>
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          {#each Array(4) as _, optIndex}
            <div class="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div class="h-5 w-5 bg-gray-300 rounded-full mr-4"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Action Buttons Skeleton -->
    <div class="flex justify-center gap-4 mt-8">
      <div class="h-10 bg-gray-300 rounded w-32"></div>
      <div class="h-10 bg-gray-300 rounded w-32"></div>
      <div class="h-10 bg-gray-300 rounded w-32"></div>
    </div>
  </div>
</div>

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
