<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let options = [];
  export let value = null;
  export let display_func = (item) => item?.toString() || '';
  export let value_func = (item) => item?.toString() || '';
  export let placeholder = 'Select...';

  // Safely handle value changes
  function handleChange(event) {
    const selectedValue = event.target.value;
    if (selectedValue) {
      value = options.find(option => value_func(option) === selectedValue) || null;
    } else {
      value = null;
    }
    dispatch('change', { value });
  }
</script>

<select
  value={value ? value_func(value) : ''}
  on:change={handleChange}
  class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:ring-primary sm:text-sm"
>
  <option value="">{placeholder}</option>
  {#each options as option}
    <option value={value_func(option) || ''}>
      {display_func(option) || ''}
    </option>
  {/each}
</select>