<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";

  import { Pencil, Trash2, Plus, Eye } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { page } from "$app/stores";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import OrganizationDeletion from "$lib/components/organizations/OrganizationDeletion.svelte";
  import OrganizationForm from "$lib/components/organizations/OrganizationForm.svelte";
  import { authStore } from "$lib/stores/authStore.js";
  import { organizationNotification, showOrganizationNotification,hideOrganizationNotification } from "./organizationStore.js";
  import { apiClient } from "$lib/utils/apiClient.js";

  // State management
  let organizations = [];
  let searchValue = "";
  let loading = true;
  let error = null;
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;
  let totalItems = 0;
  let pageSize = 10;
  let filters = {};
  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  // Notification state
  let notification = {
    show: false,
    kind: "info",
    title: "",
    subtitle: "",
    timeout: 5000,
  };

  

  let permissions={
    add: false,
    edit:false,
    details:false,
    delete:false
  }

  let loadingCreate = false;
  let loadingUpdate = false;
  let loadingDelete = false;

  // Modal states
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedOrg = null;
  let deleteConfirmText = "";
  let formData = {
    org_code: "",
    org_name: "",
    org_description: "",
    is_active: true,
  };

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

  // Table configuration
  const tableHeaders = [
    { key: "org_code", name: "Code", width: "20%" },
    { key: "org_name", name: "Name", width: "25%" },
    { key: "org_description", name: "Description", width: "35%" },
    { key: "is_active", name: "Status", width: "10%" },
    { key: "updated_at", name: "Updated On", width: "15%" },
    // { key: 'actions', name: 'Actions', width: '10%' }
  ];

  // Create custom renderers
  const customRenderers = {
    is_active: (data) => {
      return data.is_active
        ? '<span class="px-2 py-1 text-green-800 bg-green-100 rounded-full text-xs font-medium">Active</span>'
        : '<span class="px-2 py-1 text-red-800 bg-red-100 rounded-full text-xs font-medium">Inactive</span>';
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

  // Action configuration (built dynamically based on permissions)
  $: actionConfig = [
    permissions.details ? { actionName: "view", icon: Eye } : null,
    permissions.edit ? { actionName: "edit", icon: Pencil, modal: true } : null,
    permissions.delete ? { actionName: "delete", icon: Trash2, modal: true } : null
  ].filter(Boolean);

  // Show notification function
  function showNotification(kind, title, subtitle = "", timeout = 0) {
    notification = {
      show: true,
      kind,
      title,
      subtitle,
      timeout,
    };

    // Auto-hide after timeout if specified
    if (timeout > 0) {
      setTimeout(() => {
        notification.show = false;
      }, timeout);
    }
  }

  // Hide notification function
  // function hideNotification() {
  //   notification.show = false;
  // }


  // Load organizations with search, sort and filter - using uploadHistory approach
  async function loadOrganizations(
    page = 1,
    size = 10,
    search = "",
    appliedFilters = {},
    resetPagination = false
  ) {
    if (!browser) return;

    // Reset page for new search/filter
    if (resetPagination) {
      page = 1;
      currentPage = 1;
    }

    loading = true;
    error = null;

    try {
      //  query params array like in uploadHistory
      const queryParams = [];
      let requestPage = page;

      // if(totalPages>1){
      //   requestPage = totalPages-page+1 ;
      // }

      // Add pagination params
      queryParams.push(`page=${page}`);
      queryParams.push(`page_size=${size}`);

      // Add search parameter 
   if (search && search.trim()) {
      queryParams.push(`org_name=${encodeURIComponent(search.trim())}`);
    }

      // Always include inactive organizations
      queryParams.push(`include_inactive=true`);

      // Add status filter if present - IMPORTANT CHANGE
      if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        for (const key of Object.keys(appliedFilters)) {
          const filter = appliedFilters[key];

          if (key === "Status" && filter?.value) {
            // Use is_active filter directly rather than include_inactive
            queryParams.push(`is_active=${filter.value}`);
          }
        }
      }

      // Build URL with query string (like uploadHistory does)
      const url = `apis/organizations?${queryParams.join("&")}`;

      const response = await apiClient(url);
   if (!response || !response.ok) {
        if(response === null){
          throw new Error("Failed to fetch organizations. Please try again.");
        }
        throw new Error(`Status: ${response?.status}`);
      }


      const responseData = await response.json();

      organizations = responseData.data || [];
      totalItems = responseData.total || 0;
      totalPages = Math.ceil(responseData.total / responseData.page_size) || 1;
      currentPage = responseData.page || 1;
      pageSize = responseData.page_size || 10;

      // Handle empty results
      if (organizations.length === 0 && totalItems === 0) {
        if (search || Object.keys(appliedFilters).length > 0) {
          error = "No results found for your criteria.";
        } else {
          error = "No organizations available.";
        }
      } else {
        error = null;
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
      error = err.message;
      organizations = [];
      
      showOrganizationNotification("error",`Failed to load organizations ${err.message}`)
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

    // Debounce search API call - match uploadHistory exactly
    searchTimeout = setTimeout(() => {
      loadOrganizations(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Handle filter application
  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};

    // Fetch data with new filters (reset to page 1)
    loadOrganizations(1, pageSize, searchValue, filters, true);
  }

  // Handle pagination
  function handlePageChange(event) {
    if (!event?.detail) return;

    const { page, pageSize: newPageSize } = event.detail;

    // update current page

    currentPage = page;

    // Update page size if it changed
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
    }

    // Fetch new data with current search and filters
    loadOrganizations(page, pageSize, searchValue, filters);
  }

  // Table action handler - update to use uuid instead of id
  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;

    if (actionName === "edit") {
      handleEdit(actionData);
    } else if (actionName === "delete") {
      handleDelete(actionData);
    } else if (actionName === "view") {
      // Navigate to organization details using uuid
      goto(`/organizations/details/${actionData.uuid}`);
    }
  }

 

  async function handleEdit(org) {
    selectedOrg = org;
    formData = { ...org };
    showEditModal = true;
  }


  async function handleDelete(org) {
    selectedOrg = org;
    showDeleteModal = true;
  }
  //
  function handleDeleteSuccess(event) {
    const deletedOrg = event.detail.organization;

    // Update the local array by filtering out the deleted organization
    organizations = organizations.filter((org) => org.uuid !== deletedOrg.uuid);

    showDeleteModal = false;
    showOrganizationNotification(
      'success',      
      `Successfully deleted ${deletedOrg.org_name}.`,
    ) 
    

    // If the current page is now empty and it's not the first page, go to the previous page
    if (organizations.length === 0 && currentPage > 1) {
      currentPage -= 1;
      // loadOrganizations(currentPage, pageSize, searchValue, filters);
    }
  }

  

  onMount(() => {
    if (browser) {
      const successMsg = $page.url.searchParams.get("success");
      if (successMsg) {
        showNotification("success", successMsg);
        const url = new URL(window.location);
        window.history.replaceState({}, "", url);
      }

      loadOrganizations(currentPage, pageSize, searchValue, filters);

      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.roleCode === "super_admin") {
            permissions = {
              add: true,
              edit: true,
              details: true,
              delete: true
            };
          } else if (user.roleCode === "admin") {
            permissions = {
              add: false,
              edit: true,
              details: true,
              delete: false
            };
          } else {
            permissions = {
              add: false,
              edit: false,
              details: false,
              delete: false
            };
          }
        } else {
          permissions = {
            add: false,
            edit: false,
            details: false,
            delete: false
          };
        }
      });
      permissions={...permissions}
      
      return () => unsubscribe();
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    hideOrganizationNotification() ; 
  });
  
</script>


<div class="container mx-auto">

  <!-- Notification -->
  <!-- {#if notification.show}
    <div class="mb-4">
      <InlineNotification
        kind={notification.kind}
        title={notification.title}
        subtitle={notification.subtitle}
        action={notification.action}
        on:close={hideNotification}
        on:action={hideNotification}
        hideCloseButton={false}
      />
    </div>
  {/if} -->

  <!-- Notification using store  -->
{#if $organizationNotification.visible}
  <div class="mb-4">
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
  href="/users/add?{$organizationNotification.action.queryParams}&nt=org"
>
          { $organizationNotification.action.text }

</a>
    {/if}
    </svelte:fragment>
  </InlineNotification>
  </div>
{/if}
  <!-- Header -->


  <div class="mb-6">
    <h1 class="heading-L">
      Organizations
      <span class="text-sm sm:text-base"
        >{totalItems ? `(${totalItems})` : ""}</span
      >
    </h1>
  </div>

  <!-- Search, Filter and Add Button in the same line -->
  <div class="mb-4 flex gap-2 flex-wrap lg:flex-nowrap items-start">
    <SearchBar
      on:handleSearchValue={handleSearch}
      placeholder="Search organizations..."
      showSearchButton={false}
    />
    {#if permissions.add}
    <Button
      btnType="primary"
      on:click={() => (showAddModal = true)}
    >
      <Plus class="w-4 h-4 mr-2" />
      Organization
    </Button>
    {/if}
    <!-- Removing filter component till the apis are deployed for it -->
    <!-- <div class="flex gap-2">
      {#if Number(Object.keys(filterOptions)?.length) > 0}
        <FilterComponent
          on:filterApplied={handleFilterApplied}
          {filterOptions}
        >
          <span slot="btnContent" class="flex gap-2">
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
            ><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters
          </span>
        </FilterComponent>
      {/if}
     
    </div> -->
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
      tableData={organizations}
      tableHeadersDisplay={tableHeaders}
      actionConfigObject={actionConfig}
      {customRenderers}
      entriesPerPage={pageSize}
      showPagination={true}
      tableStyle="primary"
      notFoundMessage={error || "No organizations found"}
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

  <!-- Add Modal -->
  {#if showAddModal}
    <Portal>
      <div class="fixed inset-0 flex items-center justify-center z-50">
        <OrganizationForm
          mode="add"
          loading={loadingCreate}
          on:success={(event) => {
            const { result } = event.detail;
            // Store org name and ID before closing
            const orgName = result.org_name;
            const orgId = result.uuid;
            const returnPath = "/organizations";
            // Reset form data and close modal
            formData = {
              org_code: "",
              org_name: "",
              org_description: "",
              is_active: true,
            };
            showAddModal = false;
            showOrganizationNotification(
              "success",
              `Successfully created organization ${orgName}`,
              {
                text : "+ Add Organization Admin", 
                queryParams : `role=admin&org_id=${encodeURIComponent(orgId)}&preset=true&from=${encodeURIComponent(returnPath)}`
              }
            );

            // Reload organizations
            loadOrganizations(currentPage, pageSize, searchValue, filters);
          }}
          on:cancel={() => (showAddModal = false)}
        />
      </div>
    </Portal>
  {/if}
  <!-- Edit Modal -->
  {#if showEditModal}
    <Portal>
      <div class="fixed inset-0 flex items-center justify-center z-50">
        <OrganizationForm
          mode="edit"
          existingOrganization={selectedOrg}
          loading={loadingUpdate}
          on:success={(event) => {
            const { result } = event.detail;

            // Update local data
            organizations = organizations.map((org) =>
              org.uuid === result.uuid ? result : org
            );

            // Close modal
            showEditModal = false;

            // Show notification
            showOrganizationNotification(
              "success",              
              `Successfully updated details of ${result.org_name} `
            )
          }}
          on:cancel={() => (showEditModal = false)}
        />
      </div>
    </Portal>
  {/if}

  <!-- Delete Modal -->
  {#if showDeleteModal && selectedOrg}
    <Portal>
      <div
        class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
      >
        <OrganizationDeletion
          organization={selectedOrg}
          on:success={handleDeleteSuccess}
          on:cancel={() => {
            showDeleteModal = false;
          }}
        />
      </div>
    </Portal>
  {/if}
</div>


