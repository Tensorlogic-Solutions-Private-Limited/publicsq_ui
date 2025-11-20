<script>
  import { browser } from "$app/environment";
  import { createEventDispatcher, onMount, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  // Font size options
  const fontSizes = {
    // xs: { label: "XS", scale: 0.75, description: "Extra Small" },
    small: { label: "S", scale: 0.875, description: "Small" },
    medium: { label: "M", scale: 1, description: "Medium" },
    large: { label: "L", scale: 1.3, description: "Large" },
    xl: { label: "XL", scale: 1.6, description: "Extra Large" },
    xxl: { label: "XXL", scale: 2, description: "Extra Extra Large" },
    // xxl: { label: "XXXL", scale: 1.75, description: "Extra Extra Extra Large" },
  };

  const sizeKeys = Object.keys(fontSizes);

  export let currentSize = "medium";
  let showDropdown = false;

  function changeFontSize(newSize) {
    if (fontSizes[newSize]) {
      currentSize = newSize;
      showDropdown = false;

      // Dispatch the selection with all relevant data
      dispatch("fontSizeChange", {
        size: newSize,
        scale: fontSizes[newSize].scale,
        label: fontSizes[newSize].label,
        description: fontSizes[newSize].description,
      });
    }
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest(".relative.z-50")) {
      showDropdown = false;
    }
  }

  // Add and cleanup global event listener for outside clicks
  onMount(() => {
    if (browser) {
      document.addEventListener("click", handleClickOutside);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener("click", handleClickOutside);
    }
  });
</script>

<div class="relative z-50">
  <!-- Trigger Button -->
  <button
    on:click={toggleDropdown}
    class="flex items-center gap-2 px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-slate-600 cursor-pointer transition-all duration-200 text-sm font-medium shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-gray-700"
    title="Select font size"
    aria-label="Font size selector"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <span class="font-semibold text-blue-600"
      >{fontSizes[currentSize].label}</span
    >
    <svg
      class="w-3.5 h-3.5 transition-transform duration-200 {showDropdown
        ? 'rotate-180'
        : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  <!-- Dropdown Panel -->
  {#if showDropdown}
    <div
      class="absolute top-full right-0 mt-2 min-w-72 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span class="text-sm font-semibold text-gray-700">Font Size</span>
      </div>

      <!-- Size Options -->
      <div class="p-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
        {#each sizeKeys as sizeKey}
          <button
            title={fontSizes[sizeKey].description
              ? fontSizes[sizeKey].description
              : ""}
            on:click={() => changeFontSize(sizeKey)}
            class="flex w-full items-center gap-3 p-3 rounded-md cursor-pointer transition-all duration-200 text-left relative {currentSize ===
            sizeKey
              ? 'bg-blue-50 border-2 border-blue-600 text-blue-800'
              : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}"
            style="font-size: {fontSizes[sizeKey].scale}em"
          >
            <span class="font-semibold min-w-8 text-blue-600"
              >{fontSizes[sizeKey].label}</span
            >
            <span class="flex w-full">
              {#if sizeKey === "medium"}
                <span
                  class="text-xs px-1.5 py-0.5 bg-emerald-600 text-white rounded font-medium uppercase tracking-wide"
                  >Default</span
                >
                <!-- <span class="text-xs text-slate-600 mr-2">{fontSizes[sizeKey].description}</span> -->
                {/if}
                <span class="ml-auto text-slate-800 mr-2">Text</span>
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
