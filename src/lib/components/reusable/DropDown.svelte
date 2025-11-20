<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  export let validationErrors;
  export let selectedItemName = "";
  export let type = "";
  export let title = "";
  export let options;
  export let selectedItemUuid;
  export let disabled = false;
  export let required = false;
  export let placeholder = "Select";
  export let selectedItemId;
  export let loading = false;

  let dispatch = createEventDispatcher();
  let showDropdown = false;
  let dropDownRef;

  // Closes dropdown if clicked outside
  function handleClickOutside(event) {
    if (!dropDownRef?.contains(event.target)) {
      showDropdown = false;
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
    }
  });

  function handleListItemSelection(e) {
    e.preventDefault();
    const selectedElement = e.target.closest("a");
    if (!selectedElement) return;
    validationErrors = "";
    selectedItemId = selectedElement?.dataset?.id;
    const selectedOption = JSON.parse(selectedElement.dataset.option || "{}");
    let selectedItemTextContent = e.target.textContent;
    selectedItemName = selectedItemTextContent?.toLowerCase();
    selectedItemUuid = selectedElement?.dataset?.uuid;
    showDropdown = false;
    dispatch("handleDispatchFilterData", {
      selectedItemId,
      selectedItemName,
      type,
      selectedItemUuid,
      selectedOption,
    });
  }

  function handleClearSelection() {
    selectedItemId = "";
    selectedItemName = "";
    selectedItemUuid = "";
    showDropdown = false;
    dispatch("handleCancelSelection");
  }
</script>

<div>
  {#if title}
    <p
      class="block text-xs sm:text-sm font-medium text-darkGray capitalize leading-6 text-dark-gray"
    >
      {title}{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
    </p>
  {/if}
  <div class="relative inline-block text-left w-full">
    <div bind:this={dropDownRef}>
      <button
        type="button"
        class="flex justify-between items-center w-full bg-white rounded-md border-0 py-2 px-3 sm:py-1.5 sm:px-2 text-dark-gray shadow-sm outline-none ring-1 ring-inset placeholder:text-gray-70 focus:ring-2 focus:ring-inset focus:ring-blue-40 text-xs sm:text-sm sm:leading-6 capitalize placeholder:text-xs placeholder:sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        class:ring-red-500={validationErrors}
        class:ring-gray-300={!validationErrors}
        id="menu-button"
        aria-expanded="true"
        aria-haspopup="true"
        {disabled}
        on:focus={() => (showDropdown = true)}
      >
        {selectedItemName ? selectedItemName : placeholder}

        <!-- Right side icon area -->
        {#if loading}
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
            class:pb-3={validationErrors}
          >
            <LoadingSpinner size="small" color="blue" />
          </span>
        {:else if showDropdown === false}
          {#if validationErrors}
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 -top-3"
            >
              <svg
                class="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          {/if}
          {#if !validationErrors}
            <div class="">
              <svg
                class="-mr-1 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          {/if}
        {:else}
          <!-- Clear selection button -->
          <span
            role="button"
            tabindex="0"
            class="cursor-pointer"
            on:click|preventDefault={handleClearSelection}
            on:keydown={(e) => e.key === "Enter" && handleClearSelection()}
            aria-label="Clear selection"
          >
            <svg
              class="-mr-1 h-4 w-4 self-center"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </span>
        {/if}
      </button>
    </div>

    {#if validationErrors && !showDropdown}
      <div class="relative mb-4 mt-1">
        <p class=" text-xs text-red-600 absolute w-full right-0">
          {validationErrors}
        </p>
      </div>
    {/if}
    <div
      class="absolute w-full right-0 z-50 mt-2 origin-top-right rounded-md bg-white shadow-md focus:outline-none max-h-52 overflow-y-auto"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      {#if showDropdown}
        <div class="py-1" role="none" on:click={handleListItemSelection}>
          {#if loading}
            <div
              class="px-4 py-2 text-sm text-gray-500 italic pointer-events-none"
            >
              Loading...
            </div>
          {:else if options && options.length > 0}
            {#each options as option, index}
              <a
                data-id={index + 1}
                data-uuid={option?.id}
                data-option={JSON.stringify(option)}
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
                tabindex="-1"
                id="menu-item-0">{option?.name || option?.title}</a
              >
            {/each}
          {:else}
            <div
              class="px-4 py-2 text-sm text-gray-500 italic pointer-events-none"
            >
              No options available
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
