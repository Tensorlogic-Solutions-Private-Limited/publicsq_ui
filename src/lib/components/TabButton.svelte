<script>
  export let active = false;
  export let label = '';
  export let position = 'left' // or 'right'
</script>

<button 
  class="px-4 py-2 text-sm {position === 'left' ? 'rounded-l-lg' : 'rounded-r-lg border-l'} 
  {active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}"
  on:click
>
  {label}
</button>