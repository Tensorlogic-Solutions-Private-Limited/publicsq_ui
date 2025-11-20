<script>
  import { createEventDispatcher } from "svelte";

  export let btnType = "primary"; // Default type
  export let customClass = ""; // User-provided styles
  export let type = "button"; // Default type for button
  export let btnRef; //Reference for button

  const dispatch = createEventDispatcher();

  function handleClick(e) {
    if (type !== "submit") {
      e.preventDefault();
    }
    e.stopPropagation();
    dispatch("click", e.detail);
  }

  // Define common styles and type-specific styles
  const commonStyles =
    "px-6 py-2  rounded-[4px] font-medium  capitalize sm:text-sm text-xs text-nowrap text-center flex items-center justify-center gap-1 disabled:bg-gray-500 hover:cursor-pointer disabled:cursor-not-allowed hover:bg-opacity-90";

  const typeStyles = {
    primary: `${commonStyles} text-white bg-accent `,
    secondary: `${commonStyles} bg-white border border-gray-200 text-accent font-semibold hover:bg-gray-10 disabled:text-white disabled:bg-gray-30`,
    tertiary: `${commonStyles} text-gray-600 bg-gray-50 border border-gray-300  hover:bg-gray-100`,
    danger: `${commonStyles} text-white bg-red-600`,
    dangerSecondary: `${commonStyles} text-red-700 bg-red-100 border border-red-300`,
    success: `${commonStyles} text-white bg-green `,
    successSecondary: `${commonStyles} bg-white border border-gray-200 text-green font-semibold hover:bg-gray-10 disabled:text-white disabled:bg-gray-30 `,
    custom: ``,
  };
</script>

<button
  bind:this={btnRef}
  class={`${btnType === "custom" ? `${customClass}` : typeStyles[btnType] || typeStyles["primary"]} ${customClass}`}
  on:click={handleClick}
  {type}
  {...$$restProps}
>
  <slot></slot>
</button>
