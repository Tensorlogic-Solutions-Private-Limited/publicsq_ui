<script>
	import { createEventDispatcher } from 'svelte';
	export let placeholder = 'Search by title or topic';
	export let debounceDelay = 500; // 500ms delay
	export let showSearchButton = true;

	let dispatch = createEventDispatcher();
	let searchBoxValue = '';
	let searchTimeout;

	// debounce function to prevent multiple calls to the function
	const debouncedHandleSearchValue = (searchBoxValue, delay) => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			dispatch('handleSearchValue', searchBoxValue);
		}, delay);
	};

	function handleSearchValue() {
		debouncedHandleSearchValue(searchBoxValue, debounceDelay);
	}

	// function handleSearchValue() {
	// 	despatch('handleSearchValue', searchBoxValue);
	// }
</script>

<div class=" rounded-lg w-full">
	<div class="relative flex gap-4">
		<input
			type="text"
			class=" rounded-md sm:rounded-lg shadow-sm px-10 py-1 flex-1 sm:py-2 border border-accent placeholder:text-sm leading-none"
			{placeholder}
			bind:value={searchBoxValue}
			on:input={handleSearchValue}
		/>
		<svg
			class="absolute top-2 left-3 stroke-accent"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M17.1428 17.1428L14.2856 14.2856"
				stroke-width="1"
				stroke-miterlimit="10"
				stroke-linecap="square"
			/>
			<path
				d="M8.57146 14.2857C11.7274 14.2857 14.2857 11.7274 14.2857 8.57146C14.2857 5.41555 11.7274 2.85718 8.57146 2.85718C5.41555 2.85718 2.85718 5.41555 2.85718 8.57146C2.85718 11.7274 5.41555 14.2857 8.57146 14.2857Z"
				stroke-width="1"
				stroke-miterlimit="10"
				stroke-linecap="square"
			/>
			<path
				d="M5.71436 8.5715C5.71436 7.81374 6.01537 7.08701 6.55119 6.55119C7.08701 6.01537 7.81374 5.71436 8.5715 5.71436"
				stroke-width="1"
				stroke-miterlimit="10"
			/>
		</svg>
		{#if showSearchButton}
			<button class="px-6 py-2 font-semibold text-white bg-primary rounded-[4px] text-sm">
				Search
			</button>
		{/if}
	</div>
</div>
