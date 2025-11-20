<script>
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { USER_ROLES } from "$lib/constants.js";
  import {
    message,
    showAddAdminBtn,
    addAdminBtnText,
    msgType,
  } from "/src/routes/(protected)/schools/schoolStore.js";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import FilterComponent from "$lib/components/reusable/FilterComponent.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import SchoolDeletion from "$lib/components/schools/SchoolDeletion.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Eye from "@lucide/svelte/icons/eye";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash from "@lucide/svelte/icons/trash";
  import { authStore } from "$lib/stores/authStore.js";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let data;

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let grandTotal = 0;

  let apiError = null;
  let loading = true;
  let tableData = [];
  let searchValue = "";
  let filters = {};
  let filterOptions = [
    { filterName: "Organization", filterValue: [] },
    { filterName: "State", filterValue: [] },
    { filterName: "Region", filterValue: [] },
    { filterName: "Board", filterValue: [] },
    { filterName: "Udise Code", filterValue: [] },
  ];
  let orgOptions = [];
  let blockOptions = [];
  let stateOptions = [];
  let boardOptions = [];
  let udiseOptions = [];

  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  let showModal = false;
  let formMode = "add";
  let selectedSchool = null;
  let showDeleteModal = false;

  let filterDependenciesVar = {};

  $: activeFilters = filterOptions.filter((f) => filters[f.filterName]);

  // Table Configuration
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

  const tableHeaders = [
    { key: "udise_code", name: "Code", width: "5%" },
    { key: "school_name", name: "Name", width: "20%" },
    { key: "organization", name: "Organization", width: "15%" },
    { key: "state", name: "State", width: "15%" },
    { key: "block", name: "Region", width: "15%" },
    { key: "boards", name: "Boards", width: "10%" },
    { key: "is_active", name: "Status", width: "10%" },
    { key: "updated_at", name: "Updated On", width: "15%" },
  ];

  // ---------------------------Table Related Function ------------------------------------------------
  // Format table data
  function formatTableData(schools) {
    if (!schools || !Array.isArray(schools)) return [];
    return schools.map((school) => ({
      ...school,
      organization: school?.organization?.org_name || "-",
      created_by:
        USER_ROLES[school?.created_by]?.role_name || school?.created_by || "-",
      block: school?.block?.block_name || "-",
      orgId: school?.organization?.uuid || "-",
      blockId: school?.block?.uuid || "-",
      state:
        stateOptions?.filter(
          (s) => String(s.id) === String(school?.state_id)
        )[0]?.name || "-",
      boards:
        Array.isArray(school?.boards) && school?.boards.length > 0
          ? school.boards
              .map(
                (bid) =>
                  boardOptions.find((b) => String(b.id) === String(bid))
                    ?.name || String(bid)
              )
              .join(", ")
          : "-",
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
      formMode = "edit";
      goto(`/schools/${selectedSchool?.uuid}/edit?from=/schools`);
    } else if (action === "delete") {
      selectedSchool = actionData;
      showDeleteModal = true;
    } else if (action === "view") {
      goto(`/schools/${actionData?.uuid}/details`);
    }
  }

  // Handle pagination
  function handlePageChange({ detail: { page, pageSize: newPageSize } }) {
    // If page size is changing
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
      currentPage = 1; // Reset to first page when changing page size
      fetchSchools(1, newPageSize, searchValue, filters);
      return;
    }

    // If just navigating pages
    if (page !== currentPage) {
      currentPage = page;
      fetchSchools(currentPage, pageSize, searchValue, filters);
    }
  }

  // -------------------------- API Call for School Master data --------------------------------------
  // Fetch schools master data
  async function fetchSchools(
    page = 1,
    size = 10,
    searchValue = "",
    filters = {},
    resetPagination = false
  ) {
    if (!browser) return;

    // Reset to page 1 (for search/filter)
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
      queryParams.push(`include_inactive=true`);

      // Add search param if provided
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

      // Add filter params
      if (filters.Organization) {
        queryParams.push(`organization_uuid=${filters.Organization.value}`);
      }
      if (filters.State) {
        queryParams.push(`state_id=${filters.State.value}`);
      }
      if (filters.Region) {
        queryParams.push(`block_uuid=${filters.Region.value}`);
      }
      if (filters.Board) {
        queryParams.push(`board_id=${filters.Board.value}`);
      }
      if (filters["Udise Code"]) {
        queryParams.push(`udise_code=${filters["Udise Code"].value}`);
      }

      const url = `/apis/schools?${queryParams.join("&")}`;

      const response = await apiClient(url);
      if (!response || !response.ok) throw new Error("Failed to fetch schools");

      const result = await response.json();
      tableData = formatTableData(result?.data || []);
      totalItems = result?.total || 0;
      grandTotal = result?.grandTotal || null;

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
      console.error("Error fetching schools:", error);
      apiError = `Failed to load schools: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }
  // ---------------------------- Filters -------------------------------------

  // Helper to update filterOptions based on current option arrays
  function updateFilterOptions() {
    filterOptions = [
      { filterName: "Organization", filterValue: orgOptions },
      { filterName: "State", filterValue: stateOptions },
      { filterName: "Region", filterValue: blockOptions },
      { filterName: "Board", filterValue: boardOptions },
      { filterName: "Udise Code", filterValue: udiseOptions },
    ];
  }

  // Fetch organizations and blocks (regions)
  async function fetchOrgsAndBlocks() {
    try {
      let page = 1;
      let size = 50;
      let totalPages = 1;
      let orgs = [];
      let blocks = [];

      // Fetch organizations
      while (page <= totalPages) {
        const res = await apiClient(
          `/apis/orgs?page=${page}&page_size=${size}&include_inactive=true`
        );
        if (!res || !res.ok) throw new Error(`Failed to fetch orgs: page - ${page}`);
        const data = await res.json();
        if (!data) throw new Error("Unexpected API response");
        orgs.push(
          ...data.data.map((org) => ({
            id: String(org.uuid),
            name: org.org_name,
            value: org.uuid,
          }))
        );
        totalPages = Math.ceil(data.total / data.page_size);
        page++;
      }
      orgOptions = orgs;

      // Fetch all blocks
      page = 1;
      totalPages = 1;
      while (page <= totalPages) {
        const res = await apiClient(
          `/apis/blocks?page=${page}&page_size=${size}&include_inactive=true`
        );
        if (!res || !res.ok) throw new Error(`Failed to fetch blocks: page - ${page}`);
        const data = await res.json();
        if (!data) throw new Error("Unexpected API response");
        blocks.push(
          ...data?.data?.map((block) => ({
            id: String(block.uuid),
            name: block.block_name,
            value: block.uuid,
            orgId: block?.organization?.uuid
              ? String(block.organization.uuid)
              : null,
            stateId: block?.state_id ? String(block.state_id) : null,
          }))
        );
        totalPages = Math.ceil(data.total / data.page_size);
        page++;
      }

      blockOptions = blocks;
      updateFilterOptions();
    } catch (err) {
      console.error("Error fetching orgs/blocks:", err.message);
    }
  }

  // Fetch states
  async function fetchStates() {
    try {
      const statesRes = await apiClient(`/apis/states`);
      if (statesRes && statesRes?.ok) {
        const statesData = await statesRes.json();
        stateOptions =
          statesData?.data?.map((state) => ({
            id: String(state.id),
            name: state.state_name,
            value: String(state.id),
          })) || [];
        updateFilterOptions();
      }
    } catch (err) {
      console.error("Error fetching states:", err.message);
    }
  }

  // Fetch boards
  async function fetchBoards() {
    try {
      const boardsRes = await apiClient(`/apis/boards`);
      if (boardsRes && boardsRes?.ok) {
        const boardsData = await boardsRes.json();
        boardOptions =
          boardsData?.map((board) => ({
            id: String(board?.board_id),
            name: board.board_name,
            value: board?.board_id,
          })) || [];
        updateFilterOptions();
      }
    } catch (err) {
      console.error("Error fetching boards:", err.message);
    }
  }

  // Fetch udise codes
  async function fetchUdiseCodes() {
    try {
      const res = await apiClient(`/apis/schools/codes`);
      if (!res || !res.ok) return;
      const data = await res.json();
      // data.data is an array of { uuid, school_name, udise_code }
      udiseOptions =
        data?.data?.map((item) => ({
          id: String(item.udise_code),
          name: item.udise_code,
          value: item.udise_code,
        })) || [];
      updateFilterOptions();
    } catch (err) {
      console.error("Error fetching udise codes:", err.message);
    }
  }

  // Handle search
  function handleSearchValue(e) {
    const newSearchValue = e?.detail || "";
    searchValue = newSearchValue;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchSchools(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Handle filter changes to update dependent filters
  async function handleFilterChange(event) {
    const { category, selectedItem, tempSelectedFilters } = event.detail;

    // ORGANIZATION -> STATE
    if (category === "Organization") {
      const orgId = selectedItem?.id;
      // Filter blocks for this org
      const orgBlocks = blockOptions.filter((block) => block.orgId === orgId);

      const uniqueStateIds = [
        ...new Set(orgBlocks.map((block) => block.stateId).filter(Boolean)),
      ];

      const filteredStates = stateOptions.filter((state) =>
        uniqueStateIds.includes(state.id)
      );
      const stateFilterIndex = filterOptions.findIndex(
        (opt) => opt.filterName === "State"
      );
      if (stateFilterIndex !== -1) {
        filterOptions[stateFilterIndex] = {
          filterName: "State",
          filterValue: filteredStates,
        };
      }
      // Reset region
      const idx = filterOptions.findIndex((opt) => opt.filterName === "Region");
      if (idx !== -1)
        filterOptions[idx] = { filterName: "Region", filterValue: [] };
      filterOptions = [...filterOptions];
    }

    // STATE -> REGION
    if (category === "State") {
      const stateId = selectedItem?.id;
      const orgId = tempSelectedFilters?.Organization?.id || $authStore?.orgId;

      // Filter regions for this state and organization
      const filteredBlocks = blockOptions.filter(
        (block) =>
          String(block.stateId) === String(stateId) && block.orgId === orgId
      );

      const regionFilterIndex = filterOptions.findIndex(
        (opt) => opt.filterName === "Region"
      );
      if (regionFilterIndex !== -1) {
        filterOptions[regionFilterIndex] = {
          filterName: "Region",
          filterValue: filteredBlocks,
        };
      }
      filterOptions = [...filterOptions];
    }
  }

  function handleClearAllFilters() {
    let dependentFilterArray = [];
    if ($authStore?.roleCode?.toLowerCase()?.trim() === "super_admin") {
      dependentFilterArray = ["State", "Region"];
    } else {
      dependentFilterArray = ["Region"];
    }

    dependentFilterArray.forEach((fname) => {
      const idx = filterOptions.findIndex((opt) => opt.filterName === fname);
      if (idx !== -1)
        filterOptions[idx] = { filterName: fname, filterValue: [] };
    });
    filterOptions = [...filterOptions];
  }

  // Handle filter application
  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};

    currentPage = 1;
    // Fetch data with new filters (reset to page 1)
    fetchSchools(1, pageSize, searchValue, filters, true);
  }

  // ------------------------ Add/Edit/Delete Schools ------------------------------

  // Add new school
  function handleAddSchool() {
    formMode = "add";
    selectedSchool = null;
    showModal = true;
    goto("/schools/add?from=/schools");
  }

  async function handleDeletionSuccess(event) {
    const { message: deleteMessage } = event.detail;
    // await fetchSchools(currentPage, pageSize, searchValue, filters);

    if (selectedSchool) {
      tableData = tableData.filter((item) => item.uuid !== selectedSchool.uuid);
      totalItems -= 1;
      grandTotal -=1;
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

    // Update store with deletion message
    message.set(deleteMessage);
    showAddAdminBtn.set(false);
    msgType.set("success");

    showDeleteModal = false;
    selectedSchool = null;
  }

  // ----------------------- Role Basded Access Control ------------------------------

  function setupFiltersForRole(user) {
    if (!user) return;

    let role = user?.role || user?.roleCode || "";
    role = role.toLowerCase().trim();

    let orgs = orgOptions;
    let states = stateOptions;
    let regions = blockOptions;
    let boards = boardOptions;
    let udiseCodes = udiseOptions;

    filters = {};
    let newFilterOptions = [];

    if (role === "super_admin") {
      // Show all filters
      newFilterOptions = [
        { filterName: "Organization", filterValue: orgs },
        { filterName: "State", filterValue: states },
        { filterName: "Region", filterValue: regions },
        { filterName: "Board", filterValue: boards },
        { filterName: "Udise Code", filterValue: udiseCodes },
      ];
      filterDependenciesVar = {
        State: "Organization",
        Region: "State",
      };
    } else if (role === "admin" || role === "admin_user") {
      // Only show State, Region, Board, Udise Code, and pre-filter by orgId

      const orgId = user?.orgId || user?.organization_uuid;

      // Filter blocks for this orgId
      let filteredBlocks = [];
      if (orgId) {
        filteredBlocks = blockOptions.filter(
          (block) => block.orgId === String(orgId)
        );
      } else {
        filteredBlocks = blockOptions;
      }

      // Get unique stateIds from these blocks
      const uniqueStateIds = Array.from(
        new Set(
          (filteredBlocks || [])
            .map((block) => block?.stateId) // safely access stateId
            .filter((id) => id !== null && id !== undefined && id !== "") // remove falsy IDs
            .map((id) => String(id).trim()) // normalize to string
        )
      );

      const states = (stateOptions || []).filter((state) => {
        const stateId = String(state?.id ?? "").trim(); // normalize to string
        return stateId !== "" && uniqueStateIds.includes(stateId);
      });

      regions = filteredBlocks;

      newFilterOptions = [
        { filterName: "State", filterValue: states },
        { filterName: "Region", filterValue: regions },
        { filterName: "Board", filterValue: boards },
        { filterName: "Udise Code", filterValue: udiseCodes },
      ];
      if (orgId) {
        filters.Organization = orgs.find((o) => o.id === String(orgId));
      }
      filterDependenciesVar = {
        Region: "State",
      };
    } else if (role === "block_admin") {
      // Only show Board and Udise Code, and pre-filter by orgId, stateId, blockId
      const orgId = user?.orgId || user?.organization_uuid;
      const stateId = user?.stateId || user?.state_id;
      const blockId = user?.blockId || user?.block_id;
      newFilterOptions = [
        { filterName: "Board", filterValue: boards },
        { filterName: "Udise Code", filterValue: udiseCodes },
      ];
      if (orgId)
        filters.Organization = orgs.find((o) => o.id === String(orgId));
      if (stateId) filters.State = states.find((s) => s.id === String(stateId));
      if (blockId)
        filters.Region = regions.find((r) => r.id === String(blockId));
      filterDependenciesVar = {};
    } else {
      // Default: show all filters
      newFilterOptions = [
        { filterName: "Organization", filterValue: orgs },
        { filterName: "State", filterValue: states },
        { filterName: "Region", filterValue: regions },
        { filterName: "Board", filterValue: boards },
        { filterName: "Udise Code", filterValue: udiseCodes },
      ];
      filterDependenciesVar = {
        State: "Organization",
        Region: "State",
      };
    }

    filterOptions = [...newFilterOptions];
  }

  // ----------------------------------- Lifecycle Functions---------------------
  onMount(async () => {
    if (browser) {
      loading = true;
      await fetchStates();
      await fetchOrgsAndBlocks();
      await fetchBoards();
      await fetchUdiseCodes();

      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          setupFiltersForRole(user);
        }
        return () => unsubscribe();
      });

      // Use initial data if available, otherwise fetch from API
      if (data?.schools && !data.schools.error) {
        const { schools } = data;
        tableData = formatTableData(schools?.data || []);
        totalItems = schools?.total || 0;
        grandTotal = schools?.grandTotal || null;
        currentPage = 1;
        loading = false;
      } else {
        fetchSchools(currentPage, pageSize, searchValue, filters);
      }
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    clearStore();
  });

  // ----------------------------------- General --------------------------------------
  function clearStore() {
    message.set("");
    showAddAdminBtn.set(false);
    addAdminBtnText.set("");
    msgType.set("");
  }
</script>

<div class="mb-6">
  <h1 class="heading-L">
    Schools
    <span class="text-sm sm:text-base"
      >{grandTotal ? `(${grandTotal})` : ""}</span
    >
  </h1>
  {#if $message}
    <div class="mt-4">
      <InlineNotification
        kind={$msgType}
        title={$message}
        on:close={() => clearStore()}
      >
      <!-- School doesnt have admins as of now -->
        <svelte:fragment slot="subtitle">
          {#if $showAddAdminBtn}
            <a
              href="/users/addUsers"
              class="text-green-800 text-sm underline hover:text-green-900 font-medium ml-2"
            >
              {$addAdminBtnText}
            </a>
          {/if}
        </svelte:fragment>
      </InlineNotification>
    </div>
  {/if}
</div>

<!-- Search and Action Buttons -->
<div class="mb-5 flex gap-2 md:flex-nowrap flex-wrap">
  <SearchBar
    on:handleSearchValue={handleSearchValue}
    placeholder={"Search by school name (min. 3 characters)"}
    showSearchButton={false}
  />
  <div class="flex justify-end gap-2">
    <FilterComponent
      on:filterApplied={handleFilterApplied}
      on:filterChanged={handleFilterChange}
      on:allFiltersCleared={handleClearAllFilters}
      {filterOptions}
      filterDependencies={filterDependenciesVar}
    >
      <span
        slot="btnContent"
        class="flex gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
    <Button
      on:click={handleAddSchool}
      btnType="primary">+ School</Button
    >
  </div>
</div>
{#if activeFilters.length > 0}
  <p class="text-sm mb-6">
    Filters applied:
    {#each activeFilters as filterOption, idx (filterOption.filterName)}
      <span>
        {filterOption.filterName} - {filters[filterOption.filterName]?.name}
        {idx < activeFilters.length - 1 ? ", " : ""}
      </span>
    {/each}
  </p>
{/if}

<!-- Data Table -->
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

{#if apiError}
  <!-- Refresh Button -->
  <div class="flex justify-center items-center mt-4">
    <Button
      on:click={() => fetchSchools(currentPage, pageSize, searchValue, filters)}
      disabled={loading}
    >
      <RefreshCw class={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      <span class="text-sm">Refresh</span>
    </Button>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedSchool}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
    >
      <SchoolDeletion
        school={selectedSchool}
        on:success={handleDeletionSuccess}
        on:cancel={() => {
          showDeleteModal = false;
          selectedSchool = null;
        }}
      />
    </div>
  </Portal>
{/if}
