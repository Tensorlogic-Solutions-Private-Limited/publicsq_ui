<script>
  export let checked = false;
  export let disabled = false;
  export let ariaLabel = "Toggle";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export function toggle() {
    if (!disabled) {
      dispatch("change", { checked: !checked });
    }
  }
</script>

<button
  type="button"
  class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  class:bg-blue-500={checked}
  class:bg-gray-300={!checked}
  aria-pressed={checked}
  aria-label={ariaLabel}
  on:click={toggle}
  {disabled}
>
  <span
    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
    class:translate-x-5={checked}
    class:translate-x-1={!checked}
  ></span>
</button>

<style>
  /* For smooth transition of the knob */
  button > span {
    will-change: transform;
  }
</style>
