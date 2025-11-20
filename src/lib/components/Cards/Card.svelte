<script>
  export let title = '';
</script>

<div class="bg-white rounded-lg shadow-md p-12 mb-6">
  {#if title}
    <h2 class="text-xl font-semibold mb-4">{title}</h2>
  {/if}
  <slot />
</div>