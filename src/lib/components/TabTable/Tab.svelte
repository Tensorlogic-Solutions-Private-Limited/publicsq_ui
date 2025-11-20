<script>
  import { getContext, createEventDispatcher } from 'svelte';
  
  export let name;
  export let title;
  
  const tabs = getContext('tabs');
  let isActive = false;
    const dispatch = createEventDispatcher();
  
  tabs.active.subscribe(active => {
    isActive = (active === name);
  });
  
  function handleClick() {
    tabs.setActive(name);
     dispatch('click', name);
  }
</script>

<button
    type="button"
  class={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
    isActive 
      ? 'border-blue-500 text-blue-600 bg-white' 
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
  on:click|preventDefault={handleClick}
>
  {title}
</button>