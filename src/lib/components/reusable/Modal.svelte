<script>
	export let isOpen = false;
	export let title = '';
	export let closeModal = () => {};

	function handleKeyDown(event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
		on:click={closeModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div
			class="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg min-h-[250px]"
			on:click|stopPropagation
			on:keydown={handleKeyDown}
		>
			<!-- Close Button -->
			<!-- <button
				class="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
				on:click={closeModal}
				aria-label="Close modal"
			>
				✖
			</button>

			<h2 id="modal-title" class="text-2xl font-bold">{title}</h2> -->
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">{title}</h2>
				<button on:click={closeModal} class="rounded-full p-1 hover:bg-gray-100" aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-6 w-6"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			<slot class="w-full h-full"></slot>
		</div>
	</div>
{/if}
