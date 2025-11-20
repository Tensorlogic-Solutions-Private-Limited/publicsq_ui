<script>
  import { browser } from "$app/environment";
  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  export let options = [];
  export let filterCategory;
  export let selectedItemId = "";
  export let selectedItemName = "";
  export let validationErrors;
  export let label;
  export let placeholder = "Select";
  export let disabled = false;
  export let required = false;
  export let loading = false;
  export let preventEventPropagation = false;
  export let dynamicItemAdd = false;

  const dispatch = createEventDispatcher();
  let optionsCopy = [...options];
  let showDropdown = false;
  let dropDownRef;
  let inputRef;
  let listRef;
  let searchFilterValue = "";
  let debounceTimer;
  let highlightedIndex = -1;
  let isUserTyping = false;
  let inputFocused = false;

  // Internal state for selection
  let internalSelectedItemId = selectedItemId;
  let internalSelectedItemName = selectedItemName;

  // Sync internal state with parent props
  $: if (
    selectedItemId !== internalSelectedItemId ||
    selectedItemName !== internalSelectedItemName
  ) {
    internalSelectedItemId = selectedItemId;
    internalSelectedItemName = selectedItemName;
    if (!isUserTyping) {
      searchFilterValue = selectedItemName || "";
    }
  }

  $: if (options?.length === 0) {
    if (!internalSelectedItemName && !internalSelectedItemId) {
      internalSelectedItemName = "";
      internalSelectedItemId = "";
      searchFilterValue = "";
      showDropdown = false;
    }
  }

  // filtering logic
  $: optionsCopy =
    searchFilterValue && isUserTyping
      ? options?.filter((data) =>
          (data?.title || data?.name)
            ?.toLowerCase()
            .includes(searchFilterValue?.toLowerCase())
        )
      : [...options];

  // dropdown control
  $: if (optionsCopy.length === 0 && searchFilterValue && isUserTyping) {
    showDropdown = true;
  }

  // the input value display logic
  $: inputDisplayValue = isUserTyping
    ? searchFilterValue
    : internalSelectedItemName || "";

  onMount(() => {
    if (!browser) return;
    if (internalSelectedItemName) {
      searchFilterValue = internalSelectedItemName;
    }
    showDropdown = false;
    isUserTyping = false;

    document.addEventListener("click", handleClickOnDocument);
    document.addEventListener("keydown", handleGlobalKeydown);

    return () => {
      document.removeEventListener("click", handleClickOnDocument);
      document.removeEventListener("keydown", handleGlobalKeydown);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  });

  // click outside handler
  function handleClickOnDocument(e) {
    if (dropDownRef && dropDownRef.contains(e.target)) {
      if (!showDropdown) {
        showDropdown = true;
      }
    } else {
      closeDropdown();
    }
  }

  // Add keyboard navigation
  function handleGlobalKeydown(e) {
    if (!showDropdown || !inputFocused) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        navigateOptions(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        navigateOptions(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < optionsCopy.length) {
          selectOptionByIndex(highlightedIndex);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  }

  function navigateOptions(direction) {
    if (optionsCopy.length === 0) return;

    if (highlightedIndex === -1) {
      highlightedIndex = direction > 0 ? 0 : optionsCopy.length - 1;
    } else {
      highlightedIndex += direction;
      if (highlightedIndex < 0) {
        highlightedIndex = optionsCopy.length - 1;
      } else if (highlightedIndex >= optionsCopy.length) {
        highlightedIndex = 0;
      }
    }
    scrollToHighlighted();
  }

  async function scrollToHighlighted() {
    await tick();
    if (listRef && highlightedIndex >= 0) {
      const item = listRef.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  function selectOptionByIndex(index) {
    if (index >= 0 && index < optionsCopy.length) {
      const option = optionsCopy[index];
      selectOption(option);
    }
  }

  function selectOption(data) {
    validationErrors = "";
    internalSelectedItemId = data?.uuid || data?.id;
    selectedItemId = data?.uuid || data?.id;
    internalSelectedItemName = data?.title || data?.name;
    selectedItemName = data?.title || data?.name;
    searchFilterValue = internalSelectedItemName;
    isUserTyping = false;
    dispatch("handleDispatchComboBoxData", {
      ...data,
      selectedItemId: internalSelectedItemId,
      selectedItemName: internalSelectedItemName,
    });
    showDropdown = false;
    highlightedIndex = -1;
  }

  function handleListItemSelection(e) {
    // Prevent the event from bubbling up to parent components
    if (preventEventPropagation) {
      e.stopPropagation();
    }

    const li = e.target.closest("li");
    if (!li || !li.dataset.id) return;

    // const selectedData = li.dataset;

    // const data = {
    //   uuid: selectedData.id,
    //   id: selectedData.id,
    //   title: selectedData.name,
    //   name: selectedData.name,
    // };
    // Find the index of the clicked item in optionsCopy
    const id = li.dataset.id;
    const data = optionsCopy.find((item) => (item?.uuid || item?.id) == id);
    selectOption(data);
  }

  function clearSelection(e) {
    if (preventEventPropagation) {
      e.stopPropagation();
    }
    internalSelectedItemName = "";
    internalSelectedItemId = "";
    selectedItemName = "";
    selectedItemId = "";
    searchFilterValue = "";
    isUserTyping = false;

    dispatch("handleDispatchFilterData", {
      selectedItemId: "",
      selectedItemName: "",
    });
    showDropdown = false;
    highlightedIndex = -1;
    if (inputRef) {
      inputRef.focus();
    }
  }

  function toggleDropdown() {
    if (disabled) return;

    showDropdown = !showDropdown;
    highlightedIndex = -1;

    if (showDropdown && selectedItemId) {
      // Highlight currently selected item
      const selectedIndex = optionsCopy.findIndex(
        (option) => (option?.id || option?.uuid) === selectedItemId
      );
      if (selectedIndex >= 0) {
        highlightedIndex = selectedIndex;
      }
    }
  }

  function handleSearchInput(e) {
    const value = e.target.value;

    // Clear existing timer
    clearTimeout(debounceTimer);

    // Set user typing flag immediately
    isUserTyping = true;

    // If user is clearing the input or typing something different from selected
    if (selectedItemName && value !== selectedItemName) {
      // Clear selection immediately when user starts typing something different
      // selectedItemId = '';
      // selectedItemName = '';
    }

    // Update search value immediately for responsive UI
    searchFilterValue = value;

    // Open dropdown if not already open
    if (!showDropdown) {
      showDropdown = true;
    }

    // Reset highlighted index
    highlightedIndex = -1;

    // Clear validation errors
    if (validationErrors) {
      validationErrors = "";
    }

    // If input is empty, close dropdown after a short delay
    if (!value.trim()) {
      debounceTimer = setTimeout(() => {
        if (!selectedItemId) {
          showDropdown = false;
          isUserTyping = false;
        }
      }, 100);
    }
  }

  function closeDropdown() {
    showDropdown = false;
    highlightedIndex = -1;

    // If user was typing but didn't select anything, revert to selected item
    if (isUserTyping) {
      if (selectedItemName) {
        searchFilterValue = selectedItemName;
      } else {
        searchFilterValue = "";
      }
      isUserTyping = false;
    }
  }

  function handleInputFocus() {
    inputFocused = true;
  }

  function handleInputBlur() {
    inputFocused = false;
    // Small delay to allow for option selection
    setTimeout(() => {
      if (!inputFocused) {
        closeDropdown();
      }
    }, 150);
  }

  function handleOptionMouseEnter(index) {
    highlightedIndex = index;
  }

  function handleDynamicAdd() {
    validationErrors = "";
    if (!inputDisplayValue) {
      validationErrors = "Enter value to be added";
      return;
    }
    dispatch("dynamicItemAddition", {
      filterCategory,
      value: inputDisplayValue,
    });
  }
</script>

<div>
  {#if label}
    <label
      for={filterCategory}
      class="block text-xs sm:text-xs font-medium leading-5 text-darkGray mb-1"
    >
      {label}{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
    </label>
  {/if}

  <!-- {#if label}
    <label for="input" class="block text-xs sm:text-sm {labelFontWeight} leading-6 text-dark-gray"
        >{label}{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}</label
    >
    {/if} -->
  <div class="relative" bind:this={dropDownRef}>
    <input
      bind:this={inputRef}
      type="text"
      id={filterCategory}
      class="block w-full rounded-md border-0 py-2 pl-3 pr-12 sm:py-1.5 sm:pl-2 sm:pr-20 text-darkGray shadow-sm outline-none ring-1 ring-accent placeholder:text-darkGray focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 truncate text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
      role="combobox"
      aria-controls="options"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
      placeholder={placeholder || ""}
      value={inputDisplayValue}
      title={inputDisplayValue}
      class:ring-red-500={validationErrors}
      class:ring-gray-300={!validationErrors}
      {disabled}
      on:click={toggleDropdown}
      on:focus={handleInputFocus}
      on:blur={handleInputBlur}
      on:input={handleSearchInput}
    />

    <!-- Keep all existing buttons exactly the same -->
    {#if selectedItemName && showDropdown && !disabled}
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center px-2 focus:outline-none"
        on:click={clearSelection}
      >
        <svg
          class="h-4 w-4 self-center"
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
      </button>
    {/if}
    {#if loading}
      <span
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
        class:pb-3={validationErrors}
      >
        <LoadingSpinner size="small" color="blue" />
      </span>
    {:else if validationErrors && !showDropdown && !disabled}
      <button
        class="absolute inset-y-0 right-0 flex items-center px-2 focus:outline-none"
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
      </button>
    {:else if !validationErrors && !showDropdown && !disabled}
      <button
        class="absolute inset-y-0 right-0 flex items-center px-2 focus:outline-none"
        on:click={toggleDropdown}
      >
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
      </button>
    {/if}
    {#if showDropdown && !disabled}
      <ul
        bind:this={listRef}
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none sm:text-sm"
        id="options"
        role="listbox"
        on:click={handleListItemSelection}
      >
        {#if options?.length === 0}
          <li
            class="relative cursor-default select-none py-2 px-3 text-gray-500 flex gap-2"
          >
            No options available
            {#if dynamicItemAdd}
              <Button
                on:click={handleDynamicAdd}
                btnType="custom"
                class="underline text-accent text-sm cursor-pointer"
                >+ Add new</Button
              >
            {/if}
          </li>
        {:else if optionsCopy?.length > 0}
          {#each optionsCopy as data, index (data?.id || data?.uuid)}
            <li
              data-id={data?.uuid || data?.id}
              data-name={data?.title || data?.name}
              class="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900"
              class:bg-indigo-100={highlightedIndex === index}
              on:mouseenter={() => handleOptionMouseEnter(index)}
            >
              <span
                class="block truncate text-xs sm:text-sm"
                title={data?.title || data?.name}
              >
                {data?.title || data?.name}
              </span>
              {#if internalSelectedItemId == (data?.uuid || data?.id)}
                <span
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600"
                >
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              {/if}
            </li>
          {/each}
        {:else}
          <li
            class="relative cursor-default select-none py-2 px-3 text-gray-500 flex gap-2"
          >
            No search results found
            {#if dynamicItemAdd}
              <Button
                on:click={handleDynamicAdd}
                btnType="custom"
                class="underline text-accent text-sm cursor-pointer"
                >+ Add new</Button
              >
            {/if}
          </li>
        {/if}
      </ul>
    {/if}
    {#if validationErrors && !showDropdown}
      <div class="relative mb-4 mt-1">
        <p class=" text-xs text-red-600 absolute w-full right-0">
          {validationErrors}
        </p>
      </div>
    {/if}
  </div>
</div>
