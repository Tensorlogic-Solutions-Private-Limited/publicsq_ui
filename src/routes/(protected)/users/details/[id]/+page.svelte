<script>
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ArrowLeft, User, Mail, Phone, Calendar, Building, MapPin, School, Tag, UserCog, FileText, CircleCheck, CircleX, PencilLine } from '@lucide/svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  
  import Portal from "$lib/components/reusable/Portal.svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";
  import UserDeletion from "$lib/components/Admin/UserDeletion.svelte";
  import InfoRow from '$lib/components/reusable/InfoRow.svelte';
  import PasswordUpdateModal from '$lib/components/reusable/PasswordUpdateModal.svelte';
  import { userNotification, showUserNotification, hideUserNotification } from '../../userStore.js';
  import { apiClient } from '$lib/utils/apiClient.js';
  export let data;
  
  // Session data
  $: currentUserRole = data.session?.roleCode || '';
  $: isAdmin = ['super_admin', 'admin', 'admin_user', 'block_admin'].includes(currentUserRole);
  
  // State variables
  let loading = true;
  let error = null;
  let user = null;
  let showDeleteModal = false;
  let successMessage = "";
  let showPasswordModal = false ; 
  let blockToRegion = '' ; 
  // state variable for preventing notification at regions page 
  let nt = 'user'
  function handlePasswordChange() { 
    showPasswordModal = true ; 
  }

function handlePasswordSuccess(event) {
    const { message } = event.detail;
    // successMessage = message;
    showUserNotification('success',message) ; 
  }



  
  // Get user ID from URL parameter
  const userId = $page.params.id;
  
  // Format date function
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return dateString;
    }
  }
  
  // Load user data
  async function loadUserData() {
    loading = true;
    error = null;
    
    try {
      // Fetch user data
      const response = await apiClient(`/apis/users/${userId}`);
      
        if (!response || !response.ok) {
        if(response === null){
          throw new Error("Failed to fetch  user data. Please try again.");
        }
        throw new Error(`Status: ${response?.status}`);
      }
      
      user = await response.json();
      
      if(user.role.role_code === 'block_admin'){
        blockToRegion = 'Region Admin' ; 
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  // Go back to users list
  function goBack() {
    goto('/users');
  }

  // Handle edit button - redirect to the edit page instead of showing modal
  function handleEdit() {
    const currentPath = $page.url.pathname ; 
    goto(`/users/edit/${userId}?from=${encodeURIComponent(currentPath)}&nt=user`);
  }
  
  // Handle delete button
  function handleDelete() {
    showDeleteModal = true;
  }

  function handleDeleteSuccess(event) {
  const { user, message } = event.detail;
  
  showUserNotification(
    'success',
    message
  )
  goto(`/users`);
}

// onDestroy(() => { 
//   hideUserNotification() ; 
// })
  
  onMount(async () => {

    if (isAdmin && userId) {
      await loadUserData();
    }
  });

  // Stats items for the user
  $: statsItems = [
    { label: "Role", value: user?.role?.role_name || 'N/A' },
    { label: "Organization", value: user?.organization?.org_name || 'N/A' },
    { label: "Block", value: user?.block?.block_name || 'N/A' },
    { label: "School", value: user?.school?.school_name || 'N/A' },
  ];

  // Info items for the user
  $: infoItems = user ? [
    {
      icon: Mail,
      label: "Email",
      value: user.email || 'Not provided'
    },
    {
      icon: Phone,
      label: "Phone",
      value: user.phone || 'Not provided'
    },
    {
      icon: Tag,
      label: "Username",
      value: user.username
    },
    {
      icon: Calendar,
      label: "Created On",
      value: formatDate(user.created_at)
    },
    {
      icon: Calendar,
      label: "Last Updated",
      value: formatDate(user.updated_at)
    },
  ] : [];

</script>

<!-- <svelte:head>
  <title>User Details</title>
</svelte:head> -->

<div class="min-h-screen bg-gray-50">
  {#if isAdmin}
    <div class="w-full">
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
   

      
      <!-- Loading state -->
      {#if loading}
        <div class="flex justify-center items-center py-12">
          <LoadingSpinner size="large" message="Loading user data..." />
        </div>
      {:else if user}
        <!-- User Details Card with DetailsHeader -->
        <div class="bg-white rounded-lg shadow-sm text-dark-gray mb-8">
          <DetailsHeader
            icon={User}
            heading={user.full_name}
            code={user.username}
            description={blockToRegion || user.role.role_name}
            showEdit={true}
            showDelete={true}
            showPasswordChange={true} 
            on:passwordChange={handlePasswordChange}  
            isActive={user.is_active}
            lastUpdatedOn={formatDate(user.updated_at)}
            organizationInfo={user.organization ? { label: "Organization", value: user.organization.org_name } : null}
            blockInfo={user.block ? { label: "Block", value: user.block.block_name } : null}
            schoolInfo={user.school ? { label: "School", value: user.school.school_name } : null}
            on:edit={handleEdit}
            on:delete={handleDelete}
          >
         <!--  Information -->
  <div class="p-6">
    <!-- Additional School Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each [
        { label: 'Email', value: user.email },
        { label: 'Phone number', value: user.phone  },        
      ] as { label, value }}
        <InfoRow {label} {value} />
      {/each}
    </div>
  </div>
        </DetailsHeader>                      
        </div>
      {:else if !loading && !error}
        <div class="bg-white shadow rounded-lg p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <User class="h-6 w-6 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No User Found</h3>
          <p class="text-sm text-gray-600 mb-6">The user you're looking for doesn't exist or you don't have permission to access it.</p>
          <button
            on:click={goBack}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Users
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h1 class="text-2xl font-bold text-gray-900 mt-4">Admin Access Required</h1>
        <p class="text-gray-600 mt-2">You need administrator privileges to access this page.</p>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Modal using Portal -->
{#if showDeleteModal && user}
  <Portal>
    <div class="bg-neutral-100 p-6 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll">
      <UserDeletion
        user={user}
        on:success={handleDeleteSuccess}
        on:cancel={() => {
          showDeleteModal = false;
        }}
      />
    </div>
  </Portal>
{/if}

<PasswordUpdateModal
  bind:show={showPasswordModal}
  {userId}
  on:success={handlePasswordSuccess}
  on:cancel={() => showPasswordModal = false}
/>