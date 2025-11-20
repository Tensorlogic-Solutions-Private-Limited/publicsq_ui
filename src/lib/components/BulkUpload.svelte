<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiClient } from "$lib/utils/apiClient.js";
  // import { showLoadingSpinner } from '/src/routes/store.js';
  // import {  handleRedirection } from '$lib/utils/helper.js';
  import DragAndDrop from "$lib/components/DragAndDrop.svelte";
  import DeletionErrorMessage from "$lib/components/reusable/DeletionErrorMessage.svelte";
  import SuccessMessage from "$lib/components/reusable/SuccessMessage.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  // import TextDescriptionField from '$lib/components/TextDescriptionField.svelte';

  export let bulkUploadItemName = "";
  export let endPoint = "";
  export let templatePath = "";
  export let templateFileName = "template.xlsx";
  export let usePolling = false;

  let dispatch = createEventDispatcher();
  let fileToUpload = null;
  let errorMessage = "";
  let successMessage = "";
  let isSubmitting = false;
  let errorReportUrl = "";
  let description = null;
  let isDownloadingTemplate = false;

  let isPolling = false;
  let jobUuid = "";
  let processingStatus = "";
  let processedRows = 0;
  let successRows = 0;
  let failedRows = 0;
  let totalRows = 0;
  let pollingInterval;
  let resultFile = "";

  function handleFileUpload(e) {
    fileToUpload = e.detail;
  }

  function handleFileRemoval(e) {
    handleCancel();
  }

  function handleCancel() {
    fileToUpload = null;
    errorMessage = "";
    isSubmitting = false;
    isPolling = false;
    processingStatus = "";
    jobUuid = "";
    processedRows = 0;
    successRows = 0;
    failedRows = 0;
    totalRows = 0;
    resultFile = "";
    errorReportUrl = "";
    description = null;
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    // showLoadingSpinner.set(false);
  }

  function handleSuccessMessageClose() {
    successMessage = "";
  }

  function handlePollingResult(result) {
    if (result.status === "completed") {
      isPolling = false;
      isSubmitting = false;
      // showLoadingSpinner.set(false);

      if (result.error_count > 0) {
        errorMessage = `Completed with ${result.error_count} errors. Please check the error report.`;
        if (result.result_loc) errorReportUrl = result.result_loc;
      } else if (result?.error_details) {
        errorMessage = `Failed to process ${bulkUploadItemName}. Please try again. Error: ${result?.error_details || "-"}`;
      } else {
        successMessage = `Successfully uploaded ${result.success_count} ${bulkUploadItemName}`;
      }
    } else if (result.status === "failed") {
      isPolling = false;
      isSubmitting = false;
      // showLoadingSpinner.set(false);
      errorMessage = `Failed to process ${bulkUploadItemName}. Please try again. Error: ${result?.error_details || "-"}`;
      if (result.result_loc) {
        errorReportUrl = result.result_loc;
      }
    }
  }

  async function pollJobStatus() {
    let result;
    let response;
    try {
      if (!jobUuid)
        throw new Error("Bulk upload job uuid is missing. Please try again.");

      response = await apiClient(`/apis/jobs/${jobUuid}`, {
        method: "GET",
      });

      if (!response || !response.ok) {
        throw new Error(
          "Failed to fetch bulk upload job status. Please try again."
        );
      }

      result = await response.json();
      // If job is completed, stop polling
      clearInterval(pollingInterval);
      console.log("result of polling", result);
      // Update status information
      processingStatus = result.status;
      processedRows = result.processed_rows;
      successRows = result?.success_count;
      failedRows = result?.error_count;
      totalRows = result.total_rows;
      resultFile = result?.result_loc;

      handlePollingResult(result);
    } catch (error) {
      console.error("Error polling job status:", error);
      handleCancel();
      errorMessage =
        error?.message ||
        `Unexpected error occured. Please try again. Error:${response?.status || "-"}`;
    }
  }

  async function handleSubmit() {
    try {
      errorMessage = "";
      successMessage = "";
      errorReportUrl = "";
      resultFile = "";
      isSubmitting = true;
      isPolling = false;
      jobUuid = "";
      processingStatus = "";
      processedRows = 0;
      totalRows = 0;
      failedRows = 0;
      totalRows = 0;
      // showLoadingSpinner.set(true);

      if (!fileToUpload) {
        errorMessage = "Please select a file to continue";
        isSubmitting = false;
        // showLoadingSpinner.set(false);
        return;
      }

      let formData = new FormData();
      formData.append("file", fileToUpload);

      if (usePolling) {
        if (description) formData.append("description", description);
        const response = await apiClient(`${endPoint}`, {
          method: "POST",
          body: formData,
        });

        const result = await response?.json();
        console.log("result of upload", result);
        if (!response || !response.ok) {
          if (response?.status === 401 || response?.status === 403) {
            // handleRedirection(response.status, $page.url.pathname, $page.url.search);
          }
          // errorMessage = `Failed to upload ${bulkUploadItemName}. Please try again. (Error: ${result?.error || response?.statusText})`;
          errorMessage = `Failed to upload ${bulkUploadItemName}. `;
          isSubmitting = false;
          // showLoadingSpinner.set(false);
          return;
        }

        jobUuid = result.job_id;

        // Start polling
        isPolling = true;
        processingStatus = "PROCESSING";
        console.log("reached job polling");
        pollingInterval = setInterval(pollJobStatus, 5000);
      } else {
        // showLoadingSpinner.set(true);
        // Use the original approach for other bulk uploads
        const response = await apiClient(`${endPoint}`, {
          method: "POST",
          body: formData,
        });
        console.log("result of upload", result);
        const result = await response?.json();
        if (!response || !response.ok || response.status !== 200) {
          errorMessage = `Failed to bulk upload ${bulkUploadItemName}. Please try again. (Error: ${result?.error})`;
          errorReportUrl = result?.errorReportUrl || "";
          throw new Error(`Failed to bulk upload ${bulkUploadItemName}.`);
        }

        if (!result.error) {
          successMessage = `Successfully bulk uploaded ${bulkUploadItemName}`;
        } else {
          errorMessage = `Failed to bulk upload ${bulkUploadItemName}. Please try again. (Error: ${result?.error})`;
        }

        isSubmitting = false;
        // showLoadingSpinner.set(false);

        if (!errorMessage) {
          handleCancel();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      isSubmitting = false;
      isPolling = false;
      // showLoadingSpinner.set(false);
    }
  }

  async function handleTemplateDownload(event) {
    // If templatePath is a static file, let the anchor tag handle it
    if (!templatePath.startsWith("/apis/")) return;

    event.preventDefault();
    isDownloadingTemplate = true;
    try {
      const res = await apiClient(templatePath);
      if (!res || !res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = templateFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      errorMessage = "Failed to download template file.";
    } finally {
      isDownloadingTemplate = false;
    }
  }

  onDestroy(() => {
    // showLoadingSpinner.set(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });
</script>

<h2 class="mb-1 font-semibold capitalize text-primary">
  {bulkUploadItemName ? `Bulk upload ${bulkUploadItemName}` : ""}
</h2>
<div class="mb-2">
  {#if errorMessage}
    <DeletionErrorMessage {errorMessage}>
      {#if errorReportUrl}
        <a
          href={errorReportUrl}
          class="text-sm text-red-800 hover:text-red-600 font-medium underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click to view error report
        </a>
      {/if}
    </DeletionErrorMessage>
  {/if}

  {#if successMessage}
    <SuccessMessage
      {successMessage}
      on:handleSuccessMessageClose={handleSuccessMessageClose}
    />
  {/if}
</div>

<section class="flex flex-col justify-between h-[400px]">
  {#if isPolling}
    <div
      class="bg-white border border-blue-100 rounded-md p-2.5 shadow-sm w-full my-2"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-1.5">
        <span class="font-semibold text-darkGray text-sm"
          >Processing Bulk Upload</span
        >
        <span class="text-xs text-gray-500"
          >{processedRows} of {totalRows || 0} rows</span
        >
      </div>

      <!-- Progress Bar -->
      <div class="mb-1.5">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span
            >{totalRows > 0
              ? Math.round((processedRows / totalRows) * 100)
              : 0}%</span
          >
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div
            class="bg-accent h-1.5 rounded-full transition-all duration-300 ease-in-out"
            style="width: {totalRows > 0
              ? (processedRows / totalRows) * 100
              : 0}%"
          ></div>
        </div>
      </div>

      <!-- Status Row -->
      <div class="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span>Success: {successRows || 0}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          <span>Failures: {failedRows || 0}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          <span>Total: {totalRows || 0}</span>
        </div>
      </div>
    </div>
  {/if}

  {#if usePolling}
    <div class="w-full sm:w-3/4 md:w-1/2 mt-2">
      <!-- <TextDescriptionField
				label={'Description'}
				placeholder={'Enter Bulk Upload Description'}
				name={'description'}
				bind:value={description}
				rows={1}
			/> -->
    </div>
  {/if}
  <DragAndDrop
    uploadItemName={bulkUploadItemName}
    on:handleFileUpload={handleFileUpload}
    on:handleFileRemoval={handleFileRemoval}
  />
  <div class="flex items-start gap-2 my-2">
    <p class="text-sm">Please follow this format for bulk upload:</p>
    <a
      href={templatePath}
      download={templateFileName}
      on:click={handleTemplateDownload}
      class="text-accent text-sm hover:underline flex items-center gap-2"
      style="pointer-events: {isDownloadingTemplate
        ? 'none'
        : 'auto'}; opacity: {isDownloadingTemplate ? 0.6 : 1};"
    >
      {#if isDownloadingTemplate}
        <svg
          class="animate-spin h-4 w-4 mr-1 text-primary"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        Downloading...
      {:else}
        Download Template
      {/if}
    </a>
  </div>

  <div class="flex justify-end">
    <Button
      disabled={!fileToUpload || isSubmitting || isPolling}
      on:click={handleSubmit}>Submit</Button
    >
  </div>
</section>
