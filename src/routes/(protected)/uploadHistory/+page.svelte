<script>
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import GoogleMatrialIcon from "$lib/components/reusable/GoogleMatrialIcon.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import FilterComponent from "$lib/components/reusable/FilterComponent.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import InProgressComponent from "$lib/uploadHistory/InProgressComponent.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let data;

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let loading = true;

  let tableData = [];
  let searchValue = "";
  let apiError = null;
  let filters = {};

  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  let filterOptions = [
    // {
    //   filterName: "Upload Type",
    //   filterValue: [
    //     { id: "1", name: "Question Upload", value: "QUESTION_UPLOAD" },
    //   ],
    // },
    {
      filterName: "Status",
      filterValue: [
        { id: "1", name: "Completed", value: "completed" },
        { id: "2", name: "Failed", value: "failed" },
        { id: "3", name: "In Progress", value: "processing" },
        { id: "4", name: "Pending", value: "pending" },
      ],
    },
  ];

  let customRenderers = {
    status: (data) => {
      const status = data?.status;
      const base =
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
      const statusClass = {
        completed: "bg-green-100 text-green-800 lowercase",
        failed: "bg-red-100 text-red-800 lowercase",
        processing: "bg-yellow-100 text-yellow-800 lowercase",
        pending: "bg-gray-100 text-gray-800 lowercase",
      };
      return `<span class="${base} ${statusClass[status] || "bg-gray-100 text-gray-800 lowercase"}">${status || "-"}</span>`;
    },

    resultFile: (data) => {
      const url = data?.result_loc;
      if (!url) return `<span class="text-gray-400 italic text-sm">N/A</span>`;
      return `<a href="${url}" target="_blank" class="text-blue-600 underline text-sm hover:text-blue-800">Download</a>`;
    },

    // jobType: (data) => {
    // 	const jobType = data?.jobType;
    // 	const typeMap = {
    // 		QUESTION_UPLOAD: 'Question',

    // 	};
    // 	return typeMap[jobType] || jobType || '-';
    // }
  };

  // -------------------------------------------------------------------------
  // TABLE CONFIGURATION
  // -------------------------------------------------------------------------

  const tableHeaders = [
    { key: "filename", name: "File Name", width: "10%" },
    // { key: 'description', name: 'Description', width: '20%' },
    { key: "status", name: "Status", width: "10%" },
    { key: "resultFile", name: "Result File", width: "10%" },
    { key: "success_count", name: "Success Rows", width: "10%" },
    { key: "error_count", name: "Failed Rows", width: "10%" },
    { key: "uploadedby", name: "Uploaded By", width: "15%" },
    { key: "created_at", name: "Uploaded At", width: "15%" },
  ];

  async function fetchAuditLogs(
    page = 1,
    size = 10,
    searchValue = "",
    filters = {},
    resetPagination = false
  ) {
    if (!browser) return;

    // Reset to page 1 (for new search/filter)
    if (resetPagination) {
      page = 1;
      currentPage = 1;
    }

    loading = true;
    apiError = null;

    try {
      const apiPage = page - 1; // Convert to 0-based for API
      const queryParams = [];

      // Add pagination
      //   queryParams.push(`page=${apiPage}`);
      //   queryParams.push(`size=${size}`);

      // Add search param if provided
      if (searchValue && searchValue.trim()) {
        queryParams.push(`username=${encodeURIComponent(searchValue.trim())}`);
      }

      // Add filters
      if (filters && Object.keys(filters)?.length > 0) {
        for (const key of Object.keys(filters)) {
          const filter = filters[key];

          //   if (key === "Upload Type" && filter?.value) {
          //     queryParams.push(`jobType=${encodeURIComponent(filter.value)}`);
          //   }

          if (key === "Status" && filter?.value) {
            queryParams.push(`status=${encodeURIComponent(filter.value)}`);
          }
        }
      }

      const url = `apis/jobs?${queryParams.join("&")}`;

      const response = await apiClient(url);

      if (!response || !response?.ok) {
        if(response === null){
          throw new Error('');
        }
        throw new Error(`Status: ${response?.status}`);
      }

      const responseData = await response.json();

      totalItems = responseData?.total_count || 0;
      currentPage = (responseData?.page || 0) + 1; // Convert back to 1-based
      tableData = formatTableData(responseData?.jobs || []);

      // Handle empty results
      if (tableData.length === 0 && totalItems === 0) {
        if (searchValue || Object.keys(filters)?.length > 0) {
          apiError = "No results found for your criteria.";
        } else {
          apiError = "No bulk upload history available.";
        }
      } else {
        apiError = null;
      }
    } catch (error) {
      console.error("Error fetching bulk upload logs:", error);
      apiError = `Failed to load bulk upload logs: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }

  function formatTableData(jobs) {
    if (!jobs || !Array.isArray(jobs)) return [];

    return jobs.map((log) => ({
      ...log,
      uploadedby: log?.uploadedby || "-",
      created_at: log?.created_at
        ? new Date(
            log.created_at.endsWith("Z") ? log.created_at : log.created_at + "Z"
          ).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata", // Convert to IST
          })
        : "-",
    }));
  }

  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    // Update page size if it changed
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
    }

    // Fetch new data with current search and filters
    fetchAuditLogs(page, pageSize, searchValue, filters);
  }

  function handleSearchValue(e) {
    const newSearchValue = e?.detail || "";
    searchValue = newSearchValue;

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search API call
    searchTimeout = setTimeout(() => {
      fetchAuditLogs(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};

    // Fetch data with new filters (reset to page 1)
    fetchAuditLogs(1, pageSize, searchValue, filters, true);
  }

  // Handle job completion from in-progress component
  function handleJobCompleted() {
    // Refresh the main table to show the latest data
    fetchAuditLogs(currentPage, pageSize, searchValue, filters);
  }

  // Initialize data on component mount
  onMount(() => {
    if (browser) {
      loading = true;
      // Use initial data if available, otherwise fetch from API
      if (data?.bulkUploadHistory && !data.bulkUploadHistory.error) {
        const { bulkUploadHistory } = data;
        tableData = formatTableData(bulkUploadHistory?.jobs || []);
        totalItems = bulkUploadHistory.total_count || 0;
        currentPage = (bulkUploadHistory.page || 0) + 1;
        loading = false;
      } else {
        // Fetch data from API
        fetchAuditLogs(currentPage, pageSize, searchValue, filters);
      }
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  });
</script>

<div class="bg-gray-50 mx-auto px-4 sm:px-6 lg:px-8 my-8">
  <div class="mb-6">
    <h1 class="heading-L">Bulk Upload Logs</h1>
    <p class="italic text-xs text-darkGray mt-1">
      ( Note: This page currently supports bulk upload logs for
      Questions bulk upload. )
    </p>
  </div>
  <!-- --------------------------- IN-PROGRESS JOBS COMPONENT ---------------------------------->
  <InProgressComponent onJobCompleted={handleJobCompleted} />

  <!-- --------------------------- SEARCH AND ACTION BUTTONS ---------------------------------->

  <div class="mb-4 flex gap-2 flex-wrap lg:flex-nowrap items-start">
    <SearchBar
      on:handleSearchValue={handleSearchValue}
      placeholder={"Search by username"}
      showSearchButton={false}
    />
    <div class="flex justify-end">
      {#if Number(Object.keys(filterOptions)?.length) > 0}
        <FilterComponent
          on:filterApplied={handleFilterApplied}
          {filterOptions}
        >
          <span
            slot="btnContent"
            class="flex gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="feather feather-filter"
              ><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
              ></polygon></svg
            > Filters
          </span>
        </FilterComponent>
      {/if}
    </div>
    <Button
      btnType="secondary"
      on:click={() =>
        fetchAuditLogs(currentPage, pageSize, searchValue, filters)}
      disabled={loading}
    >
      <span class="material-icons-outlined text-sm" style="font-size: 20px;"> autorenew </span>
      Refresh</Button
    >
  </div>

  {#if Number(Object.keys(filters)?.length) > 0}
    <p class="text-sm mb-6">
      Filters applied:
      {#each Object.entries(filters) as [key, value], index}
        <span
          >{key} - {value?.name}{index < Object.entries(filters).length - 1
            ? ", "
            : ""}</span
        >
      {/each}
    </p>
  {/if}

  <!-- ------------------------------ DATA TABLE SECTION ------------------------------>

  <div class="">
    {#if loading}
      <DatatableSkeleton />
    {:else}
      <DataTable
        {tableData}
        tableHeadersDisplay={tableHeaders}
        {searchValue}
        entriesPerPage={pageSize}
        showPagination={true}
        tableStyle="primary"
        notFoundMessage={apiError || "No logs found. Please try again."}
        bulkSelect={false}
        {customRenderers}
        headerColour={"bg-gradient-to-r from-blue-50 to-indigo-50"}
        on:pageChange={handlePageChange}
      />
    {/if}
  </div>

  <!-- {#if apiError}
    <div class="flex justify-center items-center mt-2">
      <Button
        on:click={() =>
          fetchAuditLogs(currentPage, pageSize, searchValue, filters)}
        disabled={loading}
      >
        <GoogleMatrialIcon
          iconName="refresh"
          addClass={loading ? "animate-spin" : "text-sm"}
        />
        <span class="text-sm">{loading ? "Loading..." : "Refresh"}</span>
      </Button>
    </div>
  {/if} -->
</div>
