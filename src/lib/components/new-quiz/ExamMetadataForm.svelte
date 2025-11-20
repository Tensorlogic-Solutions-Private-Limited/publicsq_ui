<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { ArrowRight } from "@lucide/svelte";
  import { authStore } from "$lib/stores/authStore";
  import { page } from "$app/stores";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  const dispatch = createEventDispatcher();

  // Props
  export let mode = "add"; // 'add' or 'edit'
  export let initialData = null; // For edit mode

  // Form data
  let formData = {
    exam_name: "",
    total_time: "",
    exam_mode: "online",
    organization_id: null,
    block_id: null,
    school_id: null,
  };

  // Validation errors
  let validationErrors = {
    exam_name: "",
    exam_mode: "",
    organization_id: "",
    block_id: "",
    school_id: "",
  };

  // Dropdown options
  let organizations = [];
  let blocks = [];
  let schools = [];

  // Selected values for combo boxes
  let selectedOrganization = { id: null, name: "" };
  let selectedBlock = { id: null, name: "" };
  let selectedSchool = { id: null, name: "" };

  // Loading states
  let loadingOrganizations = false;
  let loadingBlocks = false;
  let loadingSchools = false;
  let submitting = false;

  // RBAC-related variables
  let disableOrgDropdown = false;
  let disableBlockDropdown = false;
  let disableSchoolDropdown = false;
  let orgNameForAdmin = "";
  let showOrganizationSection = false;

  // Error message state
  let errorMessage = {
    type: "",
    message: "",
    show: false,
  };

  // Exam modes
  const examModes = [
    { id: "online", name: "Online" },
    { id: "offline", name: "Offline" },
  ];

  // ----------------- RBAC Related Functions -----------------------------

  function getUserRole(user) {
    return (user?.roleCode || user?.role || "").toLowerCase();
  }

  // Helper function to set organizational data based on user info
  async function setOrganizationalData(user) {
    if (user.orgId) {
      formData.organization_id = user.orgId;
      selectedOrganization = {
        id: user.orgId,
        name: user.orgName || "",
      };
      orgNameForAdmin = user.orgName || "";
      await fetchBlocks(user.orgId);
    }

    if (user.blockId && formData.organization_id) {
      formData.block_id = user.blockId;
      const block = blocks.find((b) => String(b.id) === String(user.blockId));
      if (block) {
        selectedBlock = {
          id: user.blockId,
          name: block.name,
        };
      }
      await fetchSchools(user.blockId);
    }

    if (user.schoolId) {
      formData.school_id = user.schoolId;
      selectedSchool = {
        id: user.schoolId,
        name: user.schoolName || "",
      };
    }
  }

  // Helper function to set role-based permissions
  function setRolePermissions(role) {
    switch (role) {
      case "super_admin":
        disableOrgDropdown = false;
        disableBlockDropdown = false;
        disableSchoolDropdown = false;
        showOrganizationSection = true;
        break;
      case "admin":
      case "admin_user":
        disableOrgDropdown = true;
        disableBlockDropdown = false;
        disableSchoolDropdown = false;
        showOrganizationSection = true;
        break;
      case "block_admin":
        disableOrgDropdown = true;
        disableBlockDropdown = true;
        disableSchoolDropdown = false;
        showOrganizationSection = true;
        break;
      case "teacher":
        disableOrgDropdown = true;
        disableBlockDropdown = true;
        disableSchoolDropdown = true;
        showOrganizationSection = false;
        break;
      default:
        disableOrgDropdown = false;
        disableBlockDropdown = false;
        disableSchoolDropdown = false;
        showOrganizationSection = true;
    }
  }

  async function populateFormFromInitialData(data) {
    formData = {
      exam_name: data.exam_name || "",
      total_time: data.total_time || "",
      exam_mode: data.exam_mode || "online",
      organization_id: data.organization_id || null,
      block_id: data.block_id || null,
      school_id: data.school_id || null,
    };
    formData = { ...formData };
  }

  // Helper function to set selected values from session and initial data
  async function setSelectedValuesFromData(initialData, sessionData) {
    if (initialData.organization_id) {
      // First try session data, then fallback to finding in organizations array
      let orgName = sessionData.orgName || initialData.organization_name || "";

      // If no name found, search in organizations array
      if (!orgName && organizations.length > 0) {
        const organization = organizations?.find(
          (org) => org.id === initialData.organization_id
        );
        if (organization) {
          orgName = organization.name;
        }
      }

      selectedOrganization = {
        id: initialData?.organization_id,
        name: orgName,
      };
      orgNameForAdmin = orgName;
      await fetchBlocks(initialData.organization_id);
    }

    if (initialData.block_id) {
      let blockName = sessionData.blockName || initialData.block_name || "";

      if (!blockName && blocks.length > 0) {
        const block = blocks?.find((b) => b.id === initialData.block_id);
        if (block) {
          blockName = block.name;
        }
      }

      selectedBlock = {
        id: initialData.block_id,
        name: blockName,
      };
      await fetchSchools(initialData.block_id);
    }

    if (initialData.school_id) {
      let schoolName = sessionData.schoolName || initialData.school_name || "";

      if (!schoolName && schools.length > 0) {
        const school = schools?.find((s) => s.id === initialData.school_id);
        if (school) {
          schoolName = school.name;
        }
      }

      selectedSchool = {
        id: initialData.school_id,
        name: schoolName,
      };
    }
  }

  // ------------------------ Lifecycle Functions ---------------------------
  onMount(async () => {
    // Load organizations first
    await fetchOrganizations();

    if (mode === "add") {
      // Implement RBAC for add mode
      const unsubscribe = authStore.subscribe(async (user) => {
        if (!user || Object.keys(user)?.length === 0) return;

        const role = getUserRole(user);
        setRolePermissions(role);

        // Handle organizational data based on role
        if (role !== "teacher") {
          await setOrganizationalData(user);
        }

        formData = { ...formData };
      });
      return () => unsubscribe();
    } else if (mode === "edit" && initialData) {
      // Populate form data from initial data
      await populateFormFromInitialData(initialData);

      // Get session data for names (prioritize session data over initialData)
      const sessionData = $page.data?.session || {};

      // Set selected values with session data or fallback to initialData
      await setSelectedValuesFromData(initialData, sessionData);

      // Apply role-based restrictions for edit mode
      const role = getUserRole($authStore);
      setRolePermissions(role);
    }
  });

  // --------------------- Data Fetching Functions --------------------------

  async function fetchOrganizations() {
    try {
      loadingOrganizations = true;
      let page = 1;
      const size = 50;
      let totalPages = 1;
      let allOrgs = [];

      while (page <= totalPages) {
        const response = await apiClient(
          `/apis/organizations?page=${page}&page_size=${size}`
        );
        if (!response) {
          loadingOrganizations = false;
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch organizations: page - ${page}`);
        }

        const result = await response.json();
        if (!result) throw new Error("Unexpected API response");

        const data = result.data || [];
        allOrgs.push(
          ...data
            .filter((org) => org.is_active === true)
            .map((org) => ({
              id: org.uuid,
              name: org.org_name,
            }))
        );

        totalPages = Math.ceil(result.total / result.page_size);
        page++;
      }

      organizations = allOrgs;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      organizations = [];
    } finally {
      loadingOrganizations = false;
    }
  }

  async function fetchBlocks(organizationId) {
    if (!organizationId) {
      blocks = [];
      return;
    }
    try {
      loadingBlocks = true;
      let page = 1;
      const size = 50;
      let totalPages = 1;
      let blocksData = [];

      while (page <= totalPages) {
        const response = await apiClient(
          `/apis/blocks?organization_uuid=${organizationId}&page=${page}&page_size=${size}`
        );
        if (!response) {
          loadingBlocks = false;
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch blocks: page - ${page}`);
        }

        const result = await response.json();
        if (!result) throw new Error("Unexpected API response");

        const data = result.data || [];
        blocksData.push(
          ...data
            .filter((block) => block.is_active === true)
            .map((block) => ({
              id: block.uuid,
              name: block.block_name,
              organization_id: organizationId,
            }))
        );

        totalPages = Math.ceil(result.total / result.page_size);
        page++;
      }

      blocks = blocksData;
    } catch (error) {
      console.error("Error fetching blocks:", error);
      blocks = [];
    } finally {
      loadingBlocks = false;
    }
  }

  async function fetchSchools(blockId) {
    if (!blockId) {
      schools = [];
      return;
    }
    try {
      loadingSchools = true;
      let page = 1;
      const size = 50;
      let totalPages = 1;
      let allSchools = [];

      while (page <= totalPages) {
        const response = await apiClient(
          `/apis/schools?block_uuid=${blockId}&page=${page}&page_size=${size}`
        );
        if (!response) {
          loadingSchools = false;
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch schools: page - ${page}`);
        }

        const result = await response.json();
        if (!result) throw new Error("Unexpected API response");

        const data = result.data || [];
        allSchools.push(
          ...data
            .filter((school) => school.is_active === true)
            .map((school) => ({
              id: school.uuid,
              name: school.school_name,
              udise_code: school.udise_code,
            }))
        );

        totalPages = Math.ceil(result.total / result.page_size);
        page++;
      }

      schools = allSchools;
    } catch (error) {
      console.error("Error fetching schools:", error);
      schools = [];
    } finally {
      loadingSchools = false;
    }
  }

  // ---------------------- Input and Dropdown Related Functions ----------------------

  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
    validationErrors[name] = "";
  }

  async function handleOrganizationSelect(event) {
    const data = event.detail;
    selectedOrganization.id = data.selectedItemId;
    selectedOrganization.name = data.selectedItemName;
    formData.organization_id = data.selectedItemId;
    validationErrors.organization_id = "";

    // Reset dependent fields
    selectedBlock = { id: null, name: "" };
    selectedSchool = { id: null, name: "" };
    formData.block_id = null;
    formData.school_id = null;
    schools = [];

    if (data.selectedItemId) {
      await fetchBlocks(data.selectedItemId);
    } else {
      blocks = [];
    }
  }

  function handleOrganizationCancel() {
    selectedOrganization.id = null;
    selectedOrganization.name = "";
    formData.organization_id = null;
    validationErrors.organization_id = "";

    selectedBlock = { id: null, name: "" };
    selectedSchool = { id: null, name: "" };
    formData.block_id = null;
    formData.school_id = null;
    blocks = [];
    schools = [];
  }

  function handleBlockSelect(event) {
    const data = event.detail;
    selectedBlock.id = data.selectedItemId;
    selectedBlock.name = data.selectedItemName;
    formData.block_id = data.selectedItemId;
    validationErrors.block_id = "";

    selectedSchool = { id: null, name: "" };
    formData.school_id = null;
    schools = [];

    if (data.selectedItemId) {
      fetchSchools(data.selectedItemId);
    }
  }

  function handleBlockCancel() {
    selectedBlock.id = null;
    selectedBlock.name = "";
    formData.block_id = null;
    validationErrors.block_id = "";

    selectedSchool = { id: null, name: "" };
    formData.school_id = null;
    schools = [];
  }

  function handleSchoolSelect(event) {
    const data = event.detail;
    selectedSchool.id = data.selectedItemId;
    selectedSchool.name = data.selectedItemName;
    formData.school_id = data.selectedItemId;
    validationErrors.school_id = "";
  }

  function handleSchoolCancel() {
    selectedSchool.id = null;
    selectedSchool.name = "";
    formData.school_id = null;
    validationErrors.school_id = "";
  }

  function handleExamModeSelect(event) {
    const data = event.detail;
    formData.exam_mode = data.selectedItemId;
    validationErrors.exam_mode = "";
  }

  function handleExamModeCancel() {
    formData.exam_mode = "";
    validationErrors.exam_mode = "";
  }

  function resetErrorMessage() {
    errorMessage = {
      type: "",
      message: "",
      show: false,
    };
  }

  function validateForm() {
    let isValid = true;
    validationErrors = {
      exam_name: "",
      exam_mode: "",
      organization_id: "",
      block_id: "",
      school_id: "",
    };

    if (!formData.exam_name.trim()) {
      validationErrors.exam_name = "Exam name is required";
      isValid = false;
    }

    if (!formData.exam_mode) {
      validationErrors.exam_mode = "Exam mode is required";
      isValid = false;
    }

    return isValid;
  }

  // --------------------- Submission Handler --------------------------

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    submitting = true;
    resetErrorMessage();

    const payload = {
      exam_name: formData.exam_name.trim(),
      total_time: parseInt(formData.total_time),
      exam_mode: formData.exam_mode,
      organization_id: formData.organization_id || null,
      block_id: formData.block_id || null,
      school_id: formData.school_id || null,
    };

    try {
      const endpoint =
        mode === "edit" && initialData?.exam_code
          ? `/apis/v2/exams/${initialData.exam_code}`
          : "/apis/v2/exams";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await apiClient(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response) {
        return;
      }

      if (response.ok) {
        const result = await response.json();
        submitting = false;

        // Dispatch success event with result
        dispatch("success", {
          data: result,
          mode,
        });
      } else {
        const error = await response.json().catch(() => ({}));
        errorMessage = {
          type: "error",
          message:
            error.error ||
            error.message ||
            `Failed to ${mode === "edit" ? "update" : "create"} exam. Please try again.`,
          show: true,
        };
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      errorMessage = {
        type: "error",
        message: "An unexpected error occurred. Please try again.",
        show: true,
      };
    } finally {
      submitting = false;
    }
  }

  // ----------------------- General Functions ---------------------------

  function handleCancel() {
    dispatch("cancel");
  }
</script>

<div class="bg-white text-dark-gray">
  <div
    class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 text-dark-gray"
  >
    <h2 class="text-base sm:text-lg font-semibold text-dark-gray">
      {mode === "edit" ? "Edit Exam Metadata" : "Create New Exam"}
    </h2>
  </div>

  <form class="px-6 py-4 space-y-6" on:submit|preventDefault={handleSubmit}>
    <!-- Error Notification -->
    {#if errorMessage.show}
      <InlineNotification
        kind={errorMessage.type}
        title={errorMessage.message}
        on:close={resetErrorMessage}
      >
        <span slot="actions">
          <Button btnType="secondary" on:click={handleSubmit}>Retry</Button>
        </span>
      </InlineNotification>
    {/if}

    <!-- Basic Information Section -->
    <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
      <h3 class="text-sm sm:text-base font-semibold text-dark-gray mb-3">
        Basic Information
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Exam Name -->
        <InputField
          label="Exam Name"
          name="exam_name"
          type="text"
          placeholder="Enter exam name"
          required={true}
          value={formData.exam_name}
          validationErrors={validationErrors.exam_name}
          on:handleInputData={handleInputData}
        />

        <!-- Total Time -->
        <InputField
          label="Total Time (minutes)"
          name="total_time"
          type="number"
          placeholder="Enter total time in minutes"
          value={formData.total_time}
          validationErrors={validationErrors.total_time}
          on:handleInputData={handleInputData}
          min="1"
        />
      </div>

      <!-- Exam Mode -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableComboBox
          label="Exam Mode"
          placeholder="Select exam mode"
          options={examModes}
          selectedItemId={formData.exam_mode}
          selectedItemName={examModes.find((m) => m.id === formData.exam_mode)
            ?.name || ""}
          validationErrors={validationErrors.exam_mode}
          required={true}
          on:handleDispatchComboBoxData={handleExamModeSelect}
          on:handleDispatchFilterData={handleExamModeCancel}
        />
      </div>
    </div>

    <!-- Organization & Location Section -->
    {#if showOrganizationSection}
      <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
        <h3 class="text-sm sm:text-base font-semibold text-dark-gray mb-3">
          Organization & Location (Optional)
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Organization -->
          <SearchableComboBox
            label="Organization"
            placeholder="Select organization (optional)"
            options={organizations}
            selectedItemId={selectedOrganization.id}
            selectedItemName={orgNameForAdmin && selectedOrganization.id
              ? orgNameForAdmin
              : selectedOrganization.name}
            validationErrors={validationErrors.organization_id}
            loading={loadingOrganizations}
            disabled={disableOrgDropdown}
            on:handleDispatchComboBoxData={handleOrganizationSelect}
            on:handleDispatchFilterData={handleOrganizationCancel}
          />

          <!-- Block -->
          <SearchableComboBox
            label="Region"
            placeholder={"Select Block (optional)"}
            options={blocks}
            selectedItemId={selectedBlock.id}
            selectedItemName={selectedBlock.name}
            validationErrors={validationErrors.block_id}
            loading={loadingBlocks}
            disabled={!selectedOrganization.id || disableBlockDropdown}
            on:handleDispatchComboBoxData={handleBlockSelect}
            on:handleDispatchFilterData={handleBlockCancel}
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- School -->
          <SearchableComboBox
            label="School"
            placeholder={"Select school (optional)"}
            options={schools}
            selectedItemId={selectedSchool.id}
            selectedItemName={selectedSchool.name}
            validationErrors={validationErrors.school_id}
            loading={loadingSchools}
            disabled={!selectedBlock.id || disableSchoolDropdown}
            on:handleDispatchComboBoxData={handleSchoolSelect}
            on:handleDispatchFilterData={handleSchoolCancel}
          />
        </div>
      </div>
    {/if}

    <!-- Form actions -->
    <div class="flex justify-end gap-3 pt-4">
      <Button
        btnType="secondary"
        type="button"
        on:click={handleCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button btnType="primary" type="submit" disabled={submitting}>
        {#if submitting}
          <LoadingSpinner size="small" color="white" />
          <span class="ml-2"
            >{mode === "edit" ? "Saving..." : "Creating..."}</span
          >
        {:else}
          {mode === "edit" ? "Save Changes" : "Start Exam Creation"}
          {#if mode === "add"}
            <ArrowRight size={20} />
          {/if}
        {/if}
      </Button>
    </div>
  </form>
</div>
