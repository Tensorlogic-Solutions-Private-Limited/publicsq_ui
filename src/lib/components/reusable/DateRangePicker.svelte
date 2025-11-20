<script>
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let startDate = '';
  export let endDate = '';
  export let placeholder = 'Select date range';
  export let min = '';
  export let max = '';
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let error = '';

  function handleDateChange(type, event) {
    const selectedDate = event.target.value;
    
    if (type === 'start' && endDate && new Date(selectedDate) > new Date(endDate)) {
      error = 'Start date cannot be after end date';
      return;
    }
    
    if (type === 'end' && startDate && new Date(selectedDate) < new Date(startDate)) {
      error = 'End date cannot be before start date';
      return;
    }

    error = '';

    if (type === 'start') {
      startDate = selectedDate;
    } else {
      endDate = selectedDate;
    }

    // Only dispatch if both dates are selected
    if (startDate && endDate) {
      dispatch('dateChange', {
        startDate,
        endDate,
        formattedStartDate: new Date(startDate).toLocaleDateString(),
        formattedEndDate: new Date(endDate).toLocaleDateString()
      });
    }
  }
</script>

<div class="flex flex-col space-y-2">
  {#if label}
    <label class="text-sm font-medium text-gray-700">{label}</label>
  {/if}
  
  <div class="flex flex-col  gap-2">
    <div class="flex-1">
      <input
        type="date"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
               disabled:bg-gray-100 disabled:cursor-not-allowed
               {error ? 'border-red-500' : ''}"
        value={startDate}
        {min}
        {max}
        required
        {disabled}
        placeholder="Start date"
        on:change={(e) => handleDateChange('start', e)}
      />
      <span class="text-xs text-gray-500">Start date*</span>
    </div>

    <div class="flex-1">
      <input
        type="date"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
               disabled:bg-gray-100 disabled:cursor-not-allowed
               {error ? 'border-red-500' : ''}"
        value={endDate}
        min={startDate || min}
        {max}
        required
        {disabled}
        placeholder="End date"
        on:change={(e) => handleDateChange('end', e)}
      />
      <span class="text-xs text-gray-500">End date*</span>
    </div>
  </div>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>