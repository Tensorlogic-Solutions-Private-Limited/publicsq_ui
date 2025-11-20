<script>
  import { createEventDispatcher, onMount } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import TextDescriptionField from "$lib/components/reusable/TextDescriptionField.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { authStore } from "$lib/stores/authStore";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let mode = "add";
  export let existingBlock = null;
  export let orgs = [];
  export let statesList = [];
  export let loading = false;

  const dispatch = createEventDispatcher();

  let validationErrors = {};
  let disableOrgDropdown = false;
  let disableStateDropdown = false;

  let formData = {
    block_code: "",
    block_name: "",
    block_description: "",
    organization_uuid: "",
    state_id: "",
    is_active: true,
  };

  let selectedOrgName = "";
  let selectedStateName = "";

  const statusOptions = [
    { id: true, name: "Active" },
    { id: false, name: "Inactive" },
  ];

  function validateForm() {
    validationErrors = {};

    if (!formData.block_name?.trim()) {
      validationErrors.block_name = "Region name is required";
    }
    if (!formData.organization_uuid) {
      validationErrors.organization_uuid = "Organization is required";
    }
    if (!formData.state_id) {
      validationErrors.state_id = "State is required";
    }

    validationErrors = { ...validationErrors };

    return Object.keys(validationErrors).length === 0;
  }

  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
  }

  function handleDropdownSelect(event) {
    const { selectedOption } = event.detail;
    formData.organization_uuid = selectedOption.id;
    formData = { ...formData };
  }

  function handleOrgComboBoxSelect(event) {
    const { selectedItemId, selectedItemName } = event.detail;
    formData.organization_uuid = selectedItemId;
    selectedOrgName = selectedItemName;
    formData = { ...formData };
  }

  function handleCancelSelection(fieldName) {
    if (fieldName === "organization_uuid") {
      formData.organization_uuid = "";
      selectedOrgName = "";
    } else if (fieldName === "is_active") {
      formData.is_active = true;
    }else if (fieldName === "state_id") {
      formData.state_id = "";
      selectedStateName = "";
    }
    formData = { ...formData };
  }

  function handleStatusSelect(event) {
    const { selectedOption } = event.detail;
    formData.is_active = selectedOption.id;
    formData = { ...formData };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) {
      validationErrors={...validationErrors}
      return;
    }

    loading = true;
    try {
      const method = mode === "edit" ? "PUT" : "POST";
      const url =
        mode === "edit" ? `/apis/blocks/${existingBlock.uuid}` : "/apis/blocks";

      const response = await apiClient(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response || !response.ok) {
        if(response === null){
          throw new Error("Failed to save region. Please try again.");
        }
        const errorData = await response?.json();

        if (response?.status === 409) {
          throw new Error(errorData.error || "This region already exists.");
        }

        // Handle other error status codes
        switch (response?.status) {
          case 400:
            throw new Error(errorData.error || "Invalid region data provided");
          case 401:
            throw new Error(
              errorData.error || "You are not authorized to perform this action"
            );
          case 403:
            throw new Error(
              errorData.error ||
                "You don't have permission to perform this action"
            );
          case 404:
            throw new Error(
              errorData.error || "Failed to save region. Please try again."
            );
          default:
            throw new Error(
              errorData.error || "Failed to save region. Please try again."
            );
        }
      }

      const result = await response.json();
      dispatch("success", { result, mode });
    } catch (error) {
      console.error("Error saving region:", error);
      validationErrors.submit = error.message;
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleStateSelect(event) {
    const { selectedItemId } = event.detail;
    formData.state_id = selectedItemId;
    formData = { ...formData };
  }

  async function initialiseData() {
    if (mode === "edit" && existingBlock) {
      formData = {
        block_code: existingBlock.block_code || "",
        block_name: existingBlock.block_name || "",
        block_description: existingBlock.block_description || "",
        organization_uuid: existingBlock.organization_uuid?.toString() || "",
        is_active: existingBlock.is_active ?? true,
        state_id: existingBlock.state_id || "",
      };
      // Set the organization name for edit mode, since we are accessing this form from multiple places the fieldnames are different
      selectedOrgName =
        existingBlock?.organization?.org_name ||
        existingBlock?.organization?.name || existingBlock?.organization ||
        orgs?.find((org) => org.id?.toString() === formData.organization_uuid)
          ?.name ||
        "";

      // If block admin, get org name from authStore and disable state dropdown
      const unsubscribe = authStore?.subscribe((user) => {
        if (
          user &&
          user.roleCode?.toLowerCase()?.trim() === "block_admin"
        ) {
          disableStateDropdown = true;
        }
      });
      if (unsubscribe) unsubscribe();

      selectedStateName = statesList?.find(
        (s) => s.id?.toString() === formData.state_id?.toString()
      )?.name || "";
    }
  }

  onMount(async () => {
    if (mode === "edit") {
      await initialiseData();
    } else if (mode === "add") {
      // Add mode: set selectedOrgName from authStore organizationId
      const unsubscribe = authStore?.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.orgId) {
            const orgObj = orgs?.find(
              (org) => org.id?.toString() === user.orgId?.toString()
            );
            selectedOrgName = orgObj?.name || user?.org_name || "";
            formData.organization_uuid =
              orgObj?.id?.toString() || user?.orgId || "";
            formData = { ...formData };
          }
          if(user?.roleCode?.toLowerCase()?.trim() === "admin" || user?.roleCode?.toLowerCase()?.trim() === "admin_user"){
            disableOrgDropdown = true;
        }}
      });
      return () => unsubscribe(); // Cleanup subscription
    }
  });
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
      {mode === "edit" ? "Edit Region" : "Add New Region"}
    </h2>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="px-2 py-4 space-y-6">
    <div class="grid grid-cols-1 gap-4">
      <div>
        <SearchableComboBox
          label="Organization"
          placeholder="Select organization"
          options={orgs}
          required={true}
          selectedItemId={formData.organization_uuid}
          selectedItemName={mode === "edit"
            ? selectedOrgName
            : orgs?.find((org) => org.id === formData.organization_uuid)?.name || ""}
          disabled={mode === "edit" || disableOrgDropdown}
          validationErrors={validationErrors.organization_uuid}
          on:handleDispatchComboBoxData={handleOrgComboBoxSelect}
          on:handleDispatchFilterData={() => handleCancelSelection("organization_uuid")}
        />
      </div>

      <div>
        <SearchableComboBox
          label="State"
          placeholder="Select state"
          options={statesList}
          required={true}
          selectedItemId={formData.state_id}
          selectedItemName={selectedStateName}
          validationErrors={validationErrors.state_id}
          disabled={disableStateDropdown}
          on:handleDispatchComboBoxData={handleStateSelect}
          on:handleDispatchFilterData={() => handleCancelSelection("state_id")}
        />
      </div>

      <div>
        <InputField
          label="Region Code"
          name="block_code"
          type="text"
          placeholder="Enter region code"
          value={formData.block_code}
          error={validationErrors.block_code}
          on:handleInputData={handleInputData}
        />
      </div>

      <div>
        <InputField
          label="Region Name"
          name="block_name"
          type="text"
          placeholder="Enter region name"
          value={formData.block_name}
          required={true}
          error={validationErrors.block_name}
          on:handleInputData={handleInputData}
        />
      </div>

      <div>
        <TextDescriptionField
          label="Description"
          name="block_description"
          placeholder="Enter region description"
          value={formData.block_description}
          on:handleInputData={handleInputData}
        />
      </div>

      {#if mode === "edit"}
        <div>
          <DropDown
            title="Status"
            placeholder="Select status"
            options={statusOptions}
            selectedItemName={formData.is_active ? "Active" : "Inactive"}
            selectedItemUuid={formData.is_active}
            on:handleDispatchFilterData={handleStatusSelect}
            on:handleCancelSelection={() => handleCancelSelection("is_active")}
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
      <Button type="submit" disabled={loading} btnType="primary" title="Submit">
        {#if loading}
          <LoadingSpinner size="small" color="white" />
        {/if}
        Submit
      </Button>
    </div>
  </form>
</div>
