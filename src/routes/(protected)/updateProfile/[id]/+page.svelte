<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore.js';
  import { api } from '$lib/utils/api.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  // Get user ID from the route parameter
  $: userId = $page.params.id;

  // Get auth store data
  $: authData = $authStore;
  $: currentUserId = authData.userId;
  $: currentUsername = authData.username;
  $: currentRole = authData.role;
  $: currentRoleCode = authData.roleCode;
  $: isAdmin = currentRoleCode === '100';

  // Form state
  let passwordData = {
    new_password: '',
    confirm_password: ''
  };

  // UI state
  let loading = false;
  let error = '';
  let success = '';
  let validationErrors = {};
  let passwordStrength = 'weak';
  let showPassword = false;
  let showConfirmPassword = false;

  // Validation and authorization
  $: {
    console.log('Route userId:', userId);
    console.log('Current user ID:', currentUserId);
    console.log('Is Admin:', isAdmin);
    console.log('Auth data:', authData);
  }

  // Check authorization
  $: canUpdatePassword = !!(
    authData.isAuthenticated && 
    (isAdmin || (currentUserId && userId && currentUserId.toString() === userId))
  );

  // Watch password changes for strength indication
  $: if (passwordData.new_password && api.adminUpdatePassword?.validatePassword) {
    try {
      const validation = api.adminUpdatePassword.validatePassword({
        new_password: passwordData.new_password
      });
      passwordStrength = validation.strength || 'weak';
    } catch (e) {
      console.warn('Password validation not available:', e);
      passwordStrength = 'weak';
    }
  }

  onMount(() => {
    console.log('Page mounted');
    console.log('User ID from route:', userId);
    console.log('Auth store data:', $authStore);

    // Check if user is authenticated
    if (!authData.isAuthenticated) {
      console.warn('User not authenticated, redirecting to login');
      goto('/auth/login');
      return;
    }

    // Check authorization
    if (!canUpdatePassword) {
      console.warn('User not authorized for this action');
      error = 'You are not authorized to update this password.';
      return;
    }

    // Parse userId to ensure it's a number
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum) || userIdNum < 1) {
      error = 'Invalid user ID provided.';
      return;
    }
  });

  // Form validation
  function validateForm() {
    validationErrors = {};
    let isValid = true;

    // Validate new password
    if (!passwordData.new_password) {
      validationErrors.new_password = 'New password is required';
      isValid = false;
    } else if (api.adminUpdatePassword?.validatePassword) {
      try {
        const validation = api.adminUpdatePassword.validatePassword({
          new_password: passwordData.new_password
        });
        
        if (!validation.isValid) {
          validationErrors.new_password = validation.errors.join('. ');
          isValid = false;
        }
      } catch (e) {
        console.warn('Password validation not available:', e);
        // Basic validation fallback
        if (passwordData.new_password.length < 8) {
          validationErrors.new_password = 'Password must be at least 8 characters long';
          isValid = false;
        }
      }
    }

    // Validate confirm password
    if (!passwordData.confirm_password) {
      validationErrors.confirm_password = 'Please confirm your password';
      isValid = false;
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      validationErrors.confirm_password = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      const userIdNum = parseInt(userId, 10);
      
      console.log('Updating password for user:', userIdNum);

      const response = await api.adminUpdatePassword.update(userIdNum, {
        new_password: passwordData.new_password
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Password updated successfully');
      success = 'Password updated successfully!';
      
      // Clear the form
      passwordData = {
        new_password: '',
        confirm_password: ''
      };
      
      // Redirect after 2 seconds
      setTimeout(() => {
        if (isAdmin) {
          goto('/users');
        } else {
          goto('/home');
        }
      }, 2000);

    } catch (err) {
      error = err.message || 'Failed to update password';
      console.error('Error updating password:', err);
    } finally {
      loading = false;
    }
  }

  // Generate strong password
  function generatePassword() {
    if (api.adminUpdatePassword?.generateStrongPassword) {
      try {
        const generated = api.adminUpdatePassword.generateStrongPassword(12);
        passwordData.new_password = generated;
        passwordData.confirm_password = generated;
      } catch (e) {
        console.warn('Password generation not available:', e);
        // Fallback password generation
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwordData.new_password = result;
        passwordData.confirm_password = result;
      }
    }
    
    // Clear any existing errors
    validationErrors = {};
    error = '';
  }

  // Handle input changes to clear validation errors
  function handleInputChange(field) {
    if (validationErrors[field]) {
      delete validationErrors[field];
      validationErrors = { ...validationErrors };
    }
    error = '';
    success = '';
  }

  // Get password strength color
  function getPasswordStrengthColor(strength) {
    const colors = {
      'very weak': 'bg-red-500',
      'weak': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'strong': 'bg-blue-500',
      'very strong': 'bg-green-500'
    };
    return colors[strength] || 'bg-gray-300';
  }

  // Get password strength width
  function getPasswordStrengthWidth(strength) {
    const widths = {
      'very weak': '20%',
      'weak': '40%',
      'medium': '60%',
      'strong': '80%',
      'very strong': '100%'
    };
    return widths[strength] || '0%';
  }

  // Navigate back
  function goBack() {
    if (isAdmin) {
      goto('/users');
    } else {
      goto('/home');
    }
  }
</script>

<!-- <svelte:head>
  <title>Update Password - Smart QP</title>
</svelte:head> -->

<main class="min-h-screen bg-gray-50">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header -->
    <div class="mb-8">
      <button 
        on:click={goBack}
        class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to {isAdmin ? 'Admin Panel' : 'Home'}
      </button>
      
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Update Password</h1>
        <p class="text-gray-600">Update your account password</p>
      </div>
    </div>

    <!-- Authorization Check -->
    {#if !authData.isAuthenticated}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h4 class="text-sm font-medium text-red-800">Authentication Required</h4>
            <p class="text-sm text-red-700 mt-1">Please log in to access this page.</p>
          </div>
        </div>
      </div>
    {:else if !canUpdatePassword}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h4 class="text-sm font-medium text-red-800">Access Denied</h4>
            <p class="text-sm text-red-700 mt-1">You are not authorized to update this password.</p>
          </div>
        </div>
      </div>
    {:else}
      <!-- Main Content -->
      <div class="bg-white shadow-xl rounded-lg overflow-hidden">
        
        <!-- User Info Section -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-12 w-12">
                <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-xl font-medium text-blue-800">
                    {currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">User Information</h3>
                <p class="text-sm text-gray-600">Account details and access level</p>
              </div>
            </div>
            
            <!-- Access Level Badge -->
            <div>
              {#if isAdmin}
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  👑 Admin Access
                </span>
              {:else}
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  📚 Own Account
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- User Details Display -->
        <div class="px-6 py-6 border-b border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Username -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span class="text-gray-900">{currentUsername || 'N/A'}</span>
              </div>
            </div>

            <!-- User ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <div class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span class="text-gray-900 font-mono">#{userId}</span>
              </div>
            </div>

            <!-- Role Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span class="text-gray-900 capitalize">{currentRole || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Password Update Form -->
        <div class="px-6 py-6">
          
          <!-- Success Message -->
          {#if success}
            <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-700">{success}</p>
                  <p class="text-xs text-green-600 mt-1">Redirecting...</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Error Message -->
          {#if error}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          {/if}

          <form on:submit={handleSubmit} class="space-y-6">
            
            <!-- New Password Field -->
            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
                New Password <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="new_password"
                  type={showPassword ? 'text' : 'password'}
                  bind:value={passwordData.new_password}
                  on:input={() => handleInputChange('new_password')}
                  disabled={loading}
                  class="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {validationErrors.new_password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
                  placeholder="Enter new password"
                />
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    on:click={generatePassword}
                    disabled={loading}
                    class="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 px-1"
                    title="Generate strong password"
                  >
                    Gen
                  </button>
                  <button
                    type="button"
                    on:click={() => showPassword = !showPassword}
                    disabled={loading}
                    class="text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {#if showPassword}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76M12 12l2.122 2.122m-2.122-2.122L9.878 14.878M12 12l4.242-4.242M9.878 14.878L12 17m-2.122-2.122L7.76 16.24" />
                      </svg>
                    {:else}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>
              
              <!-- Password Strength Indicator -->
              {#if passwordData.new_password}
                <div class="mt-2">
                  <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength:</span>
                    <span class="capitalize font-medium">{passwordStrength}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(passwordStrength)}"
                      style="width: {getPasswordStrengthWidth(passwordStrength)}"
                    ></div>
                  </div>
                </div>
              {/if}
              
              {#if validationErrors.new_password}
                <p class="mt-1 text-xs text-red-600">{validationErrors.new_password}</p>
              {/if}
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  bind:value={passwordData.confirm_password}
                  on:input={() => handleInputChange('confirm_password')}
                  disabled={loading}
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {validationErrors.confirm_password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  on:click={() => showConfirmPassword = !showConfirmPassword}
                  disabled={loading}
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {#if showConfirmPassword}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76M12 12l2.122 2.122m-2.122-2.122L9.878 14.878M12 12l4.242-4.242M9.878 14.878L12 17m-2.122-2.122L7.76 16.24" />
                    </svg>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  {/if}
                </button>
              </div>
              {#if validationErrors.confirm_password}
                <p class="mt-1 text-xs text-red-600">{validationErrors.confirm_password}</p>
              {/if}
            </div>

            <!-- Password Requirements -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include at least 3 of the following: uppercase letters, lowercase letters, numbers, special characters</li>
                <li>• Avoid common passwords and personal information</li>
              </ul>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                on:click={goBack}
                disabled={loading}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !passwordData.new_password || !passwordData.confirm_password}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {#if loading}
                  <div class="flex items-center">
                    <LoadingSpinner size="small" color="white" />
                    <span class="ml-2">Updating...</span>
                  </div>
                {:else}
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C12.121 8.48 12.975 8 14 8a2 2 0 012 2v0c0 .551.224 1.048.586 1.414z" />
                    </svg>
                    Update Password
                  </div>
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  /* Additional custom styles */
  .password-strength-indicator {
    transition: all 0.3s ease;
  }

  input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .generate-btn:hover {
    transform: scale(1.05);
  }
</style>