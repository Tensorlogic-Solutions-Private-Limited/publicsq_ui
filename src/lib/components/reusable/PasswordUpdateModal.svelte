<script>
  import { createEventDispatcher } from "svelte";
  import InputField from "./InputField.svelte";
  import Button from "./Button.svelte";
  import Portal from "./Portal.svelte";
  import InlineNotification from "./InlineNotification.svelte";
  import LineLoader from "./LineLoader.svelte";
  import { Eye, EyeClosed } from "@lucide/svelte";
  export let show = false;
  export let loading = false;
  export let userId;
  let errorMessage = '';


  const dispatch = createEventDispatcher();

  let formData = {
    new_password: "",
    confirm_password: "",
  };

  let validationErrors = {
    new_password: "",
    confirm_password: "",
  };

  // Password visibility toggles
  let showNewPassword = false;
  let showConfirmPassword = false;

  function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 characters long and contain 1 lowercase, 1 uppercase, and 1 special character";
    }
    return "";
  }

  function validateForm() {
    validationErrors = {
      new_password: "",
      confirm_password: "",
    };

    let isValid = true;

    // Validate new password
    const passwordError = validatePassword(formData.new_password);
    if (passwordError) {
      validationErrors.new_password = passwordError;
      isValid = false;
    }

    // Validate confirm password
    if (formData.new_password !== formData.confirm_password) {
      validationErrors.confirm_password = "Passwords do not match";
      isValid = false;
    }

    return isValid;
  }
async function handleSubmit() {
  if (!validateForm()) return;
  errorMessage = '';

  try {
    loading = true;
    const response = await fetch(`/apis/users/${userId}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include', // Important for cookies to be sent
      body: JSON.stringify({ new_password: formData.new_password }),
    });

    // Handle different response statuses
    if (response.status === 401) {
      errorMessage = "You need to login again";
      throw new Error(errorMessage);
    } else if (response.status === 403) {
      errorMessage = "You don't have permission to update this password";
      throw new Error(errorMessage);
    } else if (response.status === 404) {
      errorMessage = "User not found";
      throw new Error(errorMessage);
    }
    
    const data = await response.json().catch(() => ({ message: "Password updated successfully" }));

    if (!response.ok) {
      errorMessage = data.error || "Failed to update password";
      throw new Error(errorMessage);
    }

    // Reset form and close modal
    formData = { new_password: "", confirm_password: "" };
    // Dispatch success to show notification in the parent page
    dispatch("success", { message: data.message || "Password updated successfully" });
    show = false;

  } catch (error) {
    console.error("Error updating password:", error);
    errorMessage = error.message || "An unexpected error occurred";
  } finally {
    loading = false;
  }
}

  function handleCancel() {
    formData = { new_password: "", confirm_password: "" };
    validationErrors = { new_password: "", confirm_password: "" };
    dispatch("cancel");
  }
</script>

{#if show}
  <Portal>
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="absolute inset-0 " on:click={handleCancel}></div>
      
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto mx-4 relative">
        {#if loading}
          <div class="w-full">
            <LineLoader loaderColor="bg-blue-600" />
          </div>
        {/if}

        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Update Password</h2>
          </div>

          {#if errorMessage}
            <div class="mb-4">
              <InlineNotification
                kind="error"
                title={errorMessage}
                timeout={0}
                on:close={() => errorMessage = ''}
              />
            </div>
          {/if}

        

        <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
          <div>
            <InputField
              type={showNewPassword ? "text" : "password"}
              label="New Password"
              name="new_password"
              placeholder="Enter new password"
              required={true}
              bind:value={formData.new_password}
              validationErrors={validationErrors.new_password}
            >
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600"
                on:click={() => showNewPassword = !showNewPassword}
              >
                {#if showNewPassword}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                {:else}
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                {/if}
              </button>
            </InputField>
          </div>

          <div>
            <InputField
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              name="confirm_password"
              placeholder="Confirm new password"
              required={true}
              bind:value={formData.confirm_password}
              validationErrors={validationErrors.confirm_password}
            >
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600"
                on:click={() => showConfirmPassword = !showConfirmPassword}
              >
                {#if showConfirmPassword}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                {:else}
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                {/if}
              </button>
            </InputField>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <Button
              btnType="secondary"
              on:click={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              btnType="primary"
              disabled={loading || !formData.new_password || !formData.confirm_password}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Portal>
{/if}