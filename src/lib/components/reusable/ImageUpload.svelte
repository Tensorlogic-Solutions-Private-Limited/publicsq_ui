<script>
  import { createEventDispatcher } from 'svelte';
//   import { X } from 'lucide-svelte';
import X from "@lucide/svelte/icons/x";
import Button from "$lib/components/reusable/Button.svelte" ; 
  
  export let label = '';
  export let required = false;
  export let maxSize = 500 * 1024; // 500KB in bytes
  export let acceptedTypes = 'image/*';
  export let recommendedDimensions = '';
  export let error = '';
  export let preview = '';
  
  const dispatch = createEventDispatcher();
  let fileInput;
  let dragover = false;

  function handleFileSelect(event) {
    const file = event.target.files[0] || event.dataTransfer.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      dispatch('error', 'Please select an image file');
      return;
    }
    
    if (file.size > maxSize) {
      dispatch('error', 'Image size should not exceed 500KB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      preview = e.target.result;
      dispatch('fileSelected', { file, preview: e.target.result });
    };
    reader.readAsDataURL(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    dragover = true;
  }

  function handleDragLeave() {
    dragover = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    dragover = false;
    handleFileSelect(e);
  }

  function removeImage() {
    preview = '';
    fileInput.value = '';
    dispatch('fileRemoved');
  } 
</script>

<div class="w-full flex flex-col items-center gap-4">
  <div class="flex justify-between items-center w-full mb-2">
    <label class="block text-sm font-medium text-gray-700">
      <!-- {label} {#if required}<span class="text-red-500">*</span>{/if} -->
    </label>
    
  </div>

  {#if !preview}
    <div
      class="w-32 h-32 flex justify-center items-center border-2 border-gray-300 border-dashed rounded-md
        {dragover ? 'border-blue-500 bg-blue-50' : ''}
        {error ? 'border-red-500' : ''}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
    >
      <div class="space-y-4 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <!-- <p class="text-sm text-gray-600">Drag and drop here</p> -->
        <p class="text-xs text-gray-500">
          PNG, JPG, GIF up to 500KB
        </p>
      </div>
    </div>
  {:else}
    <div class="w-32 h-32 relative rounded-md overflow-hidden border border-gray-300">
      <img
        src={preview}
        alt="Preview"
        class="w-full object-contain bg-gray-50"
      />
      <button
        type="button"
        class="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
        on:click={removeImage}
      >
        <X class="w-4 h-4 text-gray-600" />
      </button>
    </div>
  {/if}

  <div class="flex flex-col gap-4 items-center w-[240px]">
    <Button
      btnType="secondary"
      customClass="w-full"
      on:click={() => fileInput.click()}
    >
      {preview ? 'Change Image' : 'Upload Image'}
    </Button>
    
    <input
      bind:this={fileInput}
      type="file"
      class="hidden"
      {acceptedTypes}
      on:change={handleFileSelect}
    />

    {#if recommendedDimensions}
      <span class="text-xs text-gray-500">
        Recommended dimensions: {recommendedDimensions}
      </span>
    {/if}
    
  </div>

  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>