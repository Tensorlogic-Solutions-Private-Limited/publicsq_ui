<script>
  import { createEventDispatcher, onMount } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import TextDescriptionField from "$lib/components/reusable/TextDescriptionField.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import LineLoader from "../reusable/LineLoader.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let mode = "add";
  export let existingOrganization = null;
  export let loading = false;

  const dispatch = createEventDispatcher();

  let validationErrors = {};

  let formData = {
    org_code: "",
    org_name: "",
    org_description: "",
    is_active: true
  };
  
  // Status options for dropdown
  const statusOptions = [
    { id: true, name: "Active" },
    { id: false, name: "Inactive" },
  ];

  function validateForm() {
    validationErrors = {};

    if (!formData.org_code?.trim()) {
      validationErrors.org_code = "Organization code is required";
    }
    if (!formData.org_name?.trim()) {
      validationErrors.org_name = "Organization name is required";
    }

    return Object.keys(validationErrors).length === 0;
  }

  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
  }
  
  // Handle status selection from dropdown
  function handleStatusSelect(event) {
    const { selectedOption } = event.detail;
    formData.is_active = selectedOption.id;
    formData = { ...formData };
  }
  
  
  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    loading = true;
    try {
      const method = mode === "edit" ? "PUT" : "POST";
      const url =
        mode === "edit" ? `/apis/organizations/${existingOrganization.uuid}` : "/apis/organizations";

      const response = await apiClient(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response?.json();

        if (response.status === 409) {
          throw new Error(errorData.message || "This Organization already exists.");
        }

        // Handle other error status codes
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || "Invalid organization data provided");
          case 401:
            throw new Error("You are not authorized to perform this action");
          case 403:
            throw new Error("You don't have permission to perform this action");
          case 404:
            throw new Error("Unexpected error occurred. Please try again.");
          default:
            throw new Error(
              errorData.message || "Failed to save organization. Please try again."
            );
        }
      }

      const result = await response.json();
      dispatch("success", { result, mode });
    } catch (error) {
      console.error("Error saving organization:", error);
      validationErrors.submit = error.message;
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch("cancel");
  }

  async function initialiseData() {
    if (mode === "edit" && existingOrganization) {
      formData = {
        org_code: existingOrganization.org_code || "",
        org_name: existingOrganization.org_name || "",
        org_description: existingOrganization.org_description || "",
        is_active: existingOrganization.is_active !== undefined 
          ? existingOrganization.is_active 
          : true
      };
    }
  }

  onMount(async () => {
    if (mode === "edit") {
      await initialiseData();
    }
  });
  /*
    {#if loadingCreate}
    <div class="mb-4">
      <LineLoader loaderColor={"bg-blue-600"} />
    </div>
    {/if}
  */
</script>

<div class = "bg-white p-6 rounded-lg max-w-xl w-full max-h-[95vh] overflow-y-auto mx-4">
  {#if loading}
  <div class="mb-4">
      <LineLoader loaderColor={"bg-blue-600"} />
    </div>
  {/if}

    {#if validationErrors.submit}
    <div class="mb-4 mt-4 ">
      <InlineNotification
        kind="error"
        title={validationErrors.submit}
        hideCloseButton={true}
      />
    </div>
  {/if}

  
   <div class="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
    <h2 class="text-base  font-semibold text-dark-grey">
      {mode === "edit" ? "Edit Organization" : "Add New Organization"}
    </h2>
  </div>



  <form on:submit|preventDefault={handleSubmit} class="space-y-6 mt-6">
    <div>
      <InputField
        label="Organization Code"
        name="org_code"
        value={formData.org_code}
        placeholder="Enter organization code"
        required={true}
        error={validationErrors.org_code}
        on:handleInputData={handleInputData}
      />
    </div>
    
    <div>
      <InputField
        label="Organization Name"
        name="org_name"
        value={formData.org_name}
        placeholder="Enter organization name"
        required={true}
        error={validationErrors.org_name}
        on:handleInputData={handleInputData}
      />
    </div>
    
    <div>
      <TextDescriptionField
        label="Description"
        name="org_description"
        placeholder="Enter organization description"
        value={formData.org_description}
        on:handleInputData={handleInputData}
      />
    </div>
    
    <div>
      {#if mode === "edit"}
        <DropDown
          title="Status"
          placeholder="Select status"
          options={statusOptions}
          selectedItemName={formData.is_active ? "Active" : "Inactive"}
          on:handleDispatchFilterData={handleStatusSelect}
        />     
      {/if}
    </div>
    
    <div class="flex justify-end gap-3 pt-4">
      <Button
        btnType="secondary"
        on:click={handleCancel}
        disabled={loading}
        title="Cancel"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        
        btnType="primary"
        title="Submit"
      >
        {#if loading}
          <LoadingSpinner size="small" color="white" />
        {:else}
          Submit
        {/if}
      </Button>
    </div>
  </form>
</div>