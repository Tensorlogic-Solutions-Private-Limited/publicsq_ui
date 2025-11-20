<script>
  export let icon;
  export let label;
  export let value;
</script>

<div class="flex items-start gap-3">
  <svelte:component this={icon} class="w-5 h-5 text-gray-400 mt-0.5" />
  <div>
    <p class="text-sm font-medium text-gray-500">{label}</p>
    <p class="text-sm text-dark-gray">{value || "-"}</p>
  </div>
</div>