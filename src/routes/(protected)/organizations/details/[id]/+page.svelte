<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import OrganizationDetailsCard from "$lib/components/reusable/OrganizationDetailsCard.svelte";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";  
  import { Pencil, Trash2, Plus, Eye } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import ErrorMessage from "$lib/components/reusable/ErrorMessage.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import BlockDeletion from "$lib/components/blocks/BlockDeletion.svelte";
  import { organizationNotification, showOrganizationNotification, hideOrganizationNotification  } from "../../organizationStore.js";
  import BlockForm from "$lib/components/blocks/BlockForm.svelte";
  

  import { authStore } from "$lib/stores/authStore.js";
  import { apiClient } from "$lib/utils/apiClient.js";
  
  // Access data from page.js load function
  export let data;

  let preventStoreReset = false ; 
  // Extract organization and initial blocks from the data
  const organization = data.organization;
  let blocks = data.blocks || [];
  $: statesList = data.states.error ? [] : data.states ; 

  // State variables
  let loading = false;
  let searchValue = "";
  let error = null;
  let currentPage = 1;
  let pageSize = 10;
  let totalPages = 1;
  let totalItems = blocks.length;
  let filters = {};
  let searchTimeout;
  let successMessage = "";
  const SEARCH_DEBOUNCE_MS = 500;
  let loadingCreate = false;
  let loadingUpdate = false;
  let loadingDelete = false;

  let permissions = {
    addOrgAdmin: false,
    addOrgUser: false,
    edit: false,
    delete: false,
    regionDelete: false,
    regionAdd: false,
    regionEdit: false,
    regionDetails: false,
  };

  // Stats variables - Move filtering logic out of the markup
  $: activeBlocks =
    organization?.blocks?.filter((block) => block.is_active)?.length || 0;
  $: inactiveBlocks = (organization?.blocks?.length || 0) - activeBlocks;
  $: blockActivePercentage = organization?.blocks?.length
    ? (activeBlocks / organization.blocks.length) * 100
    : 0;

  $: activeSchools =
    organization?.schools?.filter((school) => school.is_active)?.length || 0;
  $: inactiveSchools = (organization?.schools?.length || 0) - activeSchools;
  $: schoolActivePercentage = organization?.schools?.length
    ? (activeSchools / organization.schools.length) * 100
    : 0;

  $: successMessage = $page.url.searchParams.get("success") || "";

  // Modal states
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedBlock = null;
  let deleteConfirmText = "";
  // Form initialization - update to use uuid
  let formData = {
    block_code: "",
    block_name: "",
    block_description: "",
    organization_id: organization?.uuid, // Changed from id to uuid
    is_active: true,
  };

  // Table configuration
  const tableHeaders = [
    { key: "block_code", name: "Code", width: "15%" },
    { key: "block_name", name: "Name", width: "25%" },
    { key: "block_description", name: "Description", width: "35%" },
     { key: "state", name: "State", width: "15%" },
    { key: "is_active", name: "Status", width: "10%" },
    { key: "updated_at", name: "Updated On", width: "15%" },
    // { key: 'actions', na me: 'Actions', width: '15%' }
  ];

  // Create custom renderers
const customRenderers = {
  is_active: (data) => {
    return data.is_active
      ? '<span class="px-2 py-1 text-green-800 bg-green-100 rounded-full text-xs font-medium">Active</span>'
      : '<span class="px-2 py-1 text-red-800 bg-red-100 rounded-full text-xs font-medium">Inactive</span>';
  },
  state: (data) => {
    // Check if we have state_name directly in the block data
    if (data.state_name) {
      return `<span>${data.state_name}</span>`;
    } 
    // Check if we have state_id with numeric id
    else if (data.state_id) {
      // Find state by ID from statesList
      const state = statesList.find(s => s.id === data.state_id || s.uuid === data.state_id);
      return state ? `<span>${state.state_name}</span>` : `<span>${data.state_id}</span>`;
    }
    // If no state information
    else {
      return '<span class="text-gray-400">-</span>';
    }
  },
    updated_at: (data) => {
    if (!data.updated_at) return '<span class="text-gray-400">-</span>';
    
    // Parse the ISO date string
    const date = new Date(data.updated_at);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '<span class="text-gray-400">-</span>';
    
    // Format date as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Return formatted date and time
    return `<span>${day}/${month}/${year}, ${hours}:${minutes}</span>`;
  },

  actions: () => "",
};

  // Action configuration
  const actionConfig = [
    {
      actionName: "view",
      icon: Eye,
      modal: false,
    },
    {
      actionName: "edit",
      icon: Pencil,
      modal: true,
    },
    {
      actionName: "delete",
      icon: Trash2,
      modal: true,
    },
  ];

  
  // // state variables 
  // let stateData = {} ; 
  // let stateList = 
  // // Load states 
  // async function loadStates() { 
  //   try {
  //     const url = '/apis/states/' ; 
  //     const response = await fetch(url) ; 
  //     if(!response) { 
  //        throw new Error(`Failed to fetch states: ${response.status}`);
  //     }
  //     stateData = await response.json() ; 
  //     console.log('states',stateData) ; 
      
  //   } catch (error) {
  //     console.error("Error loading states:", err);
  //     error = err.message;      
  //   }
  // }

  // Load blocks with search and filters
  async function loadBlocks(
    page = 1,
    size = 10,
    search = "",
    appliedFilters = {},
    resetPagination = false
  ) {
    // if (!browser || !organization) {
    //   // Don't try to load blocks if organization is null
    //   error = "Cannot load regions: Organization data is not available";
    //   loading = false;
    //   return;
    // }
    if(!browser || !organization) { 
      showOrganizationNotification(
        "error",
        "Cannot load regions: Organization data is not available"
      )
      loading = false ; 
      return ; 
    }

    // Reset page for new search/filter
    if (resetPagination) {
      page = 1;
      currentPage = 1;
    }

    loading = true;
    error = null;

    try {
      // Create query params
      const queryParams = [];

      // Add organization_id to filter by organization - use uuid now
      queryParams.push(`organization_uuid=${organization.uuid}`); // Changed from id to uuid

      // Add pagination params
      queryParams.push(`page=${page}`);
      queryParams.push(`page_size=${size}`);

      // Add search parameter if provided
      if (search && search.trim()) {
        const normalizedSearch = search.trim().replace(/\s+/g, "_");
        if (normalizedSearch.length >= 3) {
          queryParams.push(
            `block_name=${encodeURIComponent(normalizedSearch)}`
          );
        } else {
          return;
        }
      }

      // Always include inactive blocks
      queryParams.push(`include_inactive=true`);

      // Add status filter if present
      if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        for (const key of Object.keys(appliedFilters)) {
          const filter = appliedFilters[key];

          if (key === "Status" && filter?.value) {
            queryParams.push(`is_active=${filter.value}`);
          }
        }
      }

      // Build URL
      const url = `/apis/blocks?${queryParams.join("&")}`;

      const response = await apiClient(url);
          if (!response || !response.ok) {
              if(response === null){
                throw new Error("Failed to fetch regions. Please try again.");
              }
              throw new Error(`Status: ${response?.status}`);
            }

      const responseData = await response.json();
      
      blocks = responseData.data || [];
      totalItems = responseData.total || 0;
      totalPages = Math.ceil(responseData.total / responseData.page_size) || 1;
      currentPage = responseData.page || 1;
      pageSize = responseData.page_size || 10;

      // Handle empty results
      if (blocks.length === 0 && totalItems === 0) {
        if (search || Object.keys(appliedFilters).length > 0) {
          error = "No results found for your criteria.";
        } else {
          error = null;
        }
      } else {
        error = null;
      }
    } catch (err) {
      console.error("Error loading regions:", err);
      error = err.message;
      blocks = [];
    } finally {
      loading = false;
    }
  }

  // Handle search with debounce
  function handleSearch(e) {
    const newSearchValue = e?.detail || "";

    searchValue = newSearchValue;

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search API call
    searchTimeout = setTimeout(() => {
      loadBlocks(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Handle filter application
  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};

    // Fetch data with new filters (reset to page 1)
    loadBlocks(1, pageSize, searchValue, filters, true);
  }

  // Handle pagination
  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    // Update page size if it changed
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
    }

    // Fetch new data with current search and filters
    loadBlocks(page, pageSize, searchValue, filters);
  }

  // Table action handler
  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;

    if (actionName === "view") {
      // Navigate to block details page using uuid
      goto(`/regions/${actionData.uuid}/details`); // Changed from id to uuid
    } else if (actionName === "edit") {
      handleEdit(actionData);
    } else if (actionName === "delete") {
      handleDelete(actionData);
    }
  }

  // CRUD Operations
  let successAction = null;

  // Update the handleEdit function to use uuid
  async function handleEdit(block) {
    selectedBlock = block;
    formData = {
      block_code: block.block_code,
      block_name: block.block_name,
      block_description: block.block_description,
      organization_uuid: organization.uuid,
      is_active: block.is_active,
    };
    showEditModal = true;
  }

  

  async function handleDelete(block) {
    selectedBlock = block;
    showDeleteModal = true;
  }

  
  function handleSuccess(event) {
    const { message } = event.detail;
    // successMessage = message;
    showOrganizationNotification(
      "success",
      message
    )
  }

  function handleDeletionSuccess(event) {
    const deletedBlock = event.detail.block.uuid;
    const deletedBlockName = event.detail.block.block_name
    // Remove the deleted block from the local array
    blocks = blocks.filter((block) => block.uuid !== deletedBlock);

    showDeleteModal = false;
    selectedBlock = null;
    
    // Show success message
    successMessage = `Region "${deletedBlockName}" deleted successfully`;
    showOrganizationNotification(
      "success",
      successMessage
    )

    // Update total items count
    totalItems = blocks.length;
    totalPages = Math.ceil(totalItems / pageSize);

    // If current page is now empty and it's not the first page, go to previous page
    if (currentPage > 1 && (currentPage - 1) * pageSize >= blocks.length) {
      currentPage--;
    }
    // loadBlocks(currentPage, pageSize, searchValue, filters);
    blocks = [...blocks];
  }

//   afterNavigate(() => {
//   hideOrganizationNotification();
// });

  function handleCancel() {
    formData = {
      block_code: "",
      block_name: "",
      block_description: "",
      organization_id: organization.uuid,
      is_active: true,
    };
    showAddModal = false;
  }

  // Filter options
  let filterOptions = [
    {
      filterName: "Status",
      filterValue: [
        { id: "1", name: "Active", value: "true" },
        { id: "2", name: "Inactive", value: "false" },
      ],
    },
  ];
 

  onMount(() => {
    if (browser) {
      if (!organization) {
        error = "Organization data is not available";
        return;
      }

      // Use existing blocks from data or load from API
      if (blocks.length > 0) {
        totalItems = blocks.length;
        totalPages = Math.ceil(totalItems / pageSize);
      } else {
        loadBlocks(currentPage, pageSize, searchValue, filters);
      }
      
      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.roleCode === "super_admin") {
            permissions = {
              addOrgAdmin: true,
              addOrgUser: true,
              edit: true,
              delete: true,
              regionDelete: true,
              regionAdd: true,
              regionEdit: true,
              regionDetails: true,
            };
          } else if (user.roleCode === "admin") {
            permissions = {
              addOrgAdmin: true,
              addOrgUser: true,
              edit: true,
              delete: false,
              regionDelete: true,
              regionAdd: true,
              regionEdit: true,
              regionDetails: true,
            };
          } else {
            permissions = {
              addOrgAdmin: false,
              addOrgUser: false,
              edit: false,
              delete: false,
              regionDelete: false,
              regionAdd: false,
              regionEdit: false,
              regionDetails: false,
            };
          }
        } else {
          permissions = {
            addOrgAdmin: false,
            addOrgUser: false,
            edit: false,
            regionDelete: false,
            regionAdd: false,
            regionEdit: false,
            regionDetails: false,
          };
        }
      });
      // return () => unsubscribe();
    }
    // loadStates() ; 
    permissions = { ...permissions };
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

     hideOrganizationNotification() ; 
    
  });
</script>

<div class="space-y-8">
  {#if $organizationNotification.visible}
    
    <div class = "mb-4" >
      <InlineNotification
      kind={$organizationNotification.type}
      title={$organizationNotification.message}
      on:close={hideOrganizationNotification}      
      hideCloseButton={false}
      >
      <svelte:fragment slot="subtitle">
        {#if $organizationNotification.action}
         <a
          class="text-green-800 text-sm underline hover:text-green-900 font-medium ml-2"
          href="/users/add?{$organizationNotification.action.queryParams}"         
        >
          {$organizationNotification.action.text}
        </a>
        {/if}
        </svelte:fragment>
      </InlineNotification>
    </div>
  {/if}

  {#if data.error}
    <div
      class="bg-white shadow rounded-lg p-6 min-h-40 flex items-center justify-center"
    >
      <ErrorMessage
        error={data.error || "Failed to load organization details."}
      />
    </div>
  {:else}
    <!-- Using OrganizationDetailsCard instead of BlockDetailsCard to maintain functionality -->
    <OrganizationDetailsCard
      {organization}
      on:success={handleSuccess}
      on:organizationDeleted={e=> showOrganizationNotification('success',e.detail)}
      {permissions}
    />

    <hr class="text-dark-gray mt-2 mb-6" />

    <!-- Blocks Table Section -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-base font-medium mb-4">
        Regions of <span>{organization.org_name}</span>
        <span class="text-sm">{totalItems ? `(${totalItems})` : ""}</span>
      </h2>

      <!-- Search and Filter Tools -->
      <div class="mb-4 flex gap-2 flex-wrap lg:flex-nowrap items-start">
        <SearchBar
          on:handleSearchValue={handleSearch}
          placeholder="Search Regions..."
          showSearchButton={false}
        />
        <div class="flex justify-between items-center mb-4">
          <Button
            btnType="primary"
            on:click={() => (showAddModal = true)}
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Region
          </Button>
        </div>
      </div>

      <!-- Applied Filters Display -->
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

      <!-- Data Table -->
      {#if loading}
        <DatatableSkeleton />
      {:else}
        <DataTable
          tableData={blocks}
          tableHeadersDisplay={tableHeaders}
          actionConfigObject={actionConfig}
          {customRenderers}
          entriesPerPage={pageSize}
          showPagination={true}
          tableStyle="primary"
          notFoundMessage={error || "No Regions found for this organization"}
          bulkSelect={false}
          headerColour={"bg-gradient-to-r from-blue-50 to-indigo-50"}
          on:pageChange={handlePageChange}
          on:tableActionClick={handleTableAction}
          serverSidePagination={true}
          apiCurrentPage={currentPage}
          apiTotalItems={totalItems}
          apiPageSize={pageSize}
        />
      {/if}
    </div>
  {/if}

  <!-- Add Block Modal -->
  {#if showAddModal}
    <Portal>
      <div class="fixed inset-0 flex items-center justify-center z-50">
        <div
          class="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[95vh] overflow-y-auto mx-4"
        >
          <BlockForm
            mode="add"
            loading={loadingCreate}
            {statesList}
            orgs={[{ id: organization?.uuid, name: organization?.org_name }]}
            orgId={organization?.uuid}
            orgName={organization?.org_name}
            on:success={(event) => {
              const { result } = event.detail;

              // add the block to local array to do caching
              blocks = [result, ...blocks];

              // Reset form data and close modal
              formData = {
                block_code: "",
                block_name: "",
                block_description: "",
                organization_id: organization.uuid,
                is_active: true,
              };
              showAddModal = false;
              const currentPath = $page.url.pathname;
              // Show success message with action button
              // successMessage = `Region "${result.block_name}" created successfully`;
              // successAction = {
              //   text: "Add Region Admin",
              //   handler: () =>
              //     goto(
              //       `/users/add?role=block_admin&org_id=${encodeURIComponent(organization.uuid)}&block_id=${encodeURIComponent(result.uuid)}&preset=true&from=${encodeURIComponent(currentPath)}`
              //     ),
              // };
              showOrganizationNotification(
                "success",
                `Successfully created region ${result.block_name}`, 
                {
                  text : "+ Add Region Admin",
                  queryParams: `role=block_admin&org_id=${encodeURIComponent(organization.uuid)}&block_id=${encodeURIComponent(result.uuid)}&preset=true&from=${encodeURIComponent(currentPath)}&nt=org`
                }
              )

              // Update total items count
              totalItems = blocks.length;
              totalPages = Math.ceil(totalItems / pageSize);
            }}
            on:cancel={handleCancel}
          />
        </div>
      </div>
    </Portal>
  {/if}

  <!-- Edit Block Modal -->
  {#if showEditModal}
    <Portal>
      <div class="fixed inset-0 flex items-center justify-center z-50">
        <div
          class="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[95vh] overflow-y-auto mx-4"
        >
          <BlockForm
            mode="edit"
            existingBlock={selectedBlock}
            {statesList}
            orgId={selectedBlock?.organization?.uuid}
            orgName={selectedBlock?.organization?.org_name}
            loading={loadingUpdate}
            orgs={[{ id: organization?.uuid, name: organization?.org_name }]}
            on:success={(event) => {
              const { result } = event.detail;

              // Update the block in the local array
              blocks = blocks.map((block) =>
                block.uuid === result.uuid ? result : block
              );

              // Close modal
              showEditModal = false;              
              showOrganizationNotification(
                "success", 
                `Region ${result.block_name} updated successfully`
              )              
            }}
            on:cancel={() => (showEditModal = false)}
          />
        </div>
      </div>
    </Portal>
  {/if}

  <!-- Delete Block Modal -->
  {#if showDeleteModal && selectedBlock}
    <Portal>
      <div
        class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
      >
        <BlockDeletion
          block={selectedBlock}
          on:success={handleDeletionSuccess}
          on:cancel={() => {
            showDeleteModal = false;
            selectedBlock = null;
          }}
        />
      </div>
    </Portal>
  {/if}
</div>
