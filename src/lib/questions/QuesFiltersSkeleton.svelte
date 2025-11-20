<script>
  // No props needed for now
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 animate-pulse">
  <div class="flex items-center justify-between mb-6">
    <div>
      <div class="h-5 w-32 bg-gray-200 rounded mb-2"></div>
      <div class="h-3 w-48 bg-gray-100 rounded"></div>
    </div>
  </div>

  <div class="border border-gray-200 rounded-lg p-6">
    <div class="flex items-center gap-2 mb-4">
      <div class="h-5 w-5 bg-gray-200 rounded-full"></div>
      <div class="h-4 w-20 bg-gray-200 rounded"></div>
    </div>

    <div class="mb-4">
      <div class="h-4 w-32 bg-gray-200 rounded mb-2"></div>
      <div class="h-10 w-full bg-gray-100 rounded"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      <div class="flex flex-col gap-2">
        <div class="h-4 w-20 bg-gray-200 rounded"></div>
        <div class="h-10 w-full bg-gray-100 rounded"></div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="h-4 w-20 bg-gray-200 rounded"></div>
        <div class="h-10 w-full bg-gray-100 rounded"></div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="h-4 w-20 bg-gray-200 rounded"></div>
        <div class="h-10 w-full bg-gray-100 rounded"></div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="h-4 w-20 bg-gray-200 rounded"></div>
        <div class="h-10 w-full bg-gray-100 rounded"></div>
      </div>
      <div></div>
      <div></div>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 justify-end mt-6">
      <div class="h-10 w-32 bg-gray-200 rounded"></div>
      <div class="h-10 w-32 bg-gray-300 rounded"></div>
    </div>
  </div>
</div>

<style>
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
