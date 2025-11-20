<script>
  export let options = [];
  export let selected = options[0]?.value;
  export let name = 'radio-group';
</script>

<div class="flex gap-6">
  {#each options as option}
    <label class="inline-flex items-center">
      <input
        type="radio"
        {name}
        value={option.value}
        bind:group={selected}
        class="form-radio h-4 w-4 text-blue-600"
      />
      <span class="ml-2 text-gray-700">{option.label}</span>
    </label>
  {/each}
</div>