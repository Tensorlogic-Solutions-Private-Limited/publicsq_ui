<script>
  export let label = '';
  export let options = []; // Can be [{ label, value }], [{ name, id, questionCount }], or just strings
  export let value = '';
  export let required = false;
  export let disabled = false;
  export let placeholder = 'Select...';
  export let showQuestionCount = false;
  export let onChange = () => {};

  // Get text to display in the <option>
  function getDisplayText(option) {
    if (typeof option === 'string') return option;

    if (showQuestionCount && option.questionCount !== undefined) {
      return `${option.label || option.name} (${option.questionCount} questions)`;
    }

    return option.label || option.name || '';
  }

  // Get the actual value for the option
  function getValue(option) {
    if (typeof option === 'string') return option;
    return option.value || option.id?.toString() || '';
  }
</script>

<div class="mb-4">
  {#if label}
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <select
    bind:value
    {disabled}
    on:change={onChange}
    class="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 
           rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 
           disabled:bg-gray-100 disabled:text-gray-500"
  >
    <option value="" disabled selected>{placeholder}</option>

    {#each options as option}
      <option value={getValue(option)} class="text-gray-900">
        {getDisplayText(option)}
      </option>
    {/each}
  </select>
</div>
