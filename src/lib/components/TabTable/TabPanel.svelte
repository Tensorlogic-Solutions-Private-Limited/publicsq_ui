<script>
  import { getContext } from "svelte";
  
  export let name;
  
  const tabs = getContext('tabs');
  let isActive = false;
  
  tabs.active.subscribe(active => {
    isActive = (active === name);
  });
</script>

{#if isActive}
  <div class="mt-4">
    <slot></slot>
  </div>
{/if}