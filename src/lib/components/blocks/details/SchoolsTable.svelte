<script>
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { USER_ROLES } from "$lib/constants.js";
  import {
    message as regionMessage,
    showAddAdminBtn as regionShowAddAdminBtn,
    msgType as regionMsgType,
  } from "/src/routes/(protected)/regions/regionStore.js";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import SchoolDeletion from "$lib/components/schools/SchoolDeletion.svelte";
  import Eye from "@lucide/svelte/icons/eye";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash from "@lucide/svelte/icons/trash";
  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let blockId;
  export let orgId;
  export let blockName = "";
  export let stateId = null;
  export let orgName = ''

  const dispatch = createEventDispatcher();

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let loading = true;

  let tableData = [];
  let searchValue = "";
  let apiError = null;

  let showSchoolModal = false;
  let showDeleteModal = false;
  let formMode = null;
  let selectedSchool = null;

  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  let actionConfigObject = [
    {
      actionName: "View",
      icon: Eye,
      size: 18,
    },
    {
      actionName: "Edit",
      icon: PencilLine,
      size: 18,
    },
    {
      actionName: "Delete",
      icon: Trash,
      size: 18,
    },
  ];

  const tableHeaders = [
    { key: "udise_code", name: "Code", width: "20%" },
    { key: "school_name", name: "Name", width: "20%" },
    // { key: "school_description", name: "Description", width: "25%" },
    // { key: "organization", name: "Organization", width: "20%" },
    // { key: "block", name: "Region", width: "15%" },
    { key: "is_active", name: "Status", width: "20%" },
    // { key: "created_by", name: "Created By", width: "15%" },
    { key: "updated_at", name: "Updated On", width: "20%" },
  ];

  let customRenderers = {
    is_active: (data) => {
      const status = data?.is_active;
      const base =
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
      const statusClass = {
        true: "bg-green-100 text-green-800 lowercase",
        false: "bg-red-100 text-red-800 lowercase",
      };
      return `<span class="${base} ${statusClass[status] || "bg-gray-100 text-gray-800 lowercase"}">${status === true ? "Active" : "Inactive" || "-"}</span>`;
    },
  };

  // ---------------------------------- Table Related Functions ----------------------

  function formatTableData(schools) {
    if (!schools || !Array.isArray(schools)) return [];

    return schools.map((school) => ({
      ...school,
      created_by:
        USER_ROLES[school?.created_by]?.role_name || school?.created_by || "-",
      block: school?.block?.block_name || "-",
      organization: school?.organization?.org_name,
      updated_at: school?.updated_at
        ? new Date(
            school.updated_at.endsWith("Z")
              ? school.updated_at
              : school.updated_at + "Z"
          ).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata",
          })
        : "-",
    }));
  }

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    const action = actionName?.toLowerCase()?.trim();

    if (action === "edit") {
      selectedSchool = actionData;
      showSchoolModal = true;
      formMode = "edit";
      goto(
        `/schools/${selectedSchool?.uuid}/edit?from=/regions/${blockId}/details`
      );
    } else if (action === "delete") {
      selectedSchool = actionData;
      showDeleteModal = true;
    } else if (action === "view") {
      goto(`/schools/${actionData?.uuid}/details`);
    }
  }

  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
      fetchSchools(1, newPageSize, searchValue, true);
      return;
    }

    fetchSchools(page, pageSize, searchValue);
  }

  // ---------------------------- Fetch Schools data -----------------------------------

  async function fetchSchools(
    page = 1,
    size = 10,
    searchValue = "",
    resetPagination = false
  ) {
    if (!browser) return;

    if (resetPagination) {
      page = 1;
      currentPage = 1;
    }

    loading = true;
    apiError = null;

    try {
      const queryParams = [
        `page=${page}`,
        `page_size=${size}`,
        `block_uuid=${blockId}`,
        `include_inactive=true`,
      ];

      if (searchValue?.trim()) {
        const normalizedSearch = searchValue.trim().replace(/\s+/g, "_");
        if (normalizedSearch.length >= 3) {
          queryParams.push(
            `school_name=${encodeURIComponent(normalizedSearch.trim())}`
          );
        } else {
          return;
        }
      }

      const url = `/apis/schools?${queryParams.join("&")}`;
      const response = await apiClient(url);

      if (!response || !response.ok) {
        if(response === null){
          throw new Error("");
        }
        throw new Error(`Status: ${response?.status}`);
      }

      const responseData = await response.json();

      totalItems = responseData?.total || 0;
      currentPage = page;
      tableData = formatTableData(responseData?.data || []);

      if (tableData.length === 0 && totalItems === 0) {
        apiError = searchValue
          ? "No results found for your criteria."
          : "No schools available.";
      } else {
        apiError = null;
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      apiError = `Failed to load schools: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }

  //  --------------------------- Handle Filters -----------------------------

  function handleSearchValue(e) {
    const newSearchValue = e?.detail || "";
    searchValue = newSearchValue;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      fetchSchools(1, pageSize, searchValue, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // --------------------------- Add/Edit/Delete School ----------------------------

  function handleAddSchool() {
    formMode = "add";
    selectedSchool = null;
    showSchoolModal = true;
    goto(
      `/schools/add?from=/regions/${blockId}/details&blockId=${blockId}&orgId=${orgId}&stateId=${stateId}&orgName=${orgName}`
    );
  }

  async function handleDeleteSuccess(event) {
    const { message } = event.detail;
    // await fetchSchools(currentPage, pageSize, searchValue);

    if (selectedSchool) {
      tableData = tableData.filter((item) => item.uuid !== selectedSchool.uuid);
      totalItems -= 1;
      // grandTotal -=1;
    } // Check if the current page is now empty after deletion

    // change this to garndTotal when api supports
    if (
      tableData.length === 0 &&
      totalItems > 0 &&
      !searchValue &&
      Object.keys(filters)?.length === 0
    ) {
      // If the page is empty, try to get the previous page's data
      // until the user manually navigates or refreshes.
      if (currentPage > 1) {
        let targetPage = currentPage - 1;
        await fetchSchools(targetPage, pageSize, searchValue, filters);
      } else {
        apiError = "No more items to display.";
      }
    }

    // Update block store instead of dispatching success event
    regionMessage.set(message);
    regionShowAddAdminBtn.set(false);
    regionMsgType.set("success");

    showDeleteModal = false;
    selectedSchool = null;
  }

  // ------------------------------------ Lifecycle Functions --------------------------------

  onMount(() => {
    if (browser) {
      fetchSchools(currentPage, pageSize, searchValue);
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  });
</script>

<div class=" px-6">
  <h2 class="text-base font-medium mb-4">
    Schools in {blockName || "-"}
    <span class="text-sm">{totalItems ? `(${totalItems})` : ""}</span>
  </h2>

  <!-- Search and Action Bar -->
  <div class="mb-5 flex gap-2 md:flex-nowrap flex-wrap">
    <SearchBar
      on:handleSearchValue={handleSearchValue}
      placeholder={"Search by school name (min. 3 characters)"}
      showSearchButton={false}
    />
    <div class="flex justify-end">
      <Button
        on:click={handleAddSchool}
        btnType="primary">+ School</Button
      >
    </div>
  </div>

  <!-- Schools Table -->
  <div>
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
        notFoundMessage={apiError || "No schools found. Please try again."}
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
  </div>

  {#if apiError}
    <div class="flex justify-center items-center mt-4">
      <Button
        on:click={() => fetchSchools(currentPage, pageSize, searchValue)}
        disabled={loading}
      >
        <RefreshCw class={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        <span class="text-sm">Refresh</span>
      </Button>
    </div>
  {/if}
</div>

<!-- School Delete Modal -->
{#if showDeleteModal && selectedSchool}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
    >
      <SchoolDeletion
        school={selectedSchool}
        on:success={handleDeleteSuccess}
        on:cancel={() => {
          showDeleteModal = false;
          selectedSchool = null;
        }}
      />
    </div>
  </Portal>
{/if}
