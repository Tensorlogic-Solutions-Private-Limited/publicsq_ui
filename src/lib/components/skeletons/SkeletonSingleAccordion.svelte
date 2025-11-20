<script>
  // Skeleton loader for a single Accordion component
  export let isExpanded = true; // Whether to show expanded content
</script>

<div
  class="border border-gray-200 rounded-lg bg-white overflow-hidden animate-pulse"
>
  <!-- Header -->
  <div
    class={`flex items-center justify-between gap-2 px-5 py-4 min-h-[60px] ${
      isExpanded ? "bg-indigo-50" : "bg-white"
    }`}
  >
    <!-- Left side: Title and metadata -->
    <div class="flex flex-col gap-2 flex-1">
      <!-- Title skeleton -->
      <div class="h-4 bg-gray-300 rounded w-64"></div>

      <!-- Metadata skeleton -->
      <div class="flex gap-4">
        <div class="h-3 bg-gray-300 rounded w-20"></div>
        <div class="h-3 bg-gray-300 rounded w-24"></div>
        <div class="h-3 bg-gray-300 rounded w-28"></div>
      </div>
    </div>

    <!-- Right side: Action icons and chevron -->
    <div class="flex items-center gap-2">
      <!-- Action icons skeleton -->
      <div class="flex gap-3 items-center">
        <div class="h-4 w-4 bg-gray-300 rounded"></div>
        <div class="h-4 w-4 bg-gray-300 rounded"></div>
      </div>

      <!-- Chevron icon skeleton -->
      <div class="h-4 w-4 bg-gray-300 rounded"></div>
    </div>
  </div>

  <!-- Expandable Content (only shown if isExpanded) -->
  {#if isExpanded}
    <div class="p-4 bg-gray-50">
      <!-- Chapter heading skeleton -->
      <div class="mb-3">
        <div class="h-4 bg-gray-300 rounded w-48"></div>
      </div>

      <!-- Badge skeleton -->
      <div class="mb-4">
        <div class="h-6 bg-gray-300 rounded-full w-32"></div>
      </div>

      <!-- Content rows skeleton (simulating table-like structure) -->
      <div class="space-y-2">
        {#each Array(3) as _, rowIndex}
          <div class="flex items-center gap-3">
            <div class="h-3 bg-gray-300 rounded w-full"></div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
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
