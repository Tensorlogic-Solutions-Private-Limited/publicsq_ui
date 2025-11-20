
<script>
  export let label;
  export let value;
</script>

{#if value}
  <div class="flex items-center gap-1">
    <span class="text-sm font-medium text-dark-gray">{label}</span>
    <span class="text-sm text-dark-gray">:</span>
    <span class="text-sm text-dark-gray">{value}</span>
  </div>
{/if}
