<script>
  import { onDestroy, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { browser } from "$app/environment";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import FilterComponent from "$lib/components/reusable/FilterComponent.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Eye from "@lucide/svelte/icons/eye";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash from "@lucide/svelte/icons/trash";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import {
    Funnel,
    PlusIcon,
    PencilLine,
    FunnelIcon,
  } from "@lucide/svelte/icons";
  import { goto } from "$app/navigation";
  import QuizDeletionModal from "$lib/components/new-quiz/QuizDeletionModal.svelte";
  import {
    notificationStore,
    clearNotification,
  } from "$lib/components/quiz/notificationStore.js";

  import { authStore } from "$lib/stores/authStore.js";
  import { apiClient } from "$lib/utils/apiClient.js";
  import { Edit } from "@lucide/svelte";

  export let data;

  const SEARCH_DEBOUNCE_MS = 500;

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let loading = true;
  let tableData = [];
  let searchValue = "";
  let apiError = null;
  let showModal = false;
  let selectedQuiz = null;
  let showDeleteModal = false;

  let searchTimeout;
  let notification = {};
  let activeTab = "Conducted";

  const quizStatuses = [
    { id: "1", name: "Conducted", value: "completed" },
    { id: "2", name: "Started", value: "started" },
    { id: "3", name: "Saved", value: "saved" },
    { id: "4", name: "Draft", value: "draft" },
  ];

  const deleteEnabledExams = ["saved", "draft"];

  let filters = {
    // ...defaultFilters, // to pass the
  };

  let permissions = {
    add: true,
    edit: true,
    delete: true,
  };

  let customRenderers = {
    status: (data) => {
      const status = data?.status?.toLowerCase();
      const base =
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
      const statusClass = {
        draft: "bg-gray-100 text-gray-800 lowercase",
        saved: "bg-blue-100 text-blue-800 lowercase",
        started: "bg-yellow-100 text-yellow-800 lowercase",
        conducted: "bg-green-100 text-green-800 lowercase",
      };
      const displayText = {
        draft: "Draft",
        saved: "Saved", 
        started: "Started",
        completed: "Conducted"
      }[status] || status;
      return `<span class="${base} ${statusClass[status] || "bg-gray-100 text-gray-800 lowercase"}">${displayText}</span>`;
    },
    standard: (data) => {
      const standard = data?.standard || '-';
      const division = data?.division ? data?.division : "";

      return `<span class="">${standard} ${division}</span>`;
    },
  };

  const tableHeaders = [
    { key: "exam_name", name: "Title" },
    { key: "standard", name: "Class", width: "10%" },
    { key: "subjects", name: "subjects" },
    // { key: "medium", name: "medium", width: "10%" },
    // { key: "total_designs", name: "Designs", width: "10%" },
    { key: "status", name: "Status", width: "10%" },
    { key: "created_at", name: "Created by", width: "20%" },
  ];

  // -------------------------- Reactive Statements --------------------------
  $: notification = $notificationStore;
  $: subjectsData = data?.subjectsData.error ? [] : data?.subjectsData.data;
  $: mediumsData = data?.mediumsData.error ? [] : data?.mediumsData.data;
  $: filterOptions = [
    // {
    //   filterName: "Date Range",
    //   filterType: "date-range",
    //   min: "2023-01-01",
    //   max: new Date().toISOString().split("T")[0],
    // },
    // {
    //   filterName: "Medium",
    //   filterValue: mediumsData,
    // },
    {
      filterName: "Subject",
      filterValue: subjectsData,
    },
  ];

  // Dynamically set actionConfigObject based on permissions and active tab
  $: actionConfigObject = [
    permissions.details && {
      actionName: "View",
      icon: Eye,
      modal: false,
      size: 18,
    },
    permissions.edit && {
      actionName: "Edit",
      icon: PencilLine,
      modal: false,
      size: 18,
    },
    permissions.delete && deleteEnabledExams.includes(activeTab) && {
      actionName: "Delete",
      icon: Trash,
      modal: true,
      size: 18,
    },
  ].filter(Boolean);

  // ----------------------------- Table Related Functions ----------------------------------

  function formatTableData(quiz) {
    if (!quiz || !Array.isArray(quiz)) return [];

    return quiz.map((quiz) => ({
      ...quiz,
       created_at: quiz?.created_at
        ? new Date(
            quiz.created_at.endsWith("Z")
              ? quiz.created_at
              : quiz.created_at + "Z"
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

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;

    const action = actionName?.toLowerCase()?.trim();

   if (action === "delete") {
      selectedQuiz = actionData;
      showDeleteModal = true;
    } else if (action === "view") {
      goto(`/exams/${actionData?.exam_code}/details`);
    }
  }

  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    // Update page size if it changed
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
      // When page size changes, reset to page 1
      fetchExams(1, newPageSize, searchValue, filters, true);
      return;
    }

    // Fetch new data with current search and filters
    fetchExams(page, pageSize, searchValue, filters);
  }

  // ------------------------- Paginated API call for master data --------------------------

  async function fetchExams(
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
      const apiPage = page;
      const queryParams = [];

      // Add pagination
      queryParams.push(`page=${apiPage}`);
      queryParams.push(`page_size=${size}`);
      //  By default add this filter always. ( closed or draft )
      queryParams.push(`status=${encodeURIComponent(activeTab)}`);

      //   // Add filters
      if (filters && Object.keys(filters)?.length > 0) {
        for (const key of Object.keys(filters)) {
          const filter = filters[key];

          // Handle date range filter
          if (key === "Date Range" && filter?.startDate && filter?.endDate) {
            queryParams.push(
              `start_date=${encodeURIComponent(filter.startDate)}`
            );
            queryParams.push(`end_date=${encodeURIComponent(filter.endDate)}`);
          }

          if (
            key?.toLocaleLowerCase().trim() === "subject" &&
            filter?.subject_name &&
            filter?.standard
          ) {
            queryParams.push(
              `subject_code=${encodeURIComponent(filter.subject_code || filter.subject_name)}`
            );
            queryParams.push(`standard=${encodeURIComponent(filter.standard)}`);
          }

          if (key?.toLocaleLowerCase().trim() === "medium") {
            queryParams.push(`medium=${encodeURIComponent(filter.name)}`);
          }
        }
      }

      // Add search param if provided
      if (searchValue && searchValue.trim()) {
        queryParams.push(`exam_name=${encodeURIComponent(searchValue.trim())}`);
      }

      const url = `apis/v2/exams?${queryParams.join("&")}`;

      const response = await apiClient(url);

      if (!response || !response.ok) {
        throw new Error(`Status: ${response?.status || "Unknown error"}`);
      }

      const responseData = await response.json();
  
      // Set the total number of items
      totalItems = responseData?.total || 0;
      // Convert 0-based page to 1-based for UI
      currentPage = page;
      const newTableData = formatTableData(responseData?.data);

      tableData = newTableData.map((item) => ({
        ...item,
        subjects: Array.isArray(item.subjects)
          ? item.subjects.join(", ")
          : item.subjects,
        status: item.status === "completed" ? "Conducted" : item.status,
      }));

      // Handle empty results
      if (tableData.length === 0 && totalItems === 0) {
        if (searchValue || Object.keys(filters)?.length > 0) {
          apiError = "No results found for your criteria.";
        } else {
          apiError = "No data available.";
        }
      } else {
        apiError = null;
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      apiError = `Failed to load quizzes: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }

  // --------------------------- Filter Related Functions ---------------------------------
  function handleTabChange(tabValue) {
    if (activeTab !== tabValue) {
      activeTab = tabValue;
      fetchExams(1, pageSize, searchValue, filters, true);
    }
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
      // if there is a search value, it should be at least 3 characters long
      if (searchValue && searchValue?.length < 3) return;
      fetchExams(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};
    // Fetch data with new filters (reset to page 1)
    fetchExams(1, pageSize, searchValue, filters, true);
  }

  function handleClearFilter() {
    filters = {};

    // Fetch data with new filters (reset to page 1)
    fetchExams(1, pageSize, searchValue, filters, true);
  }

  // ---------------------------- Add Quizz ----------------------------------------------
  function handleAddQuiz() {
    selectedQuiz = null;
    // showModal = true;
    goto("/exams/create");
  }

  // ------------------------ Delete Quiz --------------------------------------------
  async function handleDeleteSuccess(event) {
    const { message } = event.detail;

    // Refresh the table data
    await fetchExams(currentPage, pageSize, searchValue, filters);

    // Show success message using notification store
    notificationStore.set({ type: "success", message });

    // Close the modal
    showDeleteModal = false;
    selectedQuiz = null;
  }

  // ------------------------------------- Life Cycle Functions --------------------------------

  onMount(() => {
    if (browser) {
      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.roleCode === "super_admin") {
            permissions = {
              add: true,
              // edit: true,
              details: true,
              delete: true,
            };
          } else if (user.roleCode === "admin") {
            permissions = {
              add: true,
              // edit: true,
              details: true,
              delete: true,
            };
          } else if (user.roleCode === "admin_user") {
            permissions = {
              add: true,
              // edit: true,
              details: true,
              delete: true,
            };
          } else if (user.roleCode === "block_admin") {
            permissions = {
              add: true,
              // edit: true,
              details: true,
              delete: false,
            };
          } else {
            permissions = {
              add: true,
              // edit: false,
              details: true,
              delete: false,
            };
          }
        } else {
          permissions = {
            add: false,
            edit: false,
            details: false,
            delete: false,
          };
        }
      });
      permissions = { ...permissions };

      activeTab = "completed";
      fetchExams(1, pageSize, searchValue, filters, true);

      return () => {
        unsubscribe();
      };
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    clearNotification();
  });

  // ------------------------------- General Functions ----------------------------------
</script>

<div class="mb-6">
  <h1 class="heading-L">Exam Management</h1>

  {#if notification && notification.type === "success" && notification.message}
    <div class="mt-4">
      <InlineNotification
        kind="success"
        title={notification.message}
        on:close={() => clearNotification()}
      />
    </div>
  {/if}
</div>

<!-- --------------------------- SEARCH AND ACTION BUTTONS ---------------------------------->

<div class="mb-5 flex gap-2 md:flex-nowrap flex-wrap">
  <SearchBar
    on:handleSearchValue={handleSearchValue}
    placeholder={"Search by exam title (min 3 characters)"}
    showSearchButton={false}
  />
  <div class="flex justify-end gap-2">
    {#if permissions?.add}
      <Button on:click={handleAddQuiz}><PlusIcon /> Exam</Button>
    {/if}
    {#if Number(filterOptions?.length) > 0}
      <FilterComponent
        on:filterApplied={handleFilterApplied}
        on:allFiltersCleared={handleClearFilter}
        {filterOptions}
      >
        <span
          slot="btnContent"
          class="flex gap-2"
        >
          <FilterIcon /> Filters
        </span>
      </FilterComponent>
    {/if}
  </div>
</div>

{#if Number(Object.keys(filters)?.length) > 0}
  <p class="text-sm mb-6">
    Filters applied:
    {#each Object.entries(filters) as [key, value], index}
      <span>
        {key} -
        {#if key === "Date Range"}
          {value?.name ||
            `${value?.formattedStartDate} - ${value?.formattedEndDate}`}
        {:else}
          {value?.name}
        {/if}
        {index < Object.entries(filters).length - 1 ? ", " : ""}
      </span>
    {/each}
  </p>
{/if}

<!-- ------------------------------ DATA TABLE SECTION ------------------------------>

<div class="border-b border-gray-200 mb-4">
  <nav class="flex space-x-0">
    {#each quizStatuses as status}
      <button
        class="px-4 py-2 border-b-2 transition-colors {activeTab === status.value
          ? 'text-blue-600 border-blue-500 font-medium'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => handleTabChange(status.value)}
      >
        {status.name}
      </button>
    {/each}
  </nav>
</div>

<!-- Single data table that updates based on activeTab -->
{#if loading}
  <DatatableSkeleton />
{:else}
  <DataTable
    {tableData}
    tableHeadersDisplay={tableHeaders}
    {actionConfigObject}
    {searchValue}
    entriesPerPage={pageSize}
    showPagination={true}
    tableStyle="primary"
    notFoundMessage={apiError ||
      `No ${activeTab} exams found. Please try again.`}
    headerColour={"bg-gradient-to-r from-blue-50 to-indigo-50"}
    bulkSelect={false}
    {customRenderers}
    serverSidePagination={true}
    apiCurrentPage={currentPage}
    apiTotalItems={totalItems}
    apiPageSize={pageSize}
    on:pageChange={handlePageChange}
    on:tableActionClick={handleTableAction}
  />
{/if}

{#if apiError}
  <!-- Refresh Button -->
  <div class="flex justify-center items-center mt-4">
    <Button
      on:click={() => fetchExams(currentPage, pageSize, searchValue, filters)}
      disabled={loading}
    >
      <RefreshCw class={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      <span class="text-sm">Refresh</span>
    </Button>
  </div>
{/if}

<!--  -->
{#if showModal}
  <!-- <Portal></Portal> -->
{/if}

{#if showDeleteModal && selectedQuiz}
  <QuizDeletionModal
    item={selectedQuiz}
    deletionUrl={`/apis/v2/exams/${selectedQuiz.exam_code}`}
    itemType="exam"
    on:success={handleDeleteSuccess}
    on:cancel={() => {
      showDeleteModal = false;
      selectedQuiz = null;
    }}
  />
{/if}
