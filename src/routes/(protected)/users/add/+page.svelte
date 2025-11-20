<script>
  import { goto } from '$app/navigation';
  import UserForm from '$lib/components/Admin/UserForm.svelte'
  import { ArrowLeft } from '@lucide/svelte';
  import { page } from '$app/stores';
  import { onDestroy,onMount } from 'svelte';
  import { userNotification, showUserNotification,hideUserNotification } from '../userStore.js';
  
  export let data;
  
  // Session data
  // $: isAuth = !!data.session?.isAuthenticated;
  $: currentUserRole = data.session?.roleCode || '';
  $: isAdmin = ['super_admin', 'admin', 'admin_user', 'block_admin'].includes(currentUserRole);
  
  
  export let currentUser = data.session ; 
  
  
  // State variables
  let loading = false
  let error = null;
  let returnPath = $page.url.searchParams.get('from');
  let nt = 'user'
  // Handle form success
  function handleSuccess(event) {
    const { message } = event.detail;
    showUserNotification(
      'success', 
      message
    ) ; 
    goto(`/users`);
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

    let userId = data.session?.userId || '';
    

   


</script>

<div class="min-h-screen bg-gray-50 py-8">
  
    {#if isAdmin}
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2">
           
            
          </div>
          
        </div>
        
        <!-- Error message -->
        {#if error}
          <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-700">{error}</p>
          </div>
        {/if}
        
        <!-- Add user form -->
        <UserForm
          mode="add"
          currentUserRole={currentUserRole}
          {currentUser}
          bind:loading
          on:success={handleSuccess}
          on:error={handleError}
          on:cancel={goBack}
        />
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