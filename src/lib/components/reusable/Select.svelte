<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
    export let options = [];
    export let display_func = a => a;
    export let value_func = a => a;
    export let value;

    function handleSelection(e){
    dispatch('change', +e.target.value)
    }
    
  </script>
  
  <select bind:value={value} on:change={handleSelection} class="px-6 py-2 bg-gray-100 rounded border border-gray-200">
    {#each options as option, i}
      <option value={value_func(option)}>{display_func(option) }</option>
    {/each}
  </select>