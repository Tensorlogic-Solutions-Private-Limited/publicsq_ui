<script>
	import { createEventDispatcher } from 'svelte';
	import { error } from '@sveltejs/kit';
	import Select from '$lib/components/reusable/Select.svelte';
	import GoogleMatrialIcon from '$lib/components/reusable/GoogleMatrialIcon.svelte';
	import ErrorMessage from '$lib/components/reusable/ErrorMessage.svelte';


	export let showPagination = true;
	export let tableStyle = 'primary';
	export let notFoundMessage;
	export let searchParameter = null;
	export let customRenderers = {};

	export let serverSidePagination = false;
	export let apiCurrentPage = 1;
	export let apiTotalItems = 0;
	export let apiPageSize = 10;
	export let headerColour = 'bg-gray-100'

	//------------ Datatable Component Usage---------------------------
	// The datatable component handles searching, sorting and pagination
	// tableHeaderDisplay property is a necessary property
	// To customize the header names user can pass the tableHeaderDisplay property in the following format
	// {key: name_of_header_in_data, name: custom_header_name}
	// The data need not be trimmed before passing as only fields that are specidied in the tableHeaderDisplay will be rendered
	// Sorting takes into account the type of data hence string data and integer data are sorted seperately
	// SortAccordingTo state can also be taken as a prop and bindied so that the sorting state is preserved when we reload the datatable

	//------------- WARNING! -----------------------
	// If a numerical data comming in string format, example "1" instead of 1, the user (of this component) will need to first parse them
	// into integer format and then pass the data to the datatable component if they want correct sorting behaviour

	// passed mapping of custom header name and its key
	// [{key: name_of_header_in_data, name: custom_header_name}]
	// The key property should be string that is the key in the actual data
	export let tableHeadersDisplay;

	// ----------------Highlighting a cell---------------
	//dataToHighlight is a configuration object that needs to be passed to let the component
	//if dataToHighlight.enabled is true, highlghting is activated
	//uniqueproperty and its value is to know which property to match and its value
	//this way, the table can programmatically highlight a cell when this prop is passed
	//for eg: to highlight a cell where stateName='abcd',dataToHighlight.uniqueProperty ="stateName" and dataToHighlight.value ="abcd"
	export let dataToHighlight = {
		uniqueProperty: 'id',
		value: '',
		enabled: false
	};

	export let highlightColor = '#fb923c';

	// This is the action config object to define how the action tab of the datatable should look
	// actionName: it is the name of the action that will be passed to the screen reader
	// actionIconName: Google Material Icon name which should be displayed for the action
	export let actionConfigObject = [
		// {
		// 	actionName: 'dummy action',
		// 	actionIconName: ''
		// }
	];
	


	$: tableHeadersDisplay = calculateWidths(tableHeadersDisplay);

	function calculateWidths(elements) {
		//this function divides the table columns based on the user specified widths
		//width is passed through tableHeadersDisplay
		//NOTE: If no width is specified, all columns will be of equal width
		let totalSpecifiedWidth = 0;
		let unsetCount = 0;

		// Calculate the total specified width and count columns without specified widths
		for (const element of elements) {
			if (element.width) {
				totalSpecifiedWidth += parseFloat(element.width);
			} else {
				unsetCount++;
			}
		}

		// Case 1: Specified widths exceed 100%
		if (totalSpecifiedWidth > 100) {
			// Scale down each specified width proportionally
			const scalingFactor = 100 / totalSpecifiedWidth;
			elements = elements?.map((element) => ({
				...element,
				width: element.width ? `${parseFloat(element.width) * scalingFactor}%` : null
			}));
		} else {
			// Case 2: Specified widths are less than or equal to 100%
			const remainingWidth = 100 - totalSpecifiedWidth;

			const equalWidth = remainingWidth / unsetCount;
			// Assign equal width to columns without specified widths
			elements = elements.map((element) => ({
				...element,
				width: element.width ? `${element.width}` : `${equalWidth}%`
			}));
		}

		return elements;
	}

	// When an action is clicked in the action tab an event is dispatched to the parent component
	// the event contains the name of the action that was clicked and the data associated with that row
	const dispatch = createEventDispatcher();
	function handleActionDispatch(actionName, actionData, viewModal) {

		tableDataRender = tableDataRender?.map((data) => ({ ...data, highlighted: false }));
		if (dataToHighlight.enabled) {
			const clickedValue = actionData[dataToHighlight.uniqueProperty] || '';
			dataToHighlight = { ...dataToHighlight, value: clickedValue };
		}

		dispatch('tableActionClick', { actionName, actionData, viewModal });
	}

	// throw an error if its missing
	if (!tableHeadersDisplay) {
		error(404, {
			message: "Missing necessary property 'tableHeaderDisplay' in datatable component"
		});
	}

	// main data for the table
	export let tableData = [
		{
			name: 'dummyname',
			email: 'dummyemail',
			phone: 'dummyphone'
		}
	];

	export let entriesPerPage = 10;
	export let searchValue = '';
	export let rowHeight = 'normal';

	let tableDataRender = [];

	// -------Extracting Headers for table from the keys of the first element in the array---------------
	// let tableHeaders = Object.keys(tableData[0]);

	// ------------- Search Function -------------
	// searchParameter expects data as an array of string, if the strings are invalid the search is done on the first two columns. If anyone of the string in invalid then search based on the first two columns. If anyone of the string in invalid then search based on the remaining valid strings
	function updateTableDataRender(searchValue) {
		// NEW: Skip local filtering for server-side pagination
		if (serverSidePagination) {
			tableDataRender = [...tableData];
			return;
		}

		const sanitizedSearchValue = searchValue?.toLocaleLowerCase().trim();
		if (!sanitizedSearchValue) {
			tableDataRender = [...tableData];
			currentPage = 1;
			return;
		}

		tableDataRender = tableData?.filter((object) => {
			// First check if we should use specific search parameters
			if (searchParameter && Array.isArray(searchParameter)) {
				// Filter out invalid parameters
				const validParameters = searchParameter?.filter((param) =>
					tableHeadersDisplay?.some(
						(header) => header.key?.toLowerCase().trim() === param?.toLowerCase().trim()
					)
				);

				if (validParameters.length > 0) {
					// Search based on each valid parameter
					return validParameters?.some((param) => {
						// Check if there's a custom renderer for this parameter
						if (customRenderers && customRenderers[param]) {
							// Get the rendered HTML content
							const renderedContent = customRenderers[param](object);
							// Create a temporary div to parse the HTML and extract text
							const tempDiv = document.createElement('div');
							tempDiv.innerHTML = renderedContent;
							const textContent = tempDiv.textContent || tempDiv.innerText || '';
							// Search in the text content
							return textContent?.toLowerCase().includes(sanitizedSearchValue);
						} else {
							// Regular search in the raw data
							const fieldValue = object[param]?.toString()?.toLocaleLowerCase() || '';
							return fieldValue?.includes(sanitizedSearchValue);
						}
					});
				}
			}

			// Fallback to searching in all displayed columns
			return tableHeadersDisplay?.some(header => {
				const key = header.key;
				// Check if there's a custom renderer for this column
				if (customRenderers && customRenderers[key]) {
					// Get the rendered HTML content
					const renderedContent = customRenderers[key](object);
					// Create a temporary div to parse the HTML and extract text
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = renderedContent;
					const textContent = tempDiv.textContent || tempDiv.innerText || '';
					// Search in the text content
					return textContent?.toLowerCase().includes(sanitizedSearchValue);
				} else {
					// Regular search in the raw data
					const fieldValue = object[key]?.toString()?.toLocaleLowerCase() || '';
					return fieldValue?.includes(sanitizedSearchValue);
				}
			});
		});

		currentPage = 1;
	}

	// updates the content of the table each time the search value changes
	// NOTE: We also pass the tableData so that the rendered table gets updated when filters are applied
	$: updateTableDataRender(searchValue, tableData);

	// ---------------Sorting ------------------
	// the sortAccordingTo object is taken as a prop so as to preserve sorting when table data is null
	export let sortAccordingTo = {
		header: null,
		entityType: null,
		sortingOrder: null
	};


	function handleCreateSortAccordingToObject(headerData) {
		if(serverSidePagination) {
			return;
		}
		// determine sorting order
		// We have 3 states for ordering
		// Default is the API response order other two are ascending and descending
		// once the sorting order is clicked it is set to ascending and when clicked again it is set to descending
		let sortingOrder = '';
		const headerKey = headerData?.key;

		//the data shown in UI may not be sortable.  Eg. date strings
		//sortkey is the key based on which sorting will be done.
		//If not provided, it defaults to the header key name
		const sortKey = headerData.sortKey ? headerData.sortKey : headerData.key;
		// this block check if we are sorting the same element that we previously sorted
		if (sortAccordingTo.header === headerKey) {
			// this block cycles through the sorting orders
			if (sortAccordingTo.sortingOrder === null) {
				sortingOrder = 'descending';
			} else if (sortAccordingTo.sortingOrder === 'ascending') {
				sortingOrder = 'descending';
			} else if (sortAccordingTo.sortingOrder == 'descending') {
				sortingOrder = 'ascending';
			} else {
				sortingOrder = null;
			}
		} else {
			sortingOrder = 'descending';
		}
		sortAccordingTo = {
			header: headerKey,
			entityType: typeof tableData[0][sortKey],
			sortingOrder: sortingOrder,
			sortKey: sortKey
		};
	}

	function handleSorting(sortAccordingTo) {
		// NEW: Skip local sorting for server-side pagination
		if (serverSidePagination) {
			return;
		}

		// if sorting order is null revert back to the defaut order of element
		if (sortAccordingTo.sortingOrder === null) {
			updateTableDataRender(searchValue);
		}
		// IMPORTANT NOTE on sorting order followed
		// for strings, ascending means -Z-A
		// for numbers, ascending means -low to high (1-9)
		// for dates, ascending means earliest to latest ( eg:Jan 2024 to Dec 2024)
		if (sortAccordingTo.entityType === 'string') {
			if (sortAccordingTo.sortingOrder == 'ascending') {
				tableDataRender = tableDataRender.sort((a, b) => {
					const entityA = a[sortAccordingTo.sortKey]?.toUpperCase() || ''; // ignore upper and lowercase
					const entityB = b[sortAccordingTo.sortKey]?.toUpperCase() || ''; // ignore upper and lowercase
					if (entityA < entityB) {
						return 1;
					}
					if (entityA > entityB) {
						return -1;
					}

					// names must be equal
					return 0;
				});
			}
			if (sortAccordingTo.sortingOrder == 'descending') {
				tableDataRender = tableDataRender.sort((a, b) => {
					const entityA = a[sortAccordingTo.sortKey]?.toUpperCase() || ''; // ignore upper and lowercase
					const entityB = b[sortAccordingTo.sortKey]?.toUpperCase() || ''; // ignore upper and lowercase
					if (entityA < entityB) {
						return -1;
					}
					if (entityA > entityB) {
						return 1;
					}

					// names must be equal
					return 0;
				});
			}
		}

		if (sortAccordingTo.entityType === 'number') {
			if (sortAccordingTo.sortingOrder == 'ascending') {
				tableDataRender = tableDataRender?.sort(
					(a, b) => a[sortAccordingTo.sortKey] - b[sortAccordingTo.sortKey]
				);
			}
			if (sortAccordingTo.sortingOrder == 'descending') {
				tableDataRender = tableDataRender?.sort(
					(a, b) => b[sortAccordingTo.sortKey] - a[sortAccordingTo.sortKey]
				);
			}
		}

		if (
			sortAccordingTo.entityType === 'object' &&
			tableData[0][sortAccordingTo.sortKey] instanceof Date
		) {
			if (sortAccordingTo.sortingOrder == 'ascending') {
				tableDataRender = tableDataRender?.sort(
					(a, b) => a[sortAccordingTo.sortKey] - b[sortAccordingTo.sortKey]
				);
			}
			if (sortAccordingTo.sortingOrder == 'descending') {
				tableDataRender = tableDataRender?.sort(
					(a, b) => b[sortAccordingTo.sortKey] - a[sortAccordingTo.sortKey]
				);
			}
		}
	}
	// NOTE: We also pass the tableData so that the rendered table gets resorted when filters are applied
	$: handleSorting(sortAccordingTo, tableData);

	// ------------------PAGINATION--------------------
	function calculateNumberOfPages(numberOfEntries, entriesPerPage) {
		// if the number of entries is divisible by the entries per page then the number of pages is the quotient
		if (numberOfEntries % entriesPerPage === 0) {
			const numberOfPages = numberOfEntries / entriesPerPage;
			return numberOfPages;
		}
		// if the number of entries is not divisible by the entries per page then the number of pages is the quotient + 1
		const numberOfPages = Math.floor(numberOfEntries / entriesPerPage);
		return numberOfPages + 1;
	}

	function getCurrentPageData(currentPage, entriesPerPage, numberOfEntries, tableDataRender) {
		const startingEntryIndex = currentPage * entriesPerPage - entriesPerPage;
		const endingEntryIndex = currentPage * entriesPerPage;

		if (endingEntryIndex > numberOfEntries) {
			return tableDataRender?.length ? tableDataRender?.slice(startingEntryIndex) : [];
		}

		return tableDataRender?.length
			? tableDataRender?.slice(startingEntryIndex, endingEntryIndex)
			: [];
	}

	function pageingationBarDisplayPages(currentPage, numberOfPages, sizeOfBar) {
		let change = numberOfPages - currentPage > sizeOfBar;
	}

	// NEW: Use server-side values when available
	let numberOfEntries = 0;
	$: numberOfEntries = serverSidePagination ? apiTotalItems : tableDataRender?.length;
	let numberOfPages = 0;
	$: numberOfPages = serverSidePagination 
		? calculateNumberOfPages(apiTotalItems, apiPageSize)
		: calculateNumberOfPages(tableDataRender?.length, entriesPerPage);

	let pageinationDisplayArray = [];
	$: pageinationDisplayArray = updatepageinationDisplayArray(numberOfPages);

	function updatepageinationDisplayArray(numberOfPages) {
		let pageinationDisplayArray = [];
		for (let i = 0; i < numberOfPages; i++) {
			pageinationDisplayArray?.push({ displayText: `${'Page'} ${i + 1}`, index: i + 1 });
		}
		return pageinationDisplayArray;
	}

	// NEW: Use API current page when in server-side mode
	let currentPage = 1;
	$: if (serverSidePagination) {
		currentPage = apiCurrentPage;
	}

	let currentPageData = [];
	$: currentPageData = serverSidePagination 
		? tableDataRender  // For server-side, data is already paginated
		: getCurrentPageData(currentPage, entriesPerPage, numberOfEntries, tableDataRender);

	// NEW: Calculate display values using server-side data when available
	let startingEntryIndex = 0;
	$: startingEntryIndex = serverSidePagination 
		? (apiCurrentPage - 1) * apiPageSize
		: (currentPage - 1) * entriesPerPage;

	let endingEntryIndex = 0;
	$: endingEntryIndex = serverSidePagination
		? Math.min(startingEntryIndex + currentPageData.length, apiTotalItems)
		: startingEntryIndex + currentPageData.length;

	// NEW: Modified pagination handlers to dispatch events for server-side pagination
	function handlePageIncrement(numberOfPages) {
		if (serverSidePagination) {
			if (apiCurrentPage < numberOfPages) {
				dispatch('pageChange', {
					page: apiCurrentPage + 1,
					pageSize: apiPageSize
				});
			}
		} else {
			if (currentPage < numberOfPages) {
				currentPage = currentPage + 1;
			}
		}
	}

	function handlePageDecrement() {
		if (serverSidePagination) {
			if (apiCurrentPage > 1) {
				dispatch('pageChange', {
					page: apiCurrentPage - 1,
					pageSize: apiPageSize
				});
			}
		} else {
			if (currentPage > 1) {
				currentPage = currentPage - 1;
			}
		}
	}

	// NEW: Handle page selection from dropdown
	function handlePageSelect() {
		console.log('in handle page selct')
		if (serverSidePagination) {
			dispatch('pageChange', {
				page: currentPage,
				pageSize: apiPageSize
			});
		}
		// For local pagination, the bind:value on Select already updates currentPage
	}

	// Function to highlight a particular item
	$: highlightData(dataToHighlight);
	function highlightData() {
		if (!dataToHighlight.enabled) return;
		let index = tableDataRender?.findIndex((data) => {
			const dataValue = data[dataToHighlight.uniqueProperty] || '';

			if (typeof dataValue === 'number' && dataToHighlight?.value === dataValue) {
				return true;
			}
			if (
				typeof dataValue === 'string' &&
				dataToHighlight?.value?.toLowerCase() === dataValue.toLowerCase()
			) {
				return true;
			}
		});

		if (index != -1) {
			tableDataRender = tableDataRender?.map((data, i) => {
				if (i === index) {
					return { ...data, highlighted: true };
				} else {
					return { ...data, highlighted: false };
				}
			});
			tableDataRender = tableDataRender;
		}

		return tableDataRender;
	}

	$: navigateToPage(dataToHighlight, entriesPerPage, numberOfEntries);
	function navigateToPage() {
		if (!dataToHighlight.enabled || serverSidePagination) return; // NEW: Skip for server-side pagination
		let pageNumber = calculateNumberOfPages(numberOfEntries, entriesPerPage);
		if (pageNumber <= 1) return;
		let index = tableDataRender?.findIndex((data) => {
			const dataValue = data[dataToHighlight.uniqueProperty] || '';

			if (typeof dataValue === 'number' && dataToHighlight?.value === dataValue) {
				return true;
			}
			if (
				typeof dataValue === 'string' &&
				dataToHighlight?.value?.toLowerCase() === dataValue.toLowerCase()
			) {
				return true;
			}
		});
		if (index != -1) {
			let itemNumber = index + 1;
			let currentPageNumber = Math.ceil(itemNumber / entriesPerPage);
			currentPageData = getCurrentPageData(
				currentPageNumber,
				entriesPerPage,
				numberOfEntries,
				tableDataRender
			);
			currentPage = currentPageNumber;
			startingEntryIndex = currentPage * entriesPerPage - entriesPerPage;
			endingEntryIndex = currentPage * entriesPerPage;
		}
	}

	// This function parses the value of from the data using the key
	// This function allows to extract data from nested objects
	function parseDataFromKey(data, key) {
		if (typeof key === 'string') {
			return data[key];
		}
		if (typeof key === 'object') {
			const lenght = key?.length;
			let temp_data = data;
			for (let i = 0; i < lenght; i++) {
				temp_data = temp_data[key[i]];
			}

			return temp_data;
		}
		return '-';
	}

	// -------------------------- Bulk selection functionality -------------------------
	export let bulkSelect = false;
	export let selectedRows = [];
	
	let allSelected = false;
	$: allSelected = tableDataRender?.length > 0 && selectedRows?.length === tableDataRender?.length;
	
	function toggleSelectAll() {
		if (allSelected) {
			selectedRows = [];
		} else {
			selectedRows = tableDataRender?.map(row => row.uuid);
		}
		dispatch('selectionChange', { selectedRows });
	}
	
	function toggleSelectRow(uuid) {
		if (selectedRows?.includes(uuid)) {
			selectedRows = selectedRows?.filter(rowId => rowId !== uuid);
		} else {
			selectedRows = [...selectedRows, uuid];
		}
		dispatch('selectionChange', { selectedRows });
	}

</script>

{#if currentPageData?.length>0}
<div class="flow-root border border-gray-50 rounded-lg ">
	<div class=" overflow-x-auto">
		<div class="inline-block min-w-full align-middle">
			<div class="overflow-hidden  rounded-lg">

				<table class="min-w-full divide-y divide-gray-300 table-fixed">
					<thead class={headerColour}>
						<tr>
							{#if bulkSelect}
							<th scope="col" class="table-header hover:bg-primary-hover w-10">
								<div class="px-4 flex items-center">
									<input
										type="checkbox"
										checked={allSelected}
										on:change={toggleSelectAll}
										class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
									/>
								</div>
							</th>
							{/if}
		
							{#if tableHeadersDisplay}
								{#each tableHeadersDisplay as header}
									<th scope="col" style={header.width ? `width:${header.width};` : 'width:100%;'}
									class=" table-header  {!serverSidePagination ? 'hover:bg-table-hover' : 'pointer-events-none'}">
										<button
											on:click={() => {
												handleCreateSortAccordingToObject(header);
											}}
											class="px-4 text-left text-sm font-medium text-gray-600 w-full flex items-center capitalize"
											class:py-2={rowHeight === 'compact'}
											class:py-3={rowHeight === 'normal'}
											class:py-4={rowHeight === 'medium'}
										>
											<span>
												{header.name}
											</span>
											<!-- {#if sortAccordingTo?.header !== null} -->
											{#if !serverSidePagination && typeof sortAccordingTo.header === 'string' && sortAccordingTo.header === header.key}
											{#if !serverSidePagination && sortAccordingTo.sortingOrder === 'descending'}
												<GoogleMatrialIcon iconName={'south'} addClass="text-sm text-gray-400" />
												<!-- {:else}
											Hello -->
											{/if}
											{#if !serverSidePagination && sortAccordingTo.sortingOrder === 'ascending'}
												<GoogleMatrialIcon iconName={'north'} addClass="text-sm text-gray-400" />
												<!-- {:else}
											hello -->
											{/if}
											{:else if !serverSidePagination}
											<GoogleMatrialIcon
												iconName={'sync_alt'}
												addClass="text-sm rotate-90 sort-icon text-gray-400"
											/>
											<!-- {/if} -->
											{/if}
										</button>
									</th>
								{/each}
							{/if}
							{#if actionConfigObject?.length > 0}
								<th
									scope="col"
									class="px-4 text-left text-sm font-medium  relative"
									class:py-2={rowHeight === 'compact'}
									class:py-3={rowHeight === 'normal'}
									class:py-4={rowHeight === 'medium'}
								>
									<span class="sr-only">Action</span>
								</th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white leading-5">
						{#if currentPageData}
							{#each currentPageData as data}
								<tr style="background-color: {data?.highlighted ? highlightColor : 'transparent'}">
									{#if bulkSelect}
									<td class="px-4 py-3 whitespace-nowrap">
										<input
											type="checkbox"
											checked={selectedRows?.includes(data.uuid)}
											on:change={() => toggleSelectRow(data.uuid)}
											class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
										/>
									</td>
									{/if}
									{#each tableHeadersDisplay as header, index}
										<td
											class="break-words whitespace-normal pl-4 pr-3 text-sm font-base text-darkGray"
											class:py-2={rowHeight === 'compact'}
											class:py-3={rowHeight === 'normal'}
											class:py-4={rowHeight === 'medium'}
										>
											{#if customRenderers[header.key]}
												{#key data}
													{#if typeof customRenderers[header.key](data) === 'object' && customRenderers[header.key](data)?.component}
														<svelte:component this={customRenderers[header.key](data).component} {...customRenderers[header.key](data).props} />
													{:else}
														{@html customRenderers[header.key](data)}
													{/if}
												{/key}
											{:else}
												{data[header?.key] || '-'}
											{/if}
										</td>
									{/each}
									{#if actionConfigObject?.length > 0}
										<td
											class="relative whitespace-nowrap px-4 text-sm font-medium"
											class:py-2={rowHeight === 'compact'}
											class:py-3={rowHeight === 'normal'}
											class:py-4={rowHeight === 'medium'}
										>
											<div class="flex gap-4 justify-center leading-3">
												{#each actionConfigObject as action}
													<button
														on:click={() =>
															handleActionDispatch(action?.actionName, data, action?.modal)}
														class="text-accent hover:text-indigo-900 relative"
														><div class="flex gap-0.5 items-start">
															{#if action?.goto}
																<a
																	href={action?.goto +
																		`?data=` +
																		encodeURIComponent(JSON.stringify(data))}
																	>
																	{#if action?.icon}
																		<svelte:component this={action.icon} {...action} data={data} size={16} />
																	{/if}
																</a>
																{:else}
																	{#if action?.icon}
																		<svelte:component this={action.icon} {...action} data={data} size={16}/>
																	{/if}
															{/if}
														</div>
														<span class="sr-only">{action?.actionName}</span></button
													>
												{/each}
											</div>
										</td>
									{/if}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
{#if showPagination}
	<div class="flex items-center justify-between mt-4 px-4 py-3 sm:px-6">
		<div class="flex flex-1 justify-between sm:hidden">
			<button
				on:click={() => handlePageDecrement()}
				class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>Previous</button
			>
			<button
				on:click={() => handlePageIncrement(numberOfPages)}
				class="relative ml-3 inline-flex items-center rounded-md border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>Next</button
			>
		</div>
		<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
			<div>
				<p class="text-sm text-gray-700">
					Showing
					<span class="font-medium">{startingEntryIndex + 1}</span>
					–
					<span class="font-medium">{endingEntryIndex}</span>
					of
					<span class="font-medium">{numberOfEntries}</span>
					items
				</p>
			</div>
			<div>
				<nav class="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
					<button
						on:click={() => handlePageDecrement()}
						class="relative inline-flex items-center rounded-l-md px-6 py-2 text-gray-700 hover:bg-gray-200 focus:z-20 min-w-24 justify-center gap-2"
					>
						<span class="sr-only">{'Previous'}</span>

						<svg
							class="h-5 w-5 fill-darkGray"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
								clip-rule="evenodd"
							/>
						</svg>
						<h1 class="text-sm flex items-center text-darkGray">{'Previous'}</h1>
					</button>
					<Select
						options={pageinationDisplayArray}
						display_func={(e) => e.displayText}
						value_func={(e) => e.index}
						bind:value={currentPage}
						on:change={handlePageSelect}
					/>

					<button
						on:click={() => handlePageIncrement(numberOfPages)}
						class="relative inline-flex items-center rounded-r-md px-6 py-2 text-gray-700 hover:bg-gray-200 focus:z-20 min-w-24 justify-center gap-2"
					>
						<span class="sr-only">{'Next'}</span>
						<h1 class="text-sm flex items-center text-darkGray">{'Next'}</h1>
						<svg
							class="h-5 w-5 fill-darkGray"
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
					</button>
				</nav>
			</div>
		</div>
	</div>
{/if}
{:else}
<ErrorMessage error={notFoundMessage}/>
{/if}