<script>
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import FilterComponent from "$lib/components/reusable/FilterComponent.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import BlockForm from "$lib/components/blocks/BlockForm.svelte";
  import BlockDeletion from "$lib/components/blocks/BlockDeletion.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Eye from "@lucide/svelte/icons/eye";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash from "@lucide/svelte/icons/trash";
  import { USER_ROLES } from "$lib/constants.js";
  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/utils/apiClient.js";
  import {
    message as regionMessage,
    showAddAdminBtn as regionShowAddAdminBtn,
    addAdminBtnText as regionAddAdminBtnText,
    addAdminBtnQueryParams,
  } from "/src/routes/(protected)/regions/regionStore.js";
  import {
    Funnel,
    PlusIcon,
    PencilLine,
    FunnelIcon,
  } from "@lucide/svelte/icons";
  import { authStore } from "$lib/stores/authStore.js";

  export let data;

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let loading = true;

  let tableData = [];
  let searchValue = "";
  let apiError = null;
  let filters = {};
  let filterOptions = [];
  let filterComponent = null;

  let showModal = false;
  let formMode = null;
  let selectedBlock = null;
  let showDeleteModal = false;

  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  let permissions = {
    add: false,
    edit: false,
    details: false,
    delete: false,
    showFilters: false,
  };

  $: statesList = data.states.error ? [] : data.states;
  // -------------------------------------------------------------------------
  // TABLE CONFIGURATION
  // -------------------------------------------------------------------------

  // Dynamically set actionConfigObject based on permissions
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
      modal: true,
      size: 18,
    },
    permissions.delete && {
      actionName: "Delete",
      icon: Trash,
      modal: true,
      size: 18,
    },
  ].filter(Boolean);

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
    { key: "block_code", name: "Code", width: "20%" },
    { key: "block_name", name: "Name", width: "20%" },
    // { key: "block_description", name: "Description", width: "25%" },
    { key: "organization", name: "Organization", width: "20%" },
    { key: "state", name: "State", width: "15%" },
    { key: "is_active", name: "Status", width: "10%" },
    // { key: "created_by", name: "Created By", width: "10%" },
    // { key: "updated_by", name: "Updated By", width: "15%" },
    { key: "updated_at", name: "Updated On", width: "15%" },
  ];

  // ----------------------------- Table Related Functions ----------------------------------
  function formatTableData(blocks) {
    if (!blocks || !Array.isArray(blocks)) return [];

    return blocks.map((block) => ({
      ...block,
      created_by:
        USER_ROLES[block?.created_by]?.role_name || block?.created_by || "-",
      updated_by:
        USER_ROLES[block?.updated_by]?.role_name || block?.updated_by || "-",
      organization: block?.organization?.org_name || "-",
      state: block?.state_name || "-",
      updated_at: block?.updated_at
        ? new Date(
            block.updated_at.endsWith("Z")
              ? block.updated_at
              : block.updated_at + "Z"
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

  async function handleFormSuccess(event) {
    const { result, mode } = event.detail;

    // Update block store based on mode
    if (mode === "add") {
      currentPage = 1;
      searchValue = "";
      filters = {};
      if (filterComponent && filterComponent.clearFilterFromParent) {
        filterComponent.clearFilterFromParent();
      }
      await fetchBlocks(1, pageSize, searchValue, filters);
      regionMessage.set(`Successfully created region '${result?.block_name}'`);
      regionShowAddAdminBtn.set(true);
      regionAddAdminBtnText.set("+ Add Region Admin");
      addAdminBtnQueryParams.set(
        `role=block_admin&org_id=${result?.organization.uuid}&block_id=${result?.uuid}&preset=true&from=/regions`
      );
    } else {
      const formattedBlock = formatTableData([result])[0];
      const index = tableData.findIndex((item) => item.uuid === result.uuid);
      if (index !== -1) {
        tableData[index] = formattedBlock;
        tableData = [...tableData];
      } else {
        await fetchBlocks(currentPage, pageSize, searchValue, filters);
      }

      regionMessage.set(
        `Successfully updated details of '${result?.block_name}'`
      );
      regionShowAddAdminBtn.set(false);
    }

    // Close the modal
    showModal = false;
    formMode = mode;
    selectedBlock = mode === "add" ? result : null;
  }

  async function handleDeleteSuccess(event) {
    const { message } = event.detail;

    if (selectedBlock) {
      tableData = tableData.filter((item) => item.uuid !== selectedBlock.uuid);
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
        await fetchBlocks(targetPage, pageSize, searchValue, filters);
      } else {
        apiError = "No more items to display.";
      }
    }

    // Update block store
    regionMessage.set(message);
    regionShowAddAdminBtn.set(false);

    // Close the modal
    showDeleteModal = false;
    selectedBlock = null;
  }

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;

    const action = actionName?.toLowerCase()?.trim();

    if (action === "edit") {
      selectedBlock = actionData;
      showModal = true;
      formMode = "edit";
    } else if (action === "delete") {
      selectedBlock = actionData;
      showDeleteModal = true;
    } else if (action === "view") {
      goto(`/regions/${actionData?.uuid}/details`);
    }
  }

  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    // Update page size if it changed
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
      // When page size changes, reset to page 1
      fetchBlocks(1, newPageSize, searchValue, filters, true);
      return;
    }

    // Fetch new data with current search and filters
    fetchBlocks(page, pageSize, searchValue, filters);
  }

  // ------------------------- Paginated API call for master data --------------------------

  async function fetchBlocks(
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
      queryParams.push(`include_inactive=true`);

      // Add search param if provided
      if (searchValue && searchValue.trim()) {
        const normalizedSearch = searchValue.trim().replace(/\s+/g, "_");
        if (normalizedSearch.length >= 3) {
          queryParams.push(
            `block_name=${encodeURIComponent(normalizedSearch)}`
          );
        } else {
          return;
        }
      }

      // Add filters
      if (filters && Object.keys(filters)?.length > 0) {
        for (const key of Object.keys(filters)) {
          const filter = filters[key];

          if (
            key?.toLocaleLowerCase().trim() === "organization" &&
            filter?.value
          ) {
            queryParams.push(
              `organization_uuid=${encodeURIComponent(filter.value)}`
            );
          }

          // if (key === "Status" && filter?.value) {
          //   queryParams.push(`status=${encodeURIComponent(filter.value)}`);
          // }
        }
      }

      const url = `apis/blocks?${queryParams.join("&")}`;

      const response = await apiClient(url);

      if (!response || !response.ok) {
        if(response === null){
          throw new Error("");
        }
        throw new Error(`Status: ${response?.status}`);
      }

      const responseData = await response.json();

      // Set the total number of items
      totalItems = responseData?.total || 0;
      // Convert 0-based page to 1-based for UI
      currentPage = page;
      tableData = formatTableData(responseData?.data || []);

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
      console.error("Error fetching regions:", error);
      apiError = `Failed to load regions: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }

  // --------------------------- Filter Related Functions ---------------------------------

  function handleSearchValue(e) {
    const newSearchValue = e?.detail || "";
    searchValue = newSearchValue;

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search API call
    searchTimeout = setTimeout(() => {
      fetchBlocks(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};
    console.log("filters", filters);
    // Fetch data with new filters (reset to page 1)
    fetchBlocks(1, pageSize, searchValue, filters, true);
  }

  function handleClearFilter() {
    filters = {};

    // Fetch data with new filters (reset to page 1)
    fetchBlocks(1, pageSize, searchValue, filters, true);
  }

  async function fetchOrgs() {
    let page = 1;
    let size = 50;
    let totalPages = 1;
    let orgs = [];

    try {
      while (page <= totalPages) {
        const res = await apiClient(`/apis/orgs?page=${page}&page_size=${size}`);

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

      // Only add if we actually have data
      if (orgs.length > 0) {
        filterOptions.push({
          filterName: "Organization",
          filterValue: orgs,
        });
      }
      filterOptions = filterOptions;
    } catch (err) {
      console.error("Error fetching orgs:", err.message);
    }
  }
  // ---------------------------- Add Block ----------------------------------------------
  function handleAddBlock() {
    formMode = "add";
    selectedBlock = null;
    showModal = true;
  }

  // ------------------------------------- Life Cycle Functions --------------------------------

  onMount(() => {
    if (browser) {
      loading = true;
      // Use initial data if available, otherwise fetch from API
      if (data?.blocks && !data.blocks.error) {
        const { blocks } = data;
        tableData = formatTableData(blocks?.data || []);
        totalItems = blocks?.total || 0;
        currentPage = 1; // Start at page 1
        loading = false;
      } else {
        // Fetch data from API
        fetchBlocks(currentPage, pageSize, searchValue, filters);
      }

      fetchOrgs();

      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.roleCode === "super_admin") {
            permissions = {
              add: true,
              edit: true,
              details: true,
              delete: true,
              showFilters: true,
            };
          } else if (user.roleCode === "admin") {
            permissions = {
              add: true,
              edit: true,
              details: true,
              delete: true,
              showFilters: false,
            };
          } else if (user.roleCode === "admin_user") {
            permissions = {
              add: true,
              edit: true,
              details: true,
              delete: true,
              showFilters: false,
            };
          } else if (user.roleCode === "block_admin") {
            permissions = {
              add: false,
              edit: true,
              details: true,
              delete: false,
              showFilters: false,
            };
          } else {
            permissions = {
              add: false,
              edit: false,
              details: false,
              delete: false,
              showFilters: false,
            };
          }
        } else {
          permissions = {
            add: false,
            edit: false,
            details: false,
            delete: false,
            showFilters: false,
          };
        }
      });
      permissions = { ...permissions };

      return () => unsubscribe();
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    clearStore();
  });

  // ----------------------------- General ------------------------------
  function clearStore() {
    regionMessage.set("");
    regionShowAddAdminBtn.set(false);
    regionAddAdminBtnText.set("");
    addAdminBtnQueryParams.set("");
  }
</script>

<div class="mb-6">
  <h1 class="heading-L">
    Regions
    <span class="text-sm sm:text-base"
      >{totalItems ? `(${totalItems})` : ""}</span
    >
  </h1>
  {#if $regionMessage}
    <div class="mt-4">
      <InlineNotification
        kind="success"
        title={$regionMessage}
        on:close={() => clearStore()}
      >
        <svelte:fragment slot="subtitle">
          {#if $regionShowAddAdminBtn}
            <a
              href="/users/add?{$addAdminBtnQueryParams}&nt=reg"
              class="text-green-800 text-sm underline hover:text-green-900 font-medium ml-2"
            >
              {$regionAddAdminBtnText}
            </a>
          {/if}
        </svelte:fragment>
      </InlineNotification>
    </div>
  {/if}
</div>

<!-- --------------------------- SEARCH AND ACTION BUTTONS ---------------------------------->

<div class="mb-5 flex gap-2 md:flex-nowrap flex-wrap">
  <SearchBar
    on:handleSearchValue={handleSearchValue}
    placeholder={"Search by region name (min. 3 characters)"}
    showSearchButton={false}
  />
  <div class="flex justify-end gap-2">
    <!-- {#if Number(filterOptions?.length) > 0} -->
    {#if permissions.showFilters}
      <FilterComponent
        bind:this={filterComponent}
        on:filterApplied={handleFilterApplied}
        on:allFiltersCleared={handleClearFilter}
        {filterOptions}
      >
        <span slot="btnContent" class="flex gap-2 items-center">
          <FunnelIcon size={16} class="text-white" />
          Filters
        </span>
      </FilterComponent>
    {/if}
    <!-- {/if} -->
    {#if permissions?.add}
      <Button on:click={handleAddBlock} btnType="primary">
        <PlusIcon size={16} class="text-white" />
        Region</Button
      >
    {/if}
  </div>
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
      {actionConfigObject}
      {searchValue}
      entriesPerPage={pageSize}
      showPagination={true}
      tableStyle="primary"
      notFoundMessage={apiError || "No regions found. Please try again."}
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
  <!-- Refresh Button -->
  <div class="flex justify-center items-center mt-4">
    <Button
      on:click={() => fetchBlocks(currentPage, pageSize, searchValue, filters)}
      disabled={loading}
    >
      <RefreshCw class={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      <span class="text-sm">Refresh</span>
    </Button>
  </div>
{/if}

<!-- Block Form Modal -->
{#if showModal}
  <Portal>
    <div
      class="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full max-h-[95vh] mt-4 mb-4 mx-4 overflow-y-scroll"
    >
      <BlockForm
        mode={formMode}
        {statesList}
        existingBlock={selectedBlock}
        orgs={filterOptions?.find((f) => f.filterName === "Organization")
          ?.filterValue || []}
        on:success={handleFormSuccess}
        on:cancel={() => {
          showModal = false;
          selectedBlock = null;
        }}
      />
    </div>
  </Portal>
{/if}

{#if showDeleteModal && selectedBlock}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
    >
      <BlockDeletion
        block={selectedBlock}
        on:success={handleDeleteSuccess}
        on:cancel={() => {
          showDeleteModal = false;
          selectedBlock = null;
        }}
      />
    </div>
  </Portal>
{/if}
