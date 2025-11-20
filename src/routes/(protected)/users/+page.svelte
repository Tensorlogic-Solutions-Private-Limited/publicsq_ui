<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import FilterComponent from "$lib/components/reusable/FilterComponent.svelte";
  import { Pencil, Trash2, Plus, Eye, Lock } from "@lucide/svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import UserDeletion from "$lib/components/Admin/UserDeletion.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { ROLES } from "$lib/utils/roles.js";
  import PasswordUpdateModal from "$lib/components/reusable/PasswordUpdateModal.svelte";
  import { userNotification, showUserNotification,hideUserNotification } from "./userStore.js";
  

  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let data;

  // USING THE ISAUTH AND ISADMIN DIRECTLY FROM THE SESSION
  $: isAuth = !!data.session?.isAuthenticated;
  $: currentUserRole = data.session?.roleCode || "";
  $: isAdmin = ["super_admin", "admin", "admin_user", "block_admin"].includes(
    currentUserRole
  );

  // State variables
  let users = [];
  let loading = true;
  let searchValue = "";
  let error = null;
  let successMessage = "";
  let currentPage = 1;
  let pageSize = 10;
  let totalPages = 1;
  let totalItems = 0;
  let filters = {};
  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  // Get any error/success messages from URL params
  $: errorMessage = $page.url.searchParams.get("error");
  $: if ($page.url.searchParams.get("userCreated") === "true") {
    const message = $page.url.searchParams.get("message");
    if (message) {
      successMessage = decodeURIComponent(message);
      clearURLParams(["userCreated", "message"]);

      // Clear success message after 5 seconds
      // setTimeout(() => {
      //   successMessage = "";
      // }, 5000);
    }
  }

  // Clear specific URL parameters
  function clearURLParams(params) {
    const url = new URL(window.location);
    params.forEach((param) => url.searchParams.delete(param));
    history.replaceState({}, "", url);
  }

  // Modal states
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedUser = null;
  let deleteConfirmText = "";
  let formData = {
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: "",
    organization_id: null,
    block_id: null,
    school_id: null,
    is_active: true,
  };

  // Password modal state
  let showPasswordModal = false;
  let passwordError = null;

  // Lookup data for dropdowns
  let roles = [];
  let organizations = [];
  let blocks = [];
  let schools = [];

  // Table configuration
  const tableHeaders = [
    { key: "username", name: "Username", width: "15%" },
    { key: "full_name", name: "Name", width: "15%" },
    { key: "email", name: "Email", width: "15%" },
    { key: "role_name", name: "Role", width: "15%" },
    { key: "organization", name: "Organization", width: "15%" },
    { key: "is_active", name: "Status", width: "10%" },
    // { key: "actions", name: "Actions", width: "15%" },
  ];

  // Create custom renderers
  const customRenderers = {
    is_active: (data) => {
      return data.is_active
        ? '<span class="px-2 py-1 text-green-800 bg-green-100 rounded-full text-xs font-medium">Active</span>'
        : '<span class="px-2 py-1 text-red-800 bg-red-100 rounded-full text-xs font-medium">Inactive</span>';
    },
    role_name: (data) => {
    // Transform Block Admin to Region Admin for display
    const displayName = data.role_name === 'Block Admin' 
      ? 'Region Admin' 
      : data.role_name;
    return displayName || '-';
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
    // {
    //   actionName: 'reset_password',
    //   icon: Lock,
    //   modal: true
    // },
    {
      actionName: "delete",
      icon: Trash2,
      modal: true,
    },
  ];

  // Load users with search and filters
  async function loadUsers(
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
      // Create query params
      const queryParams = [];

      // Add pagination params
      queryParams.push(`page=${page}`);
      queryParams.push(`per_page=${size}`);

      // Add search parameter if provided
      if (search && search.trim()) {
        queryParams.push(`search=${encodeURIComponent(search.trim())}`);
      }

      // Add filters
      if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        for (const key of Object.keys(appliedFilters)) {
          const filter = appliedFilters[key];

          if (key === "Status" && filter?.value) {
            queryParams.push(`is_active=${filter.value}`);
          }

          if (key === "Role" && filter?.value) {
            queryParams.push(`role_code=${filter.value}`);
          }

          if (key === "Organization" && filter?.value) {
            queryParams.push(`organization_id=${filter.value}`);
          }
        }
      }

      // Build URL
      const url = `/apis/users?${queryParams.join("&")}`;
      

      const response = await apiClient(url);
          if (!response || !response.ok) {
        if(response === null){
          throw new Error("Failed to fetch users. Please try again.");
        }
        throw new Error(`Status: ${response?.status}`);
      }

      const responseData = await response.json();
      

      // Format users for display
      users = responseData.users?.map(formatUser) || [];
      totalItems = responseData.total || 0;
      totalPages = responseData.total_pages || 1;
      currentPage = responseData.page || 1;

      // Handle empty results
      if (users.length === 0 && totalItems === 0) {
        if (search || Object.keys(appliedFilters).length > 0) {
          error = "No results found for your criteria.";
        } else {
          error = "No users available in the system.";
        }
      } else {
        error = null;
      }
    } catch (err) {
      console.error("Error loading users:", err);
      error = err.message;
      users = [];
    } finally {
      loading = false;
    }
  }

  // Format user data for display
  function formatUser(user) {
    return {
      id: user.uuid, // Changed from id to uuid
      username: user.username,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      is_active: user.is_active,
      role_id: user.role?.id,
      role_code: user.role?.role_code || "",
      role_name: user.role?.role_name || "",
      organization: user.organization?.org_name || "",
      organization_id: user.organization?.uuid, // Changed from id to uuid
      block: user.block?.block_name || "",
      block_id: user.block?.uuid, // Changed from id to uuid
      school: user.school?.school_name || "",
      school_id: user.school?.uuid, // Changed from id to uuid
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // Load lookup data for dropdowns
  async function loadLookupData() {
    try {
      roles = ROLES.map((role) => ({
        id: role.id,
        role_code: role.id,
        role_name: role.name,
      }));
      const orgsResponse = await apiClient("/apis/organizations");
         if (!orgsResponse || !orgsResponse.ok) {
        if(orgsResponse === null){
          throw new Error("Failed to fetch organizations. Please try again.");
        }
        throw new Error(`Status: ${orgsResponse?.status}`);
      }

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        organizations = orgsData.data || [];
      }
    } catch (err) {
      console.error("Error loading lookup data:", err);
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
      
      loadUsers(1, pageSize, searchValue, filters, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Handle filter application
  function handleFilterApplied(event) {
    if (!event?.detail) return;

    filters = event.detail.selectedFilters || {};

    // Fetch data with new filters (reset to page 1)
    loadUsers(1, pageSize, searchValue, filters, true);
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
    loadUsers(page, pageSize, searchValue, filters);
  }

  // Handle password reset
  function handlePasswordReset(user) {
    selectedUser = user;
    passwordError = null;
    showPasswordModal = true;
  }

  //  function to handle password update events from the PasswordUpdateModal component

  async function handlePasswordUpdate(event) {
    const { userId, password } = event.detail;

    try {
      

      const response = await fetch(`/apis/users/${userId}/password`, {
        method: "PATCH", // Changed from PATCH to PUT to match server implementation
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: password,
        }),
      });

      // First get the response as text
      const responseText = await response.text();
      

      if (!response.ok) {
        // Try to parse as JSON if possible, otherwise use the string directly
        let errorMessage = "Failed to update password";
        try {
          if (responseText.trim().startsWith("{")) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || "Failed to update password";
          } else {
            errorMessage = responseText || "Failed to update password";
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: Failed to update password`;
        }

        throw new Error(errorMessage);
      }

      // If response is OK, try to parse as JSON, but handle plain text too
      let passwordUpdateMessage = "Password updated successfully";
      try {
        if (responseText.trim().startsWith("{")) {
          const successData = JSON.parse(responseText);
          passwordUpdateMessage =
            successData.message ||
            `Password for ${selectedUser.username} updated successfully!`;
        } else if (responseText.trim()) {
          passwordUpdateMessage = responseText;
        }
      } catch (e) {
        // If parsing fails, use default success message
        console.log(
          "Could not parse success response as JSON, using default message"
        );
      }

      // Show success message (use a different variable name to avoid shadowing)
      successMessage = passwordUpdateMessage;
      // setTimeout(() => {
      //   successMessage = "";
      // }, 5000);

      showPasswordModal = false;
      passwordError = null;
    } catch (err) {
      console.error("Error updating password:", err);
      passwordError = err.message;
    }
  }

  // Table action handler
  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;

    

    if (actionName === "view") {
      // Navigate to user details page
      goto(`/users/details/${actionData.id}`);
    } else if (actionName === "edit") {
      // Redirect to edit page instead of showing modal

      goto(`/users/edit/${actionData.id}?nt=user`);
    } else if (actionName === "delete") {
      handleDelete(actionData);
    } else if (actionName === "reset_password") {
      handlePasswordReset(actionData);
    }
  }

 

  // CRUD Operations
  function handleAddUser() {
    
    goto('/users/add?nt=user') ;
  }

 
  async function handleDelete(user) {
    selectedUser = user;
    showDeleteModal = true;
  }

  //  function to handle the success of deletion
    function handleDeleteSuccess(event) {
    const { user, message } = event.detail;
    
    // Update local users array by filtering out the deleted user
    users = users.filter(u => u.id !== user.id);
    
    // Show success message
    successMessage = event.detail.message;
    
    showUserNotification(
      'success',
      successMessage
    )
    
    // Close the modal
    showDeleteModal = false;
    selectedUser = null;
    
    // Don't call loadUsers() here - we've already updated the array
  }
  
  // Function to handle error from UserDeletion component
  function handleDeleteError(event) {
    error = event.detail;
    
    // Show as inline notification
    errorMessage = event.detail;
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
    {
      filterName: "Role",
      filterValue: [],
    },
    // {
    //   filterName: "Organization",
    //   filterValue: [],
    // }
  ];

  // Update role filter options
  $: filterOptions = filterOptions.map((filter) => {
    if (filter.filterName === "Role") {
      return {
        ...filter,
        filterValue: roles.map((role) => ({
          id: role.id.toString(),
          name: role.role_name,
          value: role.role_code,
        })),
      };
    }
    if (filter.filterName === "Organization") {
      return {
        ...filter,
        filterValue: organizations.map((org) => ({
          id: org.uuid.toString(),
          name: org.org_name,
          value: org.uuid.toString(),
        })),
      };
    }
    return filter;
  });

  // Update to check for userUpdated from URL on mount
  onMount(async () => {
    if (browser && isAuth) {
      // Check for user updated status from URL
      const userUpdated = $page.url.searchParams.get('userUpdated');
      const message = $page.url.searchParams.get('message');
      
      if (userUpdated === 'true' && message) {
        successMessage = decodeURIComponent(message);
        
        // Clean URL parameters without page reload
        const url = new URL(window.location);
        url.searchParams.delete('userUpdated');
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url);
        
        // If we have updated user data in URL, update it locally
        const updatedUserData = $page.url.searchParams.get('userData');
        if (updatedUserData) {
          try {
            const updatedUser = JSON.parse(decodeURIComponent(updatedUserData));
            // Update the user in the local array
            users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
            url.searchParams.delete('userData');
            window.history.replaceState({}, '', url);
          } catch (e) {
            console.error("Error parsing updated user data:", e);
          }
        }
      }

     const successMsg = $page.url.searchParams.get('success');
    if (successMsg) {
      successMessage = decodeURIComponent(successMsg);
      
      // Clean up the URL without reloading the page
      const url = new URL(window.location);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url);
      
      // Set timeout to clear message
      // setTimeout(() => {
      //   successMessage = "";
      // }, 5000);
    }
      
      // Load lookup data first
      await loadLookupData();

      // Then load users
      loadUsers(currentPage, pageSize, searchValue, filters);
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    hideUserNotification() ; 

  });
</script>

<main class="min-h-screen bg-gray-50">  
    <!-- Notification using store  -->
{#if $userNotification.visible}
  <div class="mb-4">
    <InlineNotification
      kind={$userNotification.type}
      title={$userNotification.message}
      on:close={hideUserNotification}      
      hideCloseButton={false}
    >
  </InlineNotification>
  </div>
{/if}

  {#if isAuth}
    {#if isAdmin}
      <div class="w-full">
        <div class="mb-6">
          <h1 class="heading-L">
            Users
            <span class="text-sm sm:text-base"
              >{totalItems ? `(${totalItems})` : ""}</span
            >
          </h1>
        </div>

        
        <div class="bg-white shadow rounded-lg">
          <!-- Search, Filter and Add Button -->
          <div class="p-4 border-b border-gray-200">
            <div class="mb-4 flex gap-2 flex-wrap lg:flex-nowrap items-start">
              <SearchBar
                on:handleSearchValue={handleSearch}
                placeholder="Search users by name, email or username..."
                showSearchButton={false}
              />
              

              <div class="flex gap-2">
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
                        ><polygon
                          points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
                        ></polygon></svg
                      >
                      Filters
                    </span>
                  </FilterComponent>
                {/if}
              </div>
              <Button btnType="primary" on:click={handleAddUser}>
                <Plus class="w-4 h-4 mr-2" />
                User
              </Button>
            </div>

            <!-- Applied Filters Display -->
            {#if Number(Object.keys(filters)?.length) > 0}
              <p class="text-sm">
                Filters applied:
                {#each Object.entries(filters) as [key, value], index}
                  <span
                    >{key} - {value?.name}{index <
                    Object.entries(filters).length - 1
                      ? ", "
                      : ""}</span
                  >
                {/each}
              </p>
            {/if}
          </div>

          <!-- Data Table -->
          <div>
            {#if loading}
              <DatatableSkeleton />
            {:else}
              <DataTable
                tableData={users}
                tableHeadersDisplay={tableHeaders}
                actionConfigObject={actionConfig}
                {customRenderers}
                entriesPerPage={pageSize}
                showPagination={true}
                tableStyle="primary"
                notFoundMessage={error || "No users found"}
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
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h1 class="text-2xl font-bold text-gray-900 mt-4">
            Admin Access Required
          </h1>
          <p class="text-gray-600 mt-2">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    {/if}
  {:else}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">Please log in</h1>
        <p class="text-gray-600 mt-2">
          Authentication required to access this page.
        </p>
      </div>
    </div>
  {/if}
</main>

<!-- Delete Modal with Portal -->
{#if showDeleteModal && selectedUser}
  <Portal>
    <div class="bg-neutral-100 rounded-lg p-6  shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll">
      <UserDeletion
        user={selectedUser}
        on:success={handleDeleteSuccess}
        on:error={handleDeleteError}
        on:cancel={() => {
          showDeleteModal = false;
          selectedUser = null;
        }}
      />
    </div>
  </Portal>
{/if}

<!-- Password Update Modal -->
<PasswordUpdateModal
  isOpen={showPasswordModal}
  username={selectedUser?.username || ""}
  userId={selectedUser?.id}
  error={passwordError}
  on:update={handlePasswordUpdate}
  on:error={(e) => (passwordError = e.detail)}
  on:close={() => {
    showPasswordModal = false;
    passwordError = null;
  }}
/>
