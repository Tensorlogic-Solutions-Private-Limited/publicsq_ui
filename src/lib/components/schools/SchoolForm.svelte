<script>
  import { createEventDispatcher, onMount } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import TextDescriptionField from "$lib/components/reusable/TextDescriptionField.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";

  export let mode = "add";
  export let existingSchool = null;
  export let blocks = [];
  export let orgs = [];
  export let blockId = "";
  export let orgId = "";
  export let blockName = "";
  export let orgName = "";
  export let showOrgDropdown = false;
  export let showBlockDropdown = false;
  export let loading = false;

  const dispatch = createEventDispatcher();

  let validationErrors = {};
  let selectedOrgName = "";
  let selectedBlockName = "";

  let formData = {
    school_code: "",
    school_name: "",
    school_description: "",
    block_id: blockId || "",
    organization_id: orgId || "",
    is_active: true
  };

  const statusOptions = [
    { id: true, name: "Active" },
    { id: false, name: "Inactive" }
  ];

  // Filter blocks based on selected organization
  $: availableBlocks =
    showBlockDropdown && formData.organization_id
      ? blocks?.filter(
          (block) =>
            block.orgId?.toString() === formData.organization_id?.toString()
        )
      : [];

  // ------------------------------- Validation ---------------------------------------------------
  function validateForm() {
    validationErrors = {};

    if (!formData.school_code?.trim()) {
      validationErrors.school_code = "School code is required";
    }
    if (!formData.school_name?.trim()) {
      validationErrors.school_name = "School name is required";
    }

    // Validate organization only if dropdown is shown or orgId is not provided
    if (showOrgDropdown && !formData.organization_id) {
      validationErrors.organization_id = "Organization is required";
    }

    // Validate block only if dropdown is shown or blockId is not provided
    if (showBlockDropdown && !formData.block_id) {
      validationErrors.block_id = "Block is required";
    }

    return Object.keys(validationErrors).length === 0;
  }

  // ------------------------- Dropdown Related Functions -----------------------------------

  function handleDropdownSelect(fieldName) {
    return function(event) {
      const { selectedOption } = event.detail;
      
      if (fieldName === 'organization_id') {
        formData.organization_id = selectedOption.id;
        // Reset block selection when organization changes
        if (showBlockDropdown) {
          formData.block_id = "";
        }
        showBlockDropdown = true;
      } else if (fieldName === 'block_id') {
        formData.block_id = selectedOption.id;
      } else if (fieldName === 'is_active') {
        formData.is_active = selectedOption.id;
      }
      
      formData = { ...formData }; // Trigger reactivity
    }
  }

  function handleCancelSelection(fieldName) {
    return function() {
      if (fieldName === 'organization_id') {
        formData.organization_id = "";
        if (showBlockDropdown) {
          formData.block_id = "";
        }
      } else if (fieldName === 'block_id') {
        formData.block_id = "";
      } else if (fieldName === 'is_active') {
        formData.is_active = true; // Reset to default active state
      }
      
      formData = { ...formData }; // Trigger reactivity
    }
  }

  // -------------------------- Form Submission --------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    loading = true;
    try {
      const method = mode === "edit" ? "PUT" : "POST";
      const url =
        mode === "edit"
          ? `/apis/schools/${existingSchool.id}`
          : "/apis/schools";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response?.json();

        if (response.status === 409) {
          throw new Error(errorData.message || "This School already exists.");
        }

        // Handle other error status codes
        switch (response.status) {
          case 400:
            throw new Error(
              errorData.message || "Invalid school data provided"
            );
          case 401:
            throw new Error("You are not authorized to perform this action");
          case 403:
            throw new Error("You don't have permission to perform this action");
          case 404:
            throw new Error("Unexpected error occurred. Please try again.");
          default:
            throw new Error(
              errorData.message || "Failed to save school. Please try again."
            );
        }
      }

      const result = await response.json();
      dispatch("success", { result, mode });
    } catch (error) {
      console.error("Error saving school:", error);
      validationErrors.submit = error.message;
    } finally {
      loading = false;
    }
  }

  // -------------------------- Form Initialisation -------------------------------------------

  async function handleInitialiseData() {
    if (mode === "edit" && existingSchool) {
      // In edit mode, use existing school data
      formData = {
        school_code: existingSchool.school_code || "",
        school_name: existingSchool.school_name || "",
        school_description: existingSchool.school_description || "",
        block_id: blockId || "",
        organization_id: orgId || "",
        is_active: existingSchool.is_active ?? true
      };

      // Set the organization and block names for edit mode
      if (showOrgDropdown) {
        selectedOrgName = orgName || "";
      }
      if (showBlockDropdown) {
        selectedBlockName = blockName || "";
      }
    }
  }

  // ------------------------- life cycle functions -----------------------------------

  onMount(async () => {
    await handleInitialiseData();
  });

  // ----------------------------- General -----------------------------------------
  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
    formData = formData;
  }

  function handleCancel() {
    dispatch("cancel");
  }
</script>

<div class="bg-white">
  {#if validationErrors.submit}
    <div class="mb-2">
      <InlineNotification
        kind="error"
        title={validationErrors.submit}
        hideCloseButton={true}
      />
    </div>
  {/if}
  <div
    class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 text-dark-gray"
  >
    <h2 class="text-base font-semibold text-dark-grey">
      {mode === "edit" ? "Edit School" : "Add School"}
    </h2>
  </div>

  <form
    on:submit|preventDefault={handleSubmit}
    class="px-6 py-4 space-y-6"
  >
    <div class="grid grid-cols-1 gap-4">
      <div>
        <InputField
          label="School Code"
          name="school_code"
          type="text"
          placeholder="Enter school code"
          value={formData.school_code}
          required={true}
          error={validationErrors.school_code}
          on:handleInputData={handleInputData}
        />
      </div>

      <div>
        <InputField
          label="School Name"
          name="school_name"
          type="text"
          placeholder="Enter school name"
          value={formData.school_name}
          required={true}
          error={validationErrors.school_name}
          on:handleInputData={handleInputData}
        />
      </div>

      <div>
        <TextDescriptionField
          label="Description"
          name="school_description"
          placeholder="Enter school description"
          value={formData.school_description}
          on:handleInputData={handleInputData}
        />
      </div>

      {#if showOrgDropdown}
        <div>
          <DropDown
            title="Organization"
            placeholder="Select organization"
            options={orgs}
            selectedItemName={mode === "edit"
              ? selectedOrgName
              : orgs?.find(
                  (org) =>
                    org.id?.toString() === formData.organization_id?.toString()
                )?.name || ""}
            disabled={mode === "edit"}
            validationErrors={validationErrors.organization_id}
            on:handleDispatchFilterData={handleDropdownSelect('organization_id')}
            on:handleCancelSelection={handleCancelSelection('organization_id')}
          />
        </div>
      {/if}

      {#if showBlockDropdown && formData?.organization_id}
        <div>
          <DropDown
            title="Block"
            placeholder="Select block"
            options={availableBlocks}
            selectedItemName={mode === "edit"
              ? selectedBlockName
              : blocks?.find(
                  (block) =>
                    block.id?.toString() === formData.block_id?.toString()
                )?.name || ""}
            disabled={mode === "edit"}
            validationErrors={validationErrors.block_id}
            on:handleDispatchFilterData={handleDropdownSelect('block_id')}
            on:handleCancelSelection={handleCancelSelection('block_id')}
          />
        </div>
      {/if}

      {#if mode === "edit"}
        <div>
          <DropDown
            title="Status"
            placeholder="Select status"
            options={statusOptions}
            selectedItemName={formData.is_active ? "Active" : "Inactive"}
            selectedItemUuid={formData.is_active}
            on:handleDispatchFilterData={handleDropdownSelect('is_active')}
            on:handleCancelSelection={handleCancelSelection('is_active')}
          />
        </div>
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
        disabled={loading}
        title="Submit"
      >
        {#if loading}
          <LoadingSpinner />
        {:else}
          Submit
        {/if}
      </Button>
    </div>
  </form>
</div>
