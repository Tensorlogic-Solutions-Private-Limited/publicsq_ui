<script>
	export let route = ''; // Current route
	export let params = {}; // Route parameters
	export let searchParams = ''; // Query parameters

	let breadCrumbsArr = [{ crumb: 'Home', path: '/home' }]; // Initialize with Home

	// Watch for changes to `route`, `params`, and `searchParams`, then update breadcrumbs
	$: createBreadCrumbArray(route, params, searchParams);

	function createBreadCrumbArray(route, params, searchParams) {
		// Reset breadcrumbs array
		breadCrumbsArr = [{ crumb: 'Home', path: '/home' }];

		// Remove leading slash and split route into segments
		let newRoute = route?.slice(1)?.split('/');
		let href = '';

		// Parse searchParams into an object for easy manipulation
		let queryParams = new URLSearchParams(searchParams);

		// Iterate over route segments
		newRoute?.forEach((segment, index) => {
			let crumb = '';

			if (segment?.startsWith('[')) {
				// Handle dynamic segments using `params`
				const paramKey = segment.slice(1, -1); // Remove brackets
				const paramValue = params[paramKey];
				if (paramValue) {
					href += `/${paramValue}`;
					// Skip adding this dynamic segment to UI
					return;
				}
			} else if (segment.startsWith('(') && segment.endsWith(')')) {
				// Skip route groups like (protected)
				// href += `/${segment}`;
				return;
			} else if (segment === 'home') {
				// Skip home segment since we already have Home in breadcrumbs
				// href += `/${segment}`;
				return;
			} else {
				// Handle static segments
				href += `/${segment}`;
				crumb = segment.replace(/([a-z])([A-Z])/g, '$1 $2'); // Format breadcrumb text
			}

			// Only add to breadcrumbs if crumb is defined
			if (crumb) {
				let fullPath = href;

				// Append query parameters to the current segment
				if (queryParams.toString()) {
					fullPath += `?${queryParams.toString()}`;
				}

				// Add the breadcrumb to the array
				breadCrumbsArr.push({ crumb, path: fullPath });
			}
		});
	}
</script>

<nav class="flex" aria-label="Breadcrumb">
	<ol role="list" class="flex items-center">
		{#if breadCrumbsArr?.length > 1}
			{#each breadCrumbsArr as breadCrumb, index}
				<li>
					<div class="flex items-end justify-center">
						<a
							href={breadCrumb?.path}
							class="text-xs lg:text-sm hover:text-gray-700 capitalize {index === breadCrumbsArr?.length - 1
								? 'text-darkGray font-medium'
								: 'text-gray-90'}"
						>
							{breadCrumb?.crumb}
						</a>
						{#if index !== breadCrumbsArr?.length - 1}
							<svg
								class="h-4 w-4 flex-shrink-0 text-gray-400"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</div>
				</li>
			{/each}
		{/if}
	</ol>
</nav>
