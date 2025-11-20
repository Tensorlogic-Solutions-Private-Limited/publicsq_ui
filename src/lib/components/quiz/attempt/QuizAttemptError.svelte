<script>
  import { goto } from "$app/navigation";
  import Button from "$lib/components/reusable/Button.svelte";
  export let error = "Something went wrong while loading the quiz.";
  export let onRetry = null;

  function handleGoHome() {
    goto("/home");
  }
</script>

<div
  class="flex flex-col items-center justify-center min-h-[300px] p-8 bg-white rounded-lg shadow border border-red-200"
>
  <div class="flex items-center mb-4">
    <svg
      class="w-8 h-8 text-red-500 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01M6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
    <h2 class="text-xl font-semibold text-red-700">Quiz Load Error</h2>
  </div>
  <p class="text-gray-700 text-center mb-6 max-w-md">{error}</p>
  {#if onRetry}
    <div class="flex gap-2">
      <Button btnType="secondary" on:click={handleGoHome}>Go home</Button>
      <Button on:click={onRetry}>Retry</Button>
    </div>
  {/if}
</div>
