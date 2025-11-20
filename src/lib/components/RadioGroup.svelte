<script>
  export let options = [];
  export let selected = '';
</script>

<div class="flex gap-4">
  {#each options as option}
    <label class="inline-flex items-center">
      <input
        type="radio"
        class="form-radio"
        name="radio-group"
        value={option}
        bind:group={selected}
      />
      <span class="ml-2">{option}</span>
    </label>
  {/each}
</div>