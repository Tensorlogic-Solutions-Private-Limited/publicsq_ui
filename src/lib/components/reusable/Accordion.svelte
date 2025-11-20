<script>
  import { createEventDispatcher } from "svelte";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import SkeletonSingleAccordion from "$lib/components/skeletons/SkeletonSingleAccordion.svelte";

  const dispatch = createEventDispatcher();

  // Props
  export let title = "";
  export let isExpanded = false;
  export let showActions = true;
  export let actions = []; //actions = [ { icon: PencilLine, handler: 'edit', color(optional): 'text-blue-600', class(optional): 'hover:bg-blue-50'}]
  export let headerClass = "";
  export let contentClass = "";
  export let disabled = false;
  export let loading = false;

  let isOpen = isExpanded;

  $: isOpen = isExpanded;

  function toggleAccordion() {
    if (disabled) return;
    isOpen = !isOpen;
    dispatch("toggle", { isOpen });
  }

  function handleAction(event, action) {
    event.stopPropagation();
    dispatch(action.handler, action);
  }
</script>

{#if loading}
  <SkeletonSingleAccordion {isExpanded} />
{:else}
  <div
    class="border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-300 mb-2"
  >
  <!-- Header -->
  <div
    class="flex items-center justify-between gap-2 px-5 py-4 cursor-pointer {isOpen
      ? 'bg-indigo-50 '
      : 'bg-white hover:bg-gray-50'} border-none w-full text-left transition-colors duration-200 min-h-[60px]  focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-inset focus:rounded-lg md:px-4 md:py-3 sm:px-3 sm:py-2 {disabled
      ? 'cursor-not-allowed opacity-60 pointer-events-none'
      : ''} {headerClass}"
    on:click={toggleAccordion}
    on:keydown={(e) =>
      (e.key === "Enter" || e.key === " ") && toggleAccordion()}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-expanded={isOpen}
    aria-disabled={disabled}
  >
    <!-- Left side: Title and metadata slot -->
    <div class="flex items-center">
      <div class="flex flex-col gap-2">
        <h3 class="text-sm text-darkGray leading-tight sm:text-sm font-medium">
          {title}
        </h3>
        <div>
          <slot name="metadata" />
        </div>
      </div>
    </div>

    <!-- Right side: Actions and expand icon -->
    <div class="flex items-center gap-2">
      {#if showActions && actions.length > 0}
        <div class="flex gap-3 items-center">
          {#each actions as action}
            <button
              type="button"
              class="{action.color ||
                'text-accent'} hover:opacity-80 cursor-pointer {action.class ||
                ''}"
              on:click={(e) => handleAction(e, action)}
              aria-label="{action.handler} item"
              title={action.handler}
            >
              <svelte:component this={action.icon} size={16} />
            </button>
          {/each}
        </div>
      {/if}

      <!-- Expand/Collapse Icon -->
      <div
        class="flex items-center justify-center transition-transform duration-300 text-gray-500 {isOpen
          ? 'rotate-180'
          : ''}"
      >
        <ChevronUp size={16} />
      </div>
    </div>
  </div>

  <!-- Expandable Content -->
  {#if isOpen}
    <div class="p-2 bg-gray-50 animate-slide-down md:p-4 sm:p-3 {contentClass}">
      <slot />
    </div>
  {/if}
</div>
{/if}

<style>
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-down {
    animation: slide-down 0.3s ease;
  }
</style>
