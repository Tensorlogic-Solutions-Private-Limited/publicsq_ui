<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import GoogleMatrialIcon from "$lib/components/reusable/GoogleMatrialIcon.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  // Callback when a job completes to refresh main table
  export let onJobCompleted = () => {};

  let inProgressJobs = [];
  let loading = false;
  let error = null;
  let pollingInterval = null;
  let showAllJobs = false;
  const POLLING_INTERVAL_MS = 10000; // Poll every 10 seconds
  const INITIAL_JOBS_TO_SHOW = 2;

  $: visibleJobs = showAllJobs
    ? inProgressJobs
    : inProgressJobs.slice(0, INITIAL_JOBS_TO_SHOW);
  $: hasMoreJobs = inProgressJobs.length > INITIAL_JOBS_TO_SHOW;
  $: hiddenJobsCount = Math.max(
    0,
    inProgressJobs.length - INITIAL_JOBS_TO_SHOW
  );

  function calculateProgress(job) {
    if (!job.total_rows || job.total_rows === 0 || !job.total_rows) return 0;
    const progress = (job.processed_rows / job.total_rows) * 100;
    return Math.min(Math.round(progress), 100);
  }

  function formatDateTime(dateString) {
    if (!dateString) return "";

    // Ensure UTC format with 'Z' at the end
    let safeDate = dateString.endsWith("Z") ? dateString : dateString + "Z";
    // Trim microseconds to 3 digits (JS only supports milliseconds)
    safeDate = safeDate.replace(/(\.\d{3})\d+/, "$1");

    const date = new Date(safeDate);
    if (isNaN(date)) return ""; // Fallback for invalid dates

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  }

  function formatJobType(jobType) {
    const typeMap = {
      QUESTION: "Question",
    };
    return typeMap[jobType] || jobType || "-";
  }

  function toggleShowAllJobs() {
    showAllJobs = !showAllJobs;
  }

  async function fetchInProgressJobs() {
    if (!browser) return;

    try {
      // if error occurs in UI we have to show loader while retyring, for normal polling we need not show loading state
      if (error) loading = true;
 
      const url = "apis/jobs?status=processing";
      const response = await apiClient(url);

      if (!response || !response.ok) {
        if(response === null){
          throw new Error('');
        }
        throw new Error(`status: ${response?.status}`);
      }

      const data = await response.json();

      // Update the in-progress jobs
      const previousJobIds = new Set(inProgressJobs?.map((job) => job.id));
      const newJobs = data.jobs || [];

      inProgressJobs = newJobs;

      // Check if any jobs have completed since last check
      const currentJobIds = new Set(inProgressJobs?.map((job) => job.id));
      const jobsCompleted = Array.from(previousJobIds)?.some(
        (id) => !currentJobIds?.has(id)
      );

      if (jobsCompleted) {
        // Notify parent component to refresh the main table
        onJobCompleted();
      }

      error = null;
    } catch (err) {
      console.error("Error fetching in-progress jobs:", err);
      error = `Failed to load in-progress jobs: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  async function startPolling() {
    await fetchInProgressJobs();
    if (error) {
      pollingInterval = null;
    } else {
      pollingInterval = setInterval(fetchInProgressJobs, POLLING_INTERVAL_MS);
    }
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  onMount(() => {
    if (browser) {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });
</script>

<div class="mb-6">
  {#if loading && !error}
    <div
      class="bg-blue-50 border border-blue-200 mb-6 rounded-md p-3 flex items-center justify-center h-12"
    >
      <div class="flex items-center gap-2">
        <GoogleMatrialIcon
          iconName="hourglass_empty"
          addClass="animate-spin text-primary text-sm"
        />
        <span class="text-xs text-gray-600">Loading in-progress uploads...</span
        >
      </div>
    </div>
  {:else if error}
    <div
      class="bg-red-50 border border-red-200 rounded-md p-3 h-12 mb-6 flex items-center justify-between w-full"
    >
      <div class="flex gap-2 items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <GoogleMatrialIcon
            iconName="error"
            addClass="text-red-400 text-sm"
          />
          <div class="text-xs text-red-700">{error || 'Unexpected error occured. Please try again.'}</div>
        </div>
        <Button
          on:click={fetchInProgressJobs}
          btnType="secondary"
        >
          <GoogleMatrialIcon
            iconName="refresh"
            addClass="text-xs"
          />
          <span class="text-xs">{loading ? "loading.." : "Retry"}</span>
        </Button>
      </div>
    </div>
  {:else if inProgressJobs.length === 0}
    <!-- No in-progress jobs, don't show anything as per requirements -->
  {:else}
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-primary flex items-center gap-2 text-sm">
          <GoogleMatrialIcon
            iconName="sync"
            addClass="animate-spin text-primary text-sm"
          />
          Bulk Uploads in Progress ({inProgressJobs?.length})
        </h2>
      </div>

      <div class="grid gap-2 mb-3">
        {#each visibleJobs as job, index (job?.job_id)}
          <div
            class="bg-white border border-blue-100 rounded-md p-2.5 shadow-sm"
          >
            <div class="flex flex-wrap justify-between items-center mb-1.5">
              <div class="flex items-center gap-2">
                <div>
                  <!-- <p class="font-semibold text-darkGray text-sm">{formatJobType(job.jobType)} </p> -->
                  <p class="font-semibold text-darkGray text-sm">
                    {job?.filename}
                  </p>
                  {#if job?.description}
                    <p class="text-darkGray text-xs py-1">{job?.description}</p>
                  {/if}
                </div>
              </div>
              <div class="text-xs text-gray-500">
                {formatDateTime(job?.created_at)}
              </div>
            </div>

            <div class="mb-1.5">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span
                  >Processed: {job?.processed_rows || 0} of {job?.total_rows ||
                    "0"} rows</span
                >
                <span>{calculateProgress(job)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  class="bg-blue-400 h-1.5 rounded-full transition-all duration-500 ease-in-out"
                  style="width: {calculateProgress(job)}%"
                ></div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 text-xs text-gray-600">
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>Success: {job.success_count || 0}</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span>Failures: {job.error_count || 0}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if hasMoreJobs}
        <div class="flex justify-end">
          <Button
            on:click={toggleShowAllJobs}
            class="text-primary hover:text-primary-hover text-xs font-medium flex items-center gap-1 px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-300"
            type="button"
          >
            <GoogleMatrialIcon
              iconName={showAllJobs ? "expand_less" : "expand_more"}
              addClass="text-xs"
            />
            {#if showAllJobs}
              Show Less
            {:else}
              Show {hiddenJobsCount} More
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>
