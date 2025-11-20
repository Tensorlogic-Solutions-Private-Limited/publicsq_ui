<script>
  import { FileText } from "@lucide/svelte";

  export let title = "No items yet";
  export let description = "";
  export let icon = FileText;
  export let iconSize = 36;
</script>

<div
  class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg w-full flex flex-col items-center"
>
  <svelte:component
    this={icon}
    size={iconSize}
    class="mx-auto text-gray-400 mb-4"
  />
  <p class="text-gray-500 text-base mb-2">{title}</p>
  {#if description}
    <p class="text-gray-400 text-sm mb-4">
      {description}
    </p>
  {/if}
  <slot />
</div>
