<script>
  export let error = 'No Data Found';
  export let variant = 'minimal'; // Options: 'minimal', 'card', 'banner', 'badge'
</script>

{#if variant === 'minimal'}
  <!-- Minimal style -->
  <div class="flex flex-col items-center p-6 sm:gap-8 gap-4">
    <div>
      <div class="flex justify-center mb-2">
        <span class="material-icons-outlined text-red-600 text-xl">
          error_outline
        </span>
      </div>
      <h2 class="text-base font-semibold text-gray-900">{error}</h2>
    </div>
  </div>

{:else if variant === 'card'}
  <!-- Card-based with background -->
  <div class="flex flex-col items-center justify-center p-8 sm:p-12">
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
      <div class="flex justify-center mb-4">
        <!-- <div class="bg-red-100 p-3 rounded-full"> -->
          <span class="material-icons-outlined text-red-600 text-2xl">
            error
          </span>
        <!-- </div> -->
      </div>
      <h2 class="text-lg font-bold text-red-700">{error}</h2>
    </div>
  </div>

{:else if variant === 'banner'}
  <!-- Full-width banner -->
  <div class="w-full bg-red-50 border-l-4 border-red-600 p-4 sm:p-6">
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <span class="material-icons-outlined text-red-600 text-2xl">
          warning
        </span>
      </div>
      <div>
        <h3 class="font-semibold text-red-900">{error}</h3>
        <p class="text-sm text-red-700 mt-1">
          We encountered an issue loading your data.
        </p>
      </div>
    </div>
  </div>

{:else if variant === 'badge'}
  <!-- Compact badge style -->
  <div class="flex flex-col items-center justify-center p-6">
    <div class="inline-flex items-center gap-3 bg-red-100 text-red-700 px-4 py-3 rounded-full text-sm font-medium">
      <span class="material-icons-outlined text-red-600 text-base">
        info
      </span>
      <span>{error}</span>
    </div>
  </div>
{/if}

<style>
  /* Add scoped styles if needed */
</style>
