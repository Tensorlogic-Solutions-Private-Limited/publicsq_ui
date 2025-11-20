<script>
  import Button from "$lib/components/reusable/Button.svelte";

  export let status = "completed"; // completed, error, etc.
  export let title = "";
  export let message = "";
  export let examName = "";
  export let actions = []; // Array of {label, handler, btnType}
  export let icon = "completed"; // completed, error, warning, info

  const iconConfig = {
    completed: {
      svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
      color: "text-green-500"
    },
    error: {
      svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>`,
      color: "text-red-500"
    },
    warning: {
      svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>`,
      color: "text-yellow-500"
    },
    info: {
      svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
      color: "text-blue-500"
    }
  };

  $: currentIcon = iconConfig[icon] || iconConfig.completed;
</script>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
    <div class="text-center">
      <svg
        class="w-16 h-16 {currentIcon.color} mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {@html currentIcon.svg}
      </svg>
      
      {#if title}
        <h3 class="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {/if}
      
      {#if message}
        <p class="text-gray-600 mb-2">{message}</p>
      {/if}
      
      {#if examName}
        <p class="text-sm text-gray-500 mb-6">Exam: {examName}</p>
      {/if}
      
      {#if actions && actions.length > 0}
        <div class="flex gap-3 justify-center">
          {#each actions as action}
            <Button btnType={action.btnType || "primary"} on:click={action.handler}>
              {action.label}
            </Button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>