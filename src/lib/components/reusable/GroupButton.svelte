<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let buttons = []; // Array of button objects
  export let activeButton = ''; // Currently active button value
  export let size = 'md'; // sm, md, lg
  export let variant = 'primary'; // primary, secondary
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  // Variant classes
  const variantClasses = {
    primary: {
      base: 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50',
      active: 'bg-blue-50 text-blue-600 border-blue-300'
    },
    secondary: {
      base: 'text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200',
      active: 'bg-slate-700 text-white border-slate-700'
    }
  };
  
  function handleButtonClick(button) {
    dispatch('buttonClick', {
      value: button.value,
      button: button
    });
  }
  
  function getButtonClasses(button, index, isLast) {
    const baseClasses = 'font-medium border focus:z-10 focus:ring-2 focus:ring-blue-600 focus:text-blue-600 flex items-center gap-1 transition-all duration-200';
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    
    // Border radius classes
    let borderClasses = '';
    if (buttons.length === 1) {
      borderClasses = 'rounded-md';
    } else if (index === 0) {
      borderClasses = 'rounded-l-md border-r-0';
    } else if (isLast) {
      borderClasses = 'rounded-r-md';
    } else {
      borderClasses = 'border-r-0';
    }
    
    // Active/inactive classes
    const isActive = activeButton === button.value;
    const stateClasses = isActive 
      ? variantClasses[variant].active 
      : variantClasses[variant].base;
    
    return `${baseClasses} ${sizeClass} ${borderClasses} ${stateClasses}`;
  }
</script>

<div class="  inline-flex shadow-sm" role="group">
  {#each buttons as button, index}
    <button
      type="button"
      class="px-8 py-2 text-sm font-medium border flex items-center gap-2
        {activeButton === button.value ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
        {index === 0 ? 'rounded-l-md' : ''}
        {index === buttons.length - 1 ? 'rounded-r-md' : ''}
        {index !== 0 && index !== buttons.length - 1 ? '' : ''}"
      on:click={() => handleButtonClick(button)}
      title={button.title}
    >
      {#if button.icon}
        <svelte:component this={button.icon} class="w-5 h-5 mr-1" />
      {/if}
      {button.text}
    </button>
  {/each}
</div>