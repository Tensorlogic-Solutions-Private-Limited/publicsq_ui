<script>
	import { createEventDispatcher } from 'svelte';
	export let errorMessage;
	let close = false;
	let dispatch = createEventDispatcher();

	function handleClose() {
		close = true;
		dispatch('handleErrorMessageClose', close);
	}
</script>

{#if !close}
<div class="rounded-md bg-red-50 p-2">
	<div class="flex">
		<div class="ml-3">
			<p class="text-sm font-medium text-red-800">{errorMessage}</p>
			<slot></slot>
		</div>
		<div class="ml-auto pl-3">
			<div class="-mx-1.5 -my-1.5">
				<button
					type="button"
					class="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-green-50"
					on:click={handleClose}
				>
					<span class="sr-only">Dismiss</span>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>
{/if}