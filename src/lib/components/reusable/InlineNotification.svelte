<script>
  import { createEventDispatcher, onMount } from 'svelte';

  // Props
  export let kind = 'info';
  export let darkTheme = false;
  export let timeout = 0;
  export let title = '';
  export let subtitle = '';
  export let hideCloseButton = false;
  // New action prop
  export let action = null; // { text: "Action Text", handler: () => {}, closeAfter: false }

  // Create event dispatcher
  const dispatch = createEventDispatcher();

  let visible = true;
  let timeoutId = null;
  let notificationElement;

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const getColorClasses = (kind, darkTheme) => {
     const schemes = {
      success: {
        normal: "bg-green-50 border-green-200 text-green-800",
        darkTheme: "bg-green-800 border-green-600 text-green-100",
        icon: "text-green-500",
        iconContrast: "text-green-200",
        button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      },
      error: {
        normal: "bg-red-50 border-red-200 text-red-800",
        darkTheme: "bg-red-800 border-red-600 text-red-100",
        icon: "text-red-500",
        iconContrast: "text-red-200",
        button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      },
      warning: {
        normal: "bg-yellow-50 border-yellow-200 text-yellow-800",
        darkTheme: "bg-yellow-700 border-yellow-500 text-yellow-50",
        icon: "text-yellow-500",
        iconContrast: "text-yellow-100",
        button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      },
      info: {
        normal: "bg-blue-50 border-blue-200 text-blue-800",
        darkTheme: "bg-blue-800 border-blue-600 text-blue-100",
        icon: "text-blue-500",
        iconContrast: "text-blue-200",
        button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      },
    };

    const scheme = schemes[kind] || schemes.info;
    return {
      container: darkTheme ? scheme.darkTheme : scheme.normal,
      icon: darkTheme ? scheme.iconContrast : scheme.icon,
      button: scheme.button
    };
  };

  let colorClasses;
  let containerClasses;

  $: colorClasses = getColorClasses(kind, darkTheme);
  $: containerClasses = `
    ${colorClasses.container}
    ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
  `.trim();

  const handleClose = () => {
    visible = false;
    clearTimeoutIfExists();
    
    // Use setTimeout to allow animation to complete before dispatching close event
    setTimeout(() => {
      dispatch('close');
    }, 200);
  };

  const clearTimeoutIfExists = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const startTimeout = () => {
    if (timeout > 0 && visible) {
      clearTimeoutIfExists();
      timeoutId = setTimeout(handleClose, timeout);
    }
  };

  const handleMouseEnter = (event) => {
    clearTimeoutIfExists();
    dispatch('mouseenter', event);
  };

  const handleMouseLeave = (event) => {
    startTimeout();
    dispatch('mouseleave', event);
  };

  const handleClick = (event) => {
    dispatch('click', event);
  };

  const handleMouseOver = (event) => {
    dispatch('mouseover', event);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(event);
    }
  };

  // New action handler
  const handleAction = () => {
    if (action && typeof action.handler === 'function') {
      action.handler();
    }
    dispatch('action');
    
    // Optionally close the notification after action
    if (action?.closeAfter) {
      handleClose();
    }
  };

  onMount(() => {
    // Start timeout on mount if needed
    startTimeout();

    // Clean up on component destruction
    return () => {
      clearTimeoutIfExists();
    };
  });
</script>

<div
  bind:this={notificationElement}
  class="relative w-full transform transition-all duration-200 ease-in-out rounded-md border shadow-sm {containerClasses}"
  class:pointer-events-none={!visible}
  role="alert"
  aria-live="polite"
  aria-atomic="true"
  on:click={handleClick}
  on:keydown={handleKeyDown}
  on:mouseover={handleMouseOver}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  tabindex="0"
>
  <div class="flex items-start justify-between gap-3 px-4 py-2">
    <!-- Left side: Icon and Content -->
    <div class="flex items-start gap-3 min-w-0 flex-1">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <span class="material-icons text-xl {colorClasses.icon}" aria-hidden="true">
          {icons[kind] || icons.info}
        </span>
      </div>
      
      <!-- Content -->
      <div class="flex flex gap-2 min-w-0 flex-1">
        <!-- Title -->
        <div class="flex flex-wrap items-center gap-2">
          {#if $$slots.title}
            <div class="font-medium text-sm">
              <slot name="title" />
            </div>
          {:else if title}
            <h4 class="font-medium text-sm">
              {title}
            </h4>
          {/if}
          
          <!-- Subtitle -->
          {#if $$slots.subtitle}
            <div class="text-xs opacity-80">
              <slot name="subtitle" />
            </div>
          {:else if subtitle}
            <p class="text-xs opacity-80">
              {subtitle}
            </p>
          {/if}
        </div>
        
        <!-- Actions slot or action button -->
        {#if $$slots.actions}
          <div class="mt-2 flex items-center gap-2">
            <slot name="actions" />
          </div>
        {:else if action && action.text}
          <div class="mt-2 flex items-center gap-2">
            <button 
              class="px-3 py-1 text-xs font-medium text-white rounded-md transition-colors duration-200 {colorClasses.button} focus:outline-none focus:ring-2 focus:ring-offset-2"
              on:click|stopPropagation={handleAction}
            >
              {action.text}
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Close Button -->
    {#if !hideCloseButton}
      <div class="flex-shrink-0">
        <button
          type="button"
          class="p-1 rounded-md  hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-200"
          on:click|stopPropagation={handleClose}
          aria-label="Close notification"
        >
          <span class="material-icons text-lg opacity-70 hover:opacity-100" aria-hidden="true">
            close
          </span>
        </button>
      </div>
    {/if}
  </div>
  
  <!-- Progress bar for timeout -->
  {#if timeout > 0 && visible}
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-md overflow-hidden">
      <div 
        class="h-full bg-current opacity-30 animate-shrink"
        style="animation-duration: {timeout}ms"
      ></div>
    </div>
  {/if}
  
  <!-- custom slot for additional content -->
  {#if $$slots.description}
    <div class="px-4 pb-4 pt-0">
      <slot name="description"/>
    </div>
  {/if}
</div>

<style>
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
  
  .animate-shrink {
    animation: shrink linear forwards;
  }
  
  /* Ensure smooth transitions */
  .transition-all {
    transition-property: all;
  }
</style>