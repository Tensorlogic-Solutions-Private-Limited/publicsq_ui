<script>
  import { createEventDispatcher, onMount } from "svelte";

  export let uploadItemName = "Excel file";
  export let id = crypto.randomUUID();
  export let file = null;

  let dragover = false;
  let fileUrl = null;
  let dropZone;
  let errorMessage = "";
  const maxFileSize = 1 * 1024 * 1024;
  const dispatch = createEventDispatcher();

  function handleFileSelect(event) {
    errorMessage = "";
    const newFile = event.target.files?.[0] || event.dataTransfer?.files[0];
    if (newFile) handleFile(newFile);
  }

  function handleFile(newFile) {
    if (newFile.size > maxFileSize) {
      errorMessage = `File size exceeds the 1MB limit. The file is ${(newFile.size / 1024 / 1024).toFixed(2)} MB.`;
      return;
    }

    // Reset error message
    errorMessage = "";
    if (
      newFile.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      if (file) {
        URL.revokeObjectURL(fileUrl);
      }
      file = newFile;
      fileUrl = URL.createObjectURL(file);
      // dispatch('handleSyllabusUploadFile',file)
      dispatch("handleFileUpload", file);
    } else {
      dispatch("error", { message: `${newFile.name} is not a PDF file.` });
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    dragover = true;
  }

  function handleDragLeave(event) {
    if (event.target === dropZone) {
      dragover = false;
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    dragover = false;
    errorMessage = "";
    handleFileSelect(event);
  }

  function removeFile() {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    file = null;
    fileUrl = null;
    errorMessage = "";
    document.getElementById(id).value = null;
    dispatch("handleFileRemoval");
  }

  function downloadExcel() {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  onMount(() => {
    // if(typeof file === 'string'){
    //   fileUrl=file
    // }
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  });
</script>

<div
  class="bg-gray-10 overflow-hidden h-full"
  bind:this={dropZone}
  on:dragover|preventDefault={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop|preventDefault={handleDrop}
>
  <div
    class="relative block w-full h-full flex justify-center items-center flex-col rounded-lg bg-offwhite border-2 border-dashed border-gray-300 p-12 py-20 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    class:bg-white={file !== null}
    class:border-blue-500={dragover}
    on:click={() => document.getElementById(id).click()}
  >
    <input
      {id}
      type="file"
      accept=".xlsx"
      class="hidden"
      on:change={handleFileSelect}
    />

    {#if file === null}
      <div class="flex justify-center items-center gap-2 ">
        <!-- <img src="/folderIcon.svg" alt="folder icon" /> -->
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
          class="lucide lucide-file-up-icon lucide-file-up"
          ><path
            d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
          /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M12 12v6" /><path
            d="m15 15-3-3-3 3"
          /></svg
        >
        <div>
          <p class="mt-2 text-sm text-gray-900">
            drag and drop to upload {uploadItemName}
          </p>
          <p class="text-xs text-gray-900 text-center">or browse</p>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-between bg-gray-100 p-2 rounded">
        <button
          class="truncate flex-1 text-left text-blue-600 hover:text-blue-800"
          on:click|stopPropagation={downloadExcel}
        >
          {file.name}
        </button>
        <button
          class="ml-2 text-red-600 hover:text-red-800"
          on:click|stopPropagation={removeFile}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    {/if}

    {#if file !== null}
      <p class="mt-4 text-sm text-gray-600">
        Click or drag and drop to replace the file
      </p>
    {/if}

    {#if errorMessage}
      <p class="mt-2 text-xs text-red-500">{errorMessage}</p>
    {/if}
  </div>
</div>
