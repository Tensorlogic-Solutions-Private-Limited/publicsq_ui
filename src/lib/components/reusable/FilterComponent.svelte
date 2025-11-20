<script>
  import { createEventDispatcher, onMount, afterUpdate } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import DateRangePicker from "$lib/components/reusable/DateRangePicker.svelte";
  export let filterOptions = [
    // {
    //   filterName: "Status",
    //   filterValue: [
    //     { id: "1", name: "Draft", value: "draft" },
    //     { id: "2", name: "Closed", value: "closed" },
    //   ],
    //   default: { id: "1", name: "Draft", value: "draft" },
    // },
    //...other filters
  ];
  export let btnType = "";
  export let filterDependencies = {}; // Format: { 'Dependantdata': 'Dependency' } eg: { 'Playlist': 'Channel' }, here playlist is dependant on channel
  export function clearFilterFromParent() {
    tempSelectedFilters = {};
    selectedFilters = {};

    // Reset all dropdowns
    filterOptions.forEach((option) => {
      const dropdown = document.getElementById(option.filterName);
      if (dropdown) {
        dropdown.value = "";
      }
    });
  }

  // handler for date selection 
function handleDateSelection(event, category) {
  const { startDate, endDate, formattedStartDate, formattedEndDate } = event.detail;
  if (startDate && endDate) {
    const dateValue = {
      id: `${startDate}_${endDate}`, // Store both dates in id
      name: `${formattedStartDate} - ${formattedEndDate}`, // Display format
      startDate,
      endDate
    };
    
    // If same date range is selected again then remove
    if (
      tempSelectedFilters[category] &&
      tempSelectedFilters[category].id === dateValue.id
    ) {
      delete tempSelectedFilters[category];
    } else {
      tempSelectedFilters[category] = dateValue;
    }

    dispatch("filterChanged", {
      category,
      selectedItem: dateValue,
      tempSelectedFilters: { ...tempSelectedFilters },
    });

    tempSelectedFilters = { ...tempSelectedFilters };
  }
}


  const dispatch = createEventDispatcher();
  let filterButton;
  let filterBox;
  let boxPosition = { right: "auto", left: 0 };
  let componentNode;
  let isExpanded = false;
  let isLoading = false;
  let selectedFilters = {};
  let tempSelectedFilters = {}; // temporary storage for filters before applying

  function toggleExpand() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      tempSelectedFilters = { ...selectedFilters };
    }
  }

  function updateFilter(category, value, id) {
    const selectedItem = filterOptions
      ?.find((option) => option.filterName === category)
      ?.filterValue.find((item) => item.id === id);

    if (selectedItem) {
      // If same item is selected again then remove (right now, we dont have deselect functionality)
      if (
        tempSelectedFilters[category] &&
        tempSelectedFilters[category].id === id
      ) {
        delete tempSelectedFilters[category];

        // Clear dependent filters if parent removed
        clearDependentFilters(category);
      } else {
        // if category already had a different value, clear dependents first
        if (
          tempSelectedFilters[category] &&
          tempSelectedFilters[category].id !== id
        ) {
          clearDependentFilters(category);
        }

        // Add new selection
        tempSelectedFilters[category] = selectedItem;
      }

      dispatch("filterChanged", {
        category,
        selectedItem,
        tempSelectedFilters: { ...tempSelectedFilters },
      });

      tempSelectedFilters = { ...tempSelectedFilters };
    }
  }
 

  // Handler for SearchableComboBox selection
  function handleComboBoxSelection(event, category) {
    const { selectedItemId, selectedItemName, ...data } = event.detail;
    if (selectedItemId && selectedItemName) {
      updateFilter(category, selectedItemName, selectedItemId);
    }
  }

  // helper to clear dependent filters
  function clearDependentFilters(category) {
    const dependentFilters = findAllDependentFilters(category);

    dependentFilters.forEach((dependentFilter) => {
      delete tempSelectedFilters[dependentFilter];

      // Reset dropdown UI
      const dropdown = document.getElementById(dependentFilter);
      if (dropdown) dropdown.value = "";
    });
  }

  function clearFilter(event, category) {
    event.stopPropagation();

    // Find all dependent filters (direct and indirect)
    const allDependentFilters = findAllDependentFilters(category);

    // Clear the category and all its dependent filters from both current and temp filters
    delete tempSelectedFilters[category];

    // Clear all dependent filters
    allDependentFilters.forEach((dependentFilter) => {
      delete tempSelectedFilters[dependentFilter];

      // Reset the dropdown for dependent filters
      const dropdown = document.getElementById(dependentFilter);
      if (dropdown) {
        dropdown.value = "";
      }
    });

    tempSelectedFilters = { ...tempSelectedFilters };

    // Reset the dropdown for the current category
    const dropdown = document.getElementById(category);
    if (dropdown) {
      dropdown.value = "";
    }

    // Notify about filter change for UI updates only
    dispatch("filterChanged", {
      category,
      selectedItem: null,
      tempSelectedFilters: { ...tempSelectedFilters },
    });
  }

  function findAllDependentFilters(parentCategory) {
    // Initialize array for dependent filters
    let dependentFilters = [];

    // Find all filters that directly depend on the parent category
    for (const [dependent, parent] of Object.entries(filterDependencies)) {
      if (parent === parentCategory) {
        // Add this dependent filter
        dependentFilters.push(dependent);

        // Also check for any filters that depend on this one
        for (const [nestedDependent, nestedParent] of Object.entries(
          filterDependencies
        )) {
          if (nestedParent === dependent) {
            dependentFilters.push(nestedDependent);
          }
        }
      }
    }

    return dependentFilters;
  }
  function clearAllFilters() {
    tempSelectedFilters = {};

    // Reset all dropdowns
    filterOptions.forEach((option) => {
      const dropdown = document.getElementById(option.filterName);
      if (dropdown) {
        dropdown.value = "";
      }
    });

    // Dispatch allFiltersCleared event to notify parent component
    // This will trigger the removal of dependent filter options
    dispatch("allFiltersCleared");

    // Also dispatch filterChanged for UI updates
    dispatch("filterChanged", {
      category: "all",
      selectedItem: null,
      tempSelectedFilters: {},
    });
  }

  function applyFilters() {
    // Update the actual selected filters with the temporary ones
    selectedFilters = { ...tempSelectedFilters };
    
    // Dispatch the filter applied event with the final selection
    dispatch("filterApplied", { selectedFilters });

    // Close the filter dropdown
    toggleExpand();
  }

  function positionFilterBox() {
    if (!filterButton || !filterBox) return;

    const buttonRect = filterButton?.getBoundingClientRect();
    const boxRect = filterBox?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (buttonRect.left + boxRect.width > viewportWidth) {
      boxPosition = { right: 0, left: "auto" };
    } else {
      boxPosition = { right: "auto", left: 0 };
    }
  }

  function handleOutsideClick(event) {
    if (componentNode && !componentNode.contains(event.target) && isExpanded) {
      // Reset temp filters when closing without applying
      tempSelectedFilters = { ...selectedFilters };
       isExpanded = false;
    }
  }

  // Check if a filter should be visible based on dependencies
  function shouldShowFilter(filterName) {
    // If this filter depends on another filter
    if (filterDependencies[filterName]) {
      const parentFilter = filterDependencies[filterName];
      // Only show if the parent filter is selected in the temp filters
      return !!tempSelectedFilters[parentFilter];
    }
    // If no dependencies, always show
    return true;
  }

  onMount(() => {
    window.addEventListener("resize", positionFilterBox);
    document.addEventListener("click", handleOutsideClick);
    // Initialize temp filters with current selection
    tempSelectedFilters = { ...selectedFilters };

    // Set default filters
    filterOptions.forEach((option) => {
      if (option.default) {
        selectedFilters[option.filterName] = option.default;
        tempSelectedFilters[option.filterName] = option.default;
        // Optionally, set the dropdown value in the DOM if needed
        // setTimeout(() => {
        //   const dropdown = document.getElementById(option.filterName);
        //   if (dropdown) dropdown.value = option.default.name;
        // }, 0);
      }
    });

    return () => {
      window.removeEventListener("resize", positionFilterBox);
      document.removeEventListener("click", handleOutsideClick);
    };
  });

  afterUpdate(() => {
    if (isExpanded) {
      positionFilterBox();
    }
  });

  $: if (isExpanded) {
    setTimeout(positionFilterBox, 0);
  }
</script>

<div class="relative inline-block" bind:this={componentNode}>
  <Button bind:btnRef={filterButton} on:click={toggleExpand} {btnType}>
    <slot name="btnContent"></slot>
  </Button>

  {#if isExpanded}
    {#if filterOptions && filterOptions?.length > 0}
      <div
        bind:this={filterBox}
        class="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-20"
        style="right: {boxPosition.right}; left: {boxPosition.left};"
      >
        {#if Object.keys(tempSelectedFilters).length > 0}
          <div class="mb-4 flex flex-wrap gap-2">
            {#each Object.entries(tempSelectedFilters) as [category, value]}
              <div
                class="flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm"
              >
                <span>{category}: {value.name}</span>
                <button
                  on:click={(event) => clearFilter(event, category)}
                  class="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-x"
                    ><line x1="18" y1="6" x2="6" y2="18"></line><line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18"
                    ></line></svg
                  >
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#each filterOptions as filterOption}
          {#if shouldShowFilter(filterOption.filterName)}
            <div class="mb-4">
              {#if filterOption.filterType === 'date-range'}
                 <DateRangePicker
                  label={filterOption.filterName}
                  startDate={tempSelectedFilters[filterOption.filterName]?.startDate || ''}
                  endDate={tempSelectedFilters[filterOption.filterName]?.endDate || ''}
                  min={filterOption.min}
                  max={filterOption.max}
                  on:dateChange={(event) => handleDateSelection(event, filterOption.filterName)}
                />
              {:else}
                <SearchableComboBox
                  options={filterOption.filterValue || []}
                  preventEventPropagation
                  filterCategory={filterOption.filterName}
                  label={filterOption.filterName}
                  placeholder="Select {filterOption.filterName}"
                  selectedItemId={tempSelectedFilters[filterOption.filterName]?.id || ""}
                  selectedItemName={tempSelectedFilters[filterOption.filterName]?.name || ""}
                  on:handleDispatchComboBoxData={(event) =>
                    handleComboBoxSelection(event, filterOption.filterName)}
                />
              {/if}
            </div>
          {/if}
        {/each}

        <div class="flex justify-between items-center mt-4">
          <button
            on:click={clearAllFilters}
            class="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear All
          </button>
          <Button on:click={applyFilters} disabled={isLoading}>
            {#if isLoading}
              <svg
                class="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            {:else}
              Apply
            {/if}
          </Button>
        </div>
      </div>
    {:else}
      <div
        bind:this={filterBox}
        class="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-20"
        style="right: {boxPosition.right}; left: {boxPosition.left};"
      >
        <div class="text-sm text-gray-500 italic text-center">
          No filters available
        </div>
      </div>
    {/if}
  {/if}
</div>
