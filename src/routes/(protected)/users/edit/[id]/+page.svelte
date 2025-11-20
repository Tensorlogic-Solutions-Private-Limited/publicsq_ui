<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import UserForm from '$lib/components/Admin/UserForm.svelte'
  
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showUserNotification } from '../../userStore.js';
  import { apiClient } from '$lib/utils/apiClient.js';
  
  export let data;
  
  // Session data
  $: isAuth = !!data.session?.isAuthenticated;
  $: currentUserRole = data.session?.roleCode || '';
  $: isAdmin = ['super_admin', 'admin', 'admin_user', 'block_admin'].includes(currentUserRole);
  
  // State variables
  let loading = true;
  let loadingUser = true;
  let error = null;
  export let  user = null;

  let successMessage = '' ; 
  $: successMessage = $page.url.searchParams.get('message') || '';

  
  // Get user ID from URL parameter
  const userId = $page.params.id;
  
  

  // Load user data
  async function loadUserData() {
    loadingUser = true;
    error = null;
    
    try {
      // if(currentUserRole === 'block_admin'){
      //   user = data.session ; 
      // }
      const response = await apiClient(`/apis/users/${userId}`);
      
       if (!response || !response.ok) {
        if(response === null){
          throw new Error("Failed to fetch user data. Please try again.");
        }
        throw new Error(`Status: ${response?.status}`);
      }
      
      user = await response.json();
      
    } catch (err) {
      console.error('Error loading user data:', err);
      error = err.message;
    } finally {
      loadingUser = false;
    }
  }
  
  // Handle form success
  function handleSuccess(event) {
    const { user, message } = event.detail;
    const successMsg = message || `User "${user.username}" has been successfully updated.`;
    
    // Pass the updated user data in the URL so we can update local state
    const userData = encodeURIComponent(JSON.stringify(formatUser(user)));
    showUserNotification('success',successMsg)
    // Redirect back to users list with success message and user data
    goto(`/users?userUpdated=true&message=${encodeURIComponent(successMsg)}&userData=${userData}`);
  }
  
  // Add the formatUser function to normalize user data structure
  function formatUser(user) {
    return {
      id: user.uuid,
      username: user.username,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      is_active: user.is_active,
      role_id: user.role?.id,
      role_code: user.role?.role_code || "",
      role_name: user.role?.role_name || "",
      organization: user.organization?.org_name || "",
      organization_id: user.organization?.uuid,
      block: user.block?.block_name || "",
      block_id: user.block?.uuid,
      school: user.school?.school_name || "",
      school_id: user.school?.uuid,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
  
  // Handle form error
  function handleError(event) {
    error = event.detail;
    
    // Scroll to top to show the error message
    window.scrollTo(0, 0);
  }
  
  // Go back to users list
  function goBack() {
    goto('/users');
  }
  
  onMount(async () => {
   
    if (isAuth && isAdmin && userId) {
      await loadUserData();
    }
  });
</script>

<!-- <svelte:head>
  <title>Edit User</title>
</svelte:head> -->

<div class="min-h-screen bg-gray-50 py-8 ">
  {#if isAuth}
    {#if isAdmin}
          <div class="w-full px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2">
            <!-- <button 
              class="p-2 rounded-full hover:bg-gray-100"
              on:click={goBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button> -->
            
          </div>
          
        </div>
              
        <!-- Error message -->
        {#if error}
          <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-700">{error}</p>
          </div>
        {/if}
        
        <!-- Loading state -->
        {#if loadingUser}
          <div class="flex justify-center items-center py-12">
            <LoadingSpinner size="large" message="Loading user data..." />
          </div>
        {:else if user}
          <!-- Edit form -->
          <UserForm
            {user}
            mode="edit"
            {currentUserRole}
            {loading}
            on:success={handleSuccess}
            on:error={handleError}
            on:cancel={goBack}
          />
        {:else if !loadingUser && !error}
          <div class="bg-white shadow rounded-lg p-8 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
  {:else}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">Please log in</h1>
        <p class="text-gray-600 mt-2">Authentication required to access this page.</p>
      </div>
    </div>
  {/if}
</div>