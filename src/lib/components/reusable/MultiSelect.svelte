<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";

  export let title = "";
  export let options = [];
  export let selectedValues = [];
  export let disabled = false;
  export let placeholder = "Select";
  export let error = "";
  export let description = "";
  export let required = false;

  let dispatch = createEventDispatcher();
  let showDropdown = false;
  let dropDownRef;
  let selectedOptions = [];

  // Initialize selected options from selectedValues
  $: {
    selectedOptions = options?.filter((opt) =>
      selectedValues?.map(String).includes(String(opt?.id))
    );
  }

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

  function handleOptionClick(option) {
    const index = selectedOptions.findIndex((opt) => opt.id === option.id);
    if (index === -1) {
      selectedOptions = [...selectedOptions, option];
    } else {
      selectedOptions = selectedOptions.filter((opt) => opt.id !== option.id);
    }

    // Update parent component
    dispatch("change", {
      selectedOptions,
      selectedValues: selectedOptions.map((opt) => opt.id),
    });
  }

  function handleRemoveOption(option) {
    selectedOptions = selectedOptions.filter((opt) => opt.id !== option.id);
    dispatch("change", {
      selectedOptions,
      selectedValues: selectedOptions.map((opt) => opt.id),
    });
  }

  function handleClearAll() {
    selectedOptions = [];
    showDropdown = false;
    dispatch("change", {
      selectedOptions,
      selectedValues: [],
    });
  }

  $: isSelected = (option) =>
    selectedOptions.some((opt) => opt.id === option.id);
</script>

<div>
  {#if title}
    <p
      class="block text-xs sm:text-sm font-medium text-darkGray capitalize leading-6 text-dark-gray"
    >
      {title}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </p>
  {/if}
  {#if description}
    <p class="text-xs text-gray-500 mb-1">{description}</p>
  {/if}
  <div
    class="relative inline-block text-left w-full"
    bind:this={dropDownRef}
  >
    <div class="w-full">
      <button
        type="button"
        class="flex justify-between items-center w-full bg-white rounded-md border-0 py-2 px-3 sm:py-1.5 sm:px-2 text-dark-gray shadow-sm outline-none ring-1 ring-inset placeholder:text-gray-70 focus:ring-2 focus:ring-inset focus:ring-blue-40 text-xs sm:text-sm sm:leading-6 capitalize placeholder:text-xs placeholder:sm:text-sm min-h-[38px]"
        class:ring-red-500={error}
        class:ring-gray-300={!error}
        id="multi-select-button"
        aria-expanded="true"
        aria-haspopup="true"
        {disabled}
        on:click={() => (showDropdown = !showDropdown)}
      >
        <div class="flex flex-wrap gap-1 flex-1">
          {#if selectedOptions.length === 0}
            <span class="text-gray-500">{placeholder}</span>
          {:else}
            {#each selectedOptions as option}
              <span
                class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
              >
                {option.name}
                <span
                  class="cursor-pointer hover:text-blue-600 inline-flex items-center"
                  role="button"
                  tabindex="0"
                  aria-label={`Remove ${option.name}`}
                  on:click|stopPropagation={() => {
                    handleRemoveOption(option);
                    showDropdown = false;
                  }}
                  on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleRemoveOption(option);
                      showDropdown = false;
                    }
                  }}
                >
                  <svg
                    class="w-3 h-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                    />
                  </svg>
                </span>
              </span>
            {/each}
          {/if}
        </div>
        <div class="ml-2 flex-shrink-0">
          {#if selectedOptions.length > 0}
            <span
              class="cursor-pointer text-gray-400 hover:text-gray-600 inline-flex items-center"
              role="button"
              tabindex="0"
              aria-label="Clear all selected items"
              on:click|stopPropagation={handleClearAll}
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClearAll();
              }}
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </span>
          {:else}
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
          {/if}
        </div>
      </button>
    </div>

    {#if error}
      <div class="relative mb-4 mt-1">
        <p class="text-xs text-red-600 absolute w-full right-0">
          {error}
        </p>
      </div>
    {/if}

    {#if showDropdown}
      <div
        class="absolute w-full right-0 z-50 mt-2 origin-top-right rounded-md bg-white shadow-md focus:outline-none max-h-52 overflow-y-auto border border-gray-200"
        role="listbox"
      >
        <div class="py-1">
          {#if options && options.length > 0}
            {#each options as option}
              <button
                type="button"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                role="option"
                aria-selected={isSelected(option)}
                on:click={() => handleOptionClick(option)}
              >
                {#if isSelected(option)}
                  <svg
                    class="w-4 h-4 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                {:else}
                  <span class="w-4"></span>
                {/if}
                {option.name}
              </button>
            {/each}
          {:else}
            <div class="px-4 py-2 text-sm text-gray-500 italic">
              No options available
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
