<script>
	import { createEventDispatcher } from 'svelte';
	export let value = '';
	export let label = '';
	export let placeholder = '';
	export let name = '';
	export let required = false;
	export let type = '';
	export let readonly = false;
	export let labelFontWeight = 'font-medium';
	export let disabled = false;
	export let validationErrors = '';
	let dispatch = createEventDispatcher();

	function handleInputValue(e) {
		value = e.target.value;
		dispatch('handleInputData', { name, value });
	}
</script>

<div class="space-y-1">
	{#if label}
	<label for="input" class="block text-xs sm:text-sm {labelFontWeight} leading-6 text-dark-gray"
		>{label}{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}</label
	>
	{/if}
	<div class="relative">
		<input
			{type}
			{name}
			id=" "
			class="block w-full rounded-md border-0 py-2 px-3 sm:py-1.5 sm:px-2 text-darkGray shadow-sm ring-1 ring-inset disabled:bg-gray-100 disabled:cursor-not-allowed
			{validationErrors ? 'ring-red-500' : 'ring-gray-300'} 
			placeholder:text-gray-70 outline-none 
			focus:ring-2 focus:ring-inset 
			{validationErrors ? 'focus:ring-red-500' : 'focus:ring-blue-40'} 
			text-xs sm:text-sm sm:leading-6"
			{placeholder}
			on:input={handleInputValue}
			{value}
			{required}
			{readonly}
			{disabled}
			{...$$restProps}
			on:blur={() => dispatch('blur')}
		/>
		<!-- Slot for custom icons -->
		<div class="absolute inset-y-0 right-3 flex items-center h-full pointer-events-auto">
			<slot></slot>
		</div>
	</div>
	{#if validationErrors}
		<p class="text-xs text-red-500 font-normal whitespace-normal break-words">
			{validationErrors}
		</p>
	{/if}
</div>
