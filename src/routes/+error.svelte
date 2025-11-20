<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { authStore } from '/src/lib/stores/authStore.js'
	import { onMount } from 'svelte';

	let isNotFound = $page?.status === 404;
	let errorTitle = isNotFound ? "Page Not Found" : "Unexpected Error Occured";

	onMount(() => {
		if (browser) {
			authStore?.set($page.data?.session);
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900">
        {$page.status}: {$page.error?.message || 'Something went wrong'}
      </h1>
      <p class="mt-2 text-gray-600">
        {#if $page.status === 404}
          The page you're looking for couldn't be found.
        {:else}
          An unexpected error occurred. Please try again later.
        {/if}
      </p>
      <a
        href="/home"
        class="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Go Home
      </a>
    </div>
  </div>
</div>