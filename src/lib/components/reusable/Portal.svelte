<script>
	import { onMount, onDestroy } from 'svelte';

	let slotContainer;
	let container;

	onMount(() => {
		if (typeof window !== 'undefined' && slotContainer) {
			container = document.querySelector('#modal-root');
			if (container) {
				container.appendChild(slotContainer);
			}
		}
	});

	onDestroy(() => {
		if (container && slotContainer) {
			slotContainer.remove();
		}
	});
</script>

<div>
	<div bind:this={slotContainer} class="fixed inset-0 bg-overlay bg-opacity-75 transition-opacity z-[999] flex items-center justify-center">
			<slot />
	</div>
</div>

