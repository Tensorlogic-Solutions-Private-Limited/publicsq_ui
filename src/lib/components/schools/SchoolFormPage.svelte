<script>
  import { onMount, onDestroy } from "svelte";
  import { authStore } from "$lib/stores/authStore";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import {
    message as schoolMessage,
    showAddAdminBtn as schoolShowAddAdminBtn,
    addAdminBtnText as schoolAddAdminBtnText,
    msgType as schoolMsgType,
  } from "/src/routes/(protected)/schools/schoolStore.js";
  import {
    message as regionMessage,
    showAddAdminBtn as regionShowAddAdminBtn,
    addAdminBtnText as regionAddAdminBtnText,
    msgType as regionMsgType,
  } from "/src/routes/(protected)/regions/regionStore.js";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import MultiSelect from "$lib/components/reusable/MultiSelect.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import TextDescriptionField from "$lib/components/reusable/TextDescriptionField.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import ImageUpload from "$lib/components/reusable/ImageUpload.svelte";

  export let mode = "add";
  export let endpoint = "";
  export let existingSchool = null;
  export let states = [];

  let validationErrors = {};
  let isLoading = false;
  let apiError = "";

  // dropdown fields
  let blocks = [];
  let organizations = [];
  let orgNameForBlockAdmin = "";
  let boards = [];
  let classLevels = [];
  let allBlocks = [];

  let disableOrgDropdown = false;
  let disableBlockDropdown = false;
  let disableStateDropdown = false;
  let orgsLoading = false;
  let blocksLoading = false;
  let boardsLoading = false;

  // school logo fields 
  let schoolLogo = null;
  let logoPreview = '';
  let logoError = '';

  let formData = {
    udise_code: "",
    school_name: "",
    address: "",
    local_govt_body_id: "",
    block_uuid: "",
    organization_uuid: "",
    state_id: "",
    // contact_persons: "",
    // contact_numbers: "",
    // emails: "",
    boards: [],
    class_levels: [],
    is_active: true,
  };

  const statusOptions = [
    { id: true, name: "Active" },
    { id: false, name: "Inactive" },
  ];

  const localGovtOptions = [
    { id: "1", name: "Corporation" },
    { id: "2", name: "Municipality" },
    { id: "3", name: "Panchayath" },
    { id: "4", name: "Other" },
  ];


  const stateOptions = (states || []).map((state) => ({
    id: state.id,
    name: state.name,
  }));

  let filteredStateOptions = [];

  let fromParam = $page.url.searchParams.get("from") || "";

  $: filterStateByOrganization(formData?.organization_uuid);
  $: filterRegionByState(formData.organization_uuid, formData.state_id);

  // --------------------------------- Retry Mechanism  ------------------------------------
      let apiRespMsg = {
      type: "", // success or error
      message: "",
      cbFn: null // for retry function
    };

    function resetErrorStates() {
      apiRespMsg = {
        type: "",
        message: "",
        cbFn: null
      };
    }


  // --------------------------------- Filtering Functions ------------------------------------

  function filterStateByOrganization(orgId) {
    if (!orgId) {
      filteredStateOptions = [];
      return;
    }
    // Filter blocks for selected organization
    const orgBlocks = allBlocks.filter(
      (block) => String(block.organization?.uuid) === String(orgId)
    );
    // Get unique state ids from filtered blocks
    const uniqueStateIds = [
      ...new Set(
        orgBlocks
          .map((block) => block.stateId || block.state_id)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    filteredStateOptions = stateOptions.filter((state) =>
      uniqueStateIds.includes(String(state.id))
    );
  }

  function filterRegionByState(orgId, stateId) {
    if (!orgId || !stateId) {
      blocks = [];
      return;
    }
    // Filter blocks for selected organization and state (type-safe)
    blocks = allBlocks.filter(
      (block) =>
        String(block.organization?.uuid) === String(orgId) &&
        String(block.stateId) === String(stateId)
    );
  }

  // --------------------- Data Fetching for Dropdowns -------------------------

  // Load blocks data for dropdown with pagination
  async function loadBlocks() {
    blocksLoading = true;
    try {
      let page = 1;
      const size = 50;
      let totalPages = 1;
      let allBlocksData = [];

      while (page <= totalPages) {
        const response = await apiClient(
          `/apis/blocks?page=${page}&page_size=${size}`
        );
        if (!response || !response.ok)
          throw new Error(`Failed to fetch regions: page - ${page}`);

        const data = await response.json();
        if (!data) throw new Error("Unexpected API response");

        allBlocksData.push(
          ...data.data.map((block) => ({
            id: block.uuid,
            name: block.block_name,
            organization: block.organization,
            stateId: block.state_id,
          }))
        );

        totalPages = Math.ceil(data.total / data.page_size);
        page++;
      }

      // Store all blocks for filtering later
      allBlocks = allBlocksData;

      // Initially, blocks array will be empty until an organization is selected
      blocks = [];
      // Clear previous error if any
      validationErrors.block_uuid = "";
      validationErrors.state_id = "";
    } catch (error) {
      console.error("Error loading region:", error);
      blocks = [];
      allBlocks = [];
      validationErrors.block_uuid = "Failed to load regions.";
      validationErrors.state_id = "Failed to load states.";
    } finally {
      blocksLoading = false;
    }
  }

  // Load organizations data for dropdown with pagination
  async function loadOrganizations() {
    orgsLoading = true;
    try {
      let page = 1;
      const size = 50;
      let totalPages = 1;
      let allOrgs = [];

      while (page <= totalPages) {
        const response = await apiClient(
          `/apis/orgs?page=${page}&page_size=${size}`
        );
        if (!response || !response.ok)
          throw new Error(`Failed to fetch organizations: page - ${page}`);

        const data = await response.json();
        
        if (!data) throw new Error("Unexpected API response");

        allOrgs.push(
          ...data.data.map((org) => ({
            id: org.uuid,
            name: org.org_name,
          }))
        );

        totalPages = Math.ceil(data.total / data.page_size);
        page++;
      }

      organizations = allOrgs;
      // Clear previous error if any
      validationErrors.organization_uuid = "";
    } catch (error) {
      console.error("Error loading organizations:", error);
      organizations = [];
      validationErrors.organization_uuid = "Failed to load organizations.";
    } finally {
      orgsLoading = false;
    }
  }

  // Load boards data from API (not paginated)
  async function loadBoards() {
    boardsLoading = true;
    try {
      const response = await apiClient("/apis/boards");
      if (!response || !response.ok) throw new Error("Failed to fetch boards");

      const data = await response.json();
      if (!data) throw new Error("Unexpected API response");

      boards = data.map((board) => ({
        id: board.board_id,
        name: board.board_name,
      }));
    } catch (error) {
      console.error("Error loading boards:", error);
      boards = [];
    } finally {
      boardsLoading = false;
    }
  }

  // Initialize class levels (static 1-12)
  function loadClassLevels() {
    classLevels = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      name: `Class ${i + 1}`,
    }));
  }

  // ----------------------- FILE RELATED FUNCTION ----------------------------
    function handleFileSelected(event) {
    const { file, preview } = event.detail;
    schoolLogo = file;
    logoPreview = preview;
    logoError = '';
  }
  // ----------------------- Form Input Related Functions ----------------------------

  function handleInputData(event) {
    const { name, value } = event.detail;
    formData[name] = value;
    // Clear validation error when user types
    if (validationErrors[name]) {
      validationErrors[name] = "";
      validationErrors = validationErrors;
    }
  }

  // ------------------ Multi select Related Functions ----------------------------------

  function handleMultiSelectChange(event, fieldName) {
    formData[fieldName] = event.detail.selectedValues;
    if (validationErrors[fieldName]) {
      validationErrors[fieldName] = "";
      validationErrors = validationErrors;
    }
  }

  // ------------------ Dropdown Related Functions ----------------------------------

  function handleDropdownSelect(event, fieldName) {
    const { selectedOption } = event.detail;
    formData[fieldName] = selectedOption?.id || "";

    // If changing organization, clear state and block selection
    if (fieldName === "organization_uuid") {
      formData.state_id = "";
      formData.block_uuid = "";
      filterStateByOrganization(formData.organization_uuid);
      blocks = [];
    }

    // If changing state, clear block selection and update blocks
    if (fieldName === "state_id") {
      formData.block_uuid = "";
      filterRegionByState(formData.organization_uuid, formData.state_id);
    }

    formData = formData;

    // Clear validation error when user selects
    if (validationErrors[fieldName]) {
      validationErrors[fieldName] = "";
      validationErrors = validationErrors;
    }
  }

  function handleDropdownCancel(event, fieldName) {
    // Clear the selected value for this field
    formData[fieldName] = "";

    // If clearing organization, also clear block
    if (fieldName === "organization_uuid") {
      formData.block_uuid = "";
      formData.state_id = "";
      filteredStateOptions = [];
      blocks = [];
    }
    if (fieldName === "state_id") {
      formData.block_uuid = "";
      blocks = [];
    }

    formData = formData;
  }

  // ----------------------- Form Validation --------------------------------

  function validateForm() {
    validationErrors = {};

    // Required field validation
    const requiredFields = [
      "udise_code",
      "school_name",
      "address",
      "block_uuid",
      "organization_uuid",
      "state_id",
      // "contact_persons",
      // "contact_numbers",
      "boards",
      "class_levels",
    ];

    requiredFields.forEach((field) => {
      let isEmpty;
      if (field === "boards" || field === "class_levels") {
        isEmpty = !formData[field] || formData[field].length === 0;
      } else {
        isEmpty = !formData[field] || String(formData[field]).trim() === "";
      }

      if (isEmpty) {
        let fieldLabel;
        if (field === "organization_uuid") {
          fieldLabel = "Organization";
        } else if (field === "block_uuid") {
          fieldLabel = "Block";
        } else if (field === "boards") {
          fieldLabel = "Board";
        } else if (field === "class_levels") {
          fieldLabel = "Class Levels";
        } else if (field === "state_id") {
          fieldLabel = "State";
        } else {
          fieldLabel = field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
        }
        validationErrors[field] = `${fieldLabel} is required.`;
      }
    });

    // Contact persons validation
    if (formData.contact_persons) {
      const persons = formData.contact_persons
        .split(",")
        .map((name) => name.trim());
      const hasEmptyNames = persons.some((name) => !name);
      const nameRegex = /^[a-zA-Z\s.]+$/;
      const hasInvalidChars = persons.some(
        (name) => name && !nameRegex.test(name)
      );

      if (hasEmptyNames) {
        validationErrors.contact_persons =
          "Contact person names cannot be empty";
      } else if (hasInvalidChars) {
        validationErrors.contact_persons =
          "Contact person names should only contain letters, spaces, and dots";
      }
    }

    // Email validation
    if (formData.emails) {
      const emails = formData.emails.split(",").map((email) => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const areEmailsValid = emails.every(
        (email) => !email || emailRegex.test(email)
      );

      if (!areEmailsValid) {
        validationErrors.emails = "Please enter valid email addresses";
      }
    }

    // // Phone number validation
    // if (formData.contact_numbers) {
    //   const phones = formData.contact_numbers
    //     .split(",")
    //     .map((phone) => phone.trim());
    //   const phoneRegex = /^\d{10}$/;
    //   const areNumbersValid = phones.every((phone) => phoneRegex.test(phone));

    //   if (!areNumbersValid) {
    //     validationErrors.contact_numbers =
    //       "Please enter valid 10-digit phone numbers";
    //   }
    // }

    return Object.keys(validationErrors).length === 0;
  }

  // HANDLE THE SCHOOL IMAGE UPLOAD FUNCTION
  async function  handleImageUpload(udise_code, logo){
    try {
      const imageFormData = new FormData() ; 
      imageFormData.append('udise_code',udise_code) ; 
      imageFormData.append('logo',logo) ; 

      const imageResponse = await apiClient(
        '/apis/schools/images', {
          method: 'POST',
          body: imageFormData
        }
      ) ; 
      if(!imageResponse || !imageResponse.ok){
        throw new Error('Logo upload failed') ; 
      }
      apiRespMsg = {
      type: "success",
      message: "Logo uploaded successfully",
      cbFn: null
    };
    return true ; 
    } catch (error) {
      // TODO HANDLE THE MESSAGE FOR EDIT 
      apiRespMsg = { 
        type:  "warning", 
        message: "School created successfully but logo upload failed. You can try uploading the logo again.",
        cbFn : ()=> handleImageUpload(udise_code, logo)
      } ; 
      return false ; 
    }
  }

  // ------------------------- Handle Submissions ------------------------------

async function handleSubmit(event) {
  event.preventDefault();
  if (isLoading) return;

  if (!validateForm()) {
    validationErrors = { ...validationErrors };
    return;
  }

  isLoading = true;
  resetErrorStates();

  try {
    // 1. Submit form data first
    const method = mode === "edit" ? "PUT" : "POST";
    const formResponse = await apiClient(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (!formResponse || !formResponse.ok) {
      if(formResponse === null) {
        throw new Error("Failed to submit school");
      }
      const errorMessage = await formResponse.json();
      throw new Error(errorMessage?.error || "Failed to submit school");
    }

    const result = await formResponse.json();

    // 2. If there's a logo to upload, submit it
    if (schoolLogo && result?.udise_code) {
        const logoUpload = await handleImageUpload(result.udise_code, schoolLogo) ;       
        if(!logoUpload) return ; 
    }

    // Handle success routing only if no errors
    if (apiRespMsg.type !== "error" && apiRespMsg.type !== "warning") {
      if (fromParam.startsWith("/regions")) {
        regionMsgType.set("success");
        regionMessage.set(`Successfully ${mode === "add" ? "added" : "updated"} school "${result.school_name}"`);
        regionShowAddAdminBtn.set(false);
        goto(fromParam);
      } else if (fromParam.startsWith("/schools")) {
        schoolMsgType.set("success");
        schoolMessage.set(`Successfully ${mode === "add" ? "added" : "updated"} school "${result.school_name}"`);
        schoolShowAddAdminBtn.set(false);
        goto(fromParam);
      } else {
        goto(`/schools/${result.id}/details`);
      }
    }
  } catch (error) {
    console.error("Error submitting school:", error);
    apiRespMsg = {
      type: "error",
      message: error.message || "Failed to submit school",
      cbFn: () => handleSubmit(event)
    };
  } finally {
    isLoading = false;
  }
}
  // ---------------------- Lifecycle Functions ------------------------

  onMount(async () => {
    fromParam = $page.url.searchParams.get("from");
    const isFromRegion = fromParam.startsWith("/regions");

    // First load organizations and blocks
    await Promise.all([loadOrganizations(), loadBlocks()]);
    await loadBoards();
    loadClassLevels();

    if (mode === "add") {
      const unsubscribe = authStore.subscribe(async (user) => {
        if (!user || Object.keys(user)?.length === 0) return;
        let role = (user.roleCode || user.role || "").toLowerCase();

        // --- Super Admin ---
        if (role === "super_admin") {
  
          let orgId = $page.url.searchParams.get("orgId") || user.orgId ;
          if (orgId) {
            formData.organization_uuid = orgId.toString();
            // orgNameForBlockAdmin = user.orgName || "";
          }
          let blockId = $page.url.searchParams.get("blockId") || user.blockId ;
          if (blockId) {
            formData.block_uuid = blockId.toString();
          }
          let stateId =  $page.url.searchParams.get("stateId") || user.stateId;
          if (stateId) {
            formData.state_id = stateId.toString();
          } else if (formData.block_uuid) {
            // If blockId is set but stateId is not, get stateId from block details
            let block = allBlocks.find(b => String(b.id) === String(formData.block_uuid));
            if (block && block.stateId) {
              formData.state_id = block.stateId.toString();
            }
          }
          // If coming from regions page, always disable all three dropdowns
          if (isFromRegion) {
            disableOrgDropdown = true;
            disableStateDropdown = true;
            disableBlockDropdown = true;
          } else {
            disableOrgDropdown = false;
            disableStateDropdown = false;
            disableBlockDropdown = false;
          }
        }

        // --- Admin/Admin User ---
        else if (role === "admin" || role === "admin_user") {
          
          let orgId = $page.url.searchParams.get("orgId") || user.orgId ;
          if (orgId) {
            formData.organization_uuid = orgId.toString();
            orgNameForBlockAdmin = user.orgName || "";
          }
         
          let blockId = $page.url.searchParams.get("blockId") || user.blockId;
          if (blockId) {
            formData.block_uuid = blockId.toString();
          }
        
          let stateId = $page.url.searchParams.get("stateId") || user.stateId;
          if (stateId) {
            formData.state_id = stateId.toString();
          } else if (formData.block_uuid) {
            let block = allBlocks.find(b => String(b.id) === String(formData.block_uuid));
            if (block && block.stateId) {
              formData.state_id = block.stateId.toString();
            }
          }
          disableOrgDropdown = true;
          disableStateDropdown = isFromRegion ? true : false;
          disableBlockDropdown = isFromRegion ? true : false;
        }

        // --- Block Admin ---
        else if (role === "block_admin") {
         
          let orgId, blockId, stateId, orgName;
          if (isFromRegion) {
            orgId = $page.url.searchParams.get("orgId");
            blockId = $page.url.searchParams.get("blockId");
            stateId = $page.url.searchParams.get("stateId");
            orgName = $page.url.searchParams.get("orgName") || user.orgName || "";
          } else {
            orgId = user.orgId;
            blockId = user.blockId;
            stateId = user.stateId;
            orgName = user.orgName || "";
          }
          if (orgId) {
            formData.organization_uuid = orgId.toString();
            orgNameForBlockAdmin = orgName;
          }
          if (blockId) {
            formData.block_uuid = blockId.toString();
          }
          if (stateId) {
            formData.state_id = stateId.toString();
          } else if (blockId) {
            let block = allBlocks.find(b => String(b.id) === String(blockId));
            if (block && block.stateId) {
              formData.state_id = block.stateId.toString();
            }
          }
          disableOrgDropdown = true;
          disableStateDropdown = true;
          disableBlockDropdown = true;
        }

        // --- Fallback for any other role ---
        else {
          // Try to get from params if present
          let orgId = $page.url.searchParams.get("orgId");
          let blockId = $page.url.searchParams.get("blockId");
          let stateId = $page.url.searchParams.get("stateId");
          if (orgId) formData.organization_uuid = orgId.toString();
          if (blockId) formData.block_uuid = blockId.toString();
          if (stateId) formData.state_id = stateId.toString();
          disableOrgDropdown = false;
          disableStateDropdown = false;
          disableBlockDropdown = false;
        }

        // Filtering
        if (formData.organization_uuid) filterStateByOrganization(formData.organization_uuid);
        if (formData.state_id) filterRegionByState(formData.organization_uuid, formData.state_id);

        formData = { ...formData };
      });
      return () => unsubscribe();
    } else if (mode === "edit" && existingSchool) {
      formData = {
        ...existingSchool,
        is_active: existingSchool.is_active ?? true,
      };
      let role = ($authStore?.roleCode || $authStore?.role || "").toLowerCase();

      // Role-based disables, but region page disables always take precedence
      if (role === "super_admin") {
        disableOrgDropdown = isFromRegion ? true : false;
        disableStateDropdown = isFromRegion ? true : false;
        disableBlockDropdown = isFromRegion ? true : false;
      } else if (role === "admin" || role === "admin_user") {
        disableOrgDropdown = true;
        disableStateDropdown = isFromRegion ? true : false;
        disableBlockDropdown = isFromRegion ? true : false;
      } else if (role === "block_admin") {
        disableOrgDropdown = true;
        disableStateDropdown = true;
        disableBlockDropdown = true;
        orgNameForBlockAdmin = $authStore?.orgName || "";
        if (isFromRegion) {
          disableOrgDropdown = true;
          disableStateDropdown = true;
          disableBlockDropdown = true;
        }
      }
      // If we're in edit mode and have an organization, filter blocks
      if (formData.organization_uuid) {
        filterStateByOrganization(formData.organization_uuid);
      }
      if (formData.state_id) {
        filterRegionByState(formData.organization_uuid, formData.state_id);
      }
    }
  });
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 text-dark-gray">
  {#if apiError}
    <div class="mb-4">
      <InlineNotification
        kind="error"
        title={apiError}
        hideCloseButton={true}
      />
    </div>
  {/if}

  <div
    class="bg-slate-50 rounded-xl shadow-lg border border-gray-100 transition-all duration-200"
  >
    <div
      class="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-base sm:text-lg font-semibold text-dark-gray">
            {mode === "edit" ? "Edit School" : "Add New School"}
          </h2>
        </div>
      </div>
    </div>

    <div class="px-6 py-6 bg-white">
      {#if apiRespMsg.message}
  <div class="mb-4">
    <InlineNotification
      kind={apiRespMsg.type}
      title={apiRespMsg.message}
      on:close={resetErrorStates}
    >
      <span slot="actions">
        {#if apiRespMsg.cbFn}
          <Button 
            btnType="secondary" 
            on:click={apiRespMsg.cbFn}
          >
            {apiRespMsg.type === "error" ? "Retry" : "Try Again"}
          </Button>
        {/if}
      </span>
    </InlineNotification>
  </div>
{/if}

      <form on:submit|preventDefault={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Basic Details -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
            <h3 class="text-base font-semibold text-dark-gray">Basic Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="UDISE+ Code"
                name="udise_code"
                placeholder="Enter UDISE+ Code"
                value={formData.udise_code}
                required={true}
                on:handleInputData={handleInputData}
                error={validationErrors.udise_code}
              />
              <InputField
                label="School Name"
                name="school_name"
                placeholder="Enter school name"
                value={formData.school_name}
                required={true}
                on:handleInputData={handleInputData}
                error={validationErrors.school_name}
              />
            </div>
            <TextDescriptionField
              label="Address"
              name="address"
              placeholder="Enter school address"
              value={formData.address}
              required={true}
              on:handleInputData={handleInputData}
              error={validationErrors.address}
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                title="Board"
                options={boards}
                required={true}
                selectedValues={formData.boards}
                placeholder="Select boards"
                error={validationErrors.boards}
                loading={boardsLoading}
                on:change={(e) => handleMultiSelectChange(e, "boards")}
              />
              <MultiSelect
                title="Class Levels"
                options={classLevels}
                required={true}
                selectedValues={formData.class_levels}
                placeholder="Select class levels"
                error={validationErrors.class_levels}
                on:change={(e) => handleMultiSelectChange(e, "class_levels")}
              />
            </div>
          </div>

          <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
            <h3 class="text-base font-semibold text-dark-gray">
              Location & Organization
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DropDown
                label="Local Government Body"
                name="local_govt_body_id"
                title="Local Government"
                options={localGovtOptions}
                selectedItemUuid={formData.local_govt_body_id}
                selectedItemName={localGovtOptions.find(
                  (opt) => opt.id === formData.local_govt_body_id
                )?.name || ""}
                placeholder="Select local government body"
                on:handleDispatchFilterData={(e) =>
                  handleDropdownSelect(e, "local_govt_body_id")}
                on:handleCancelSelection={(e) =>
                  handleDropdownCancel(e, "local_govt_body_id")}
                validationErrors={validationErrors.local_govt_body_id}
              />
              <SearchableComboBox
                label="Organization"
                name="organization_uuid"
                options={organizations}
                selectedItemId={formData.organization_uuid}
                selectedItemName={orgNameForBlockAdmin &&
                formData.organization_uuid
                  ? orgNameForBlockAdmin
                  : organizations.find(
                      (opt) => opt.id === formData.organization_uuid
                    )?.name || ""}
                required={true}
                placeholder="Select organization"
                disabled={disableOrgDropdown}
                loading={orgsLoading}
                on:handleDispatchComboBoxData={e =>
                  handleDropdownSelect(
                    { detail: { selectedOption: { id: e.detail.selectedItemId, name: e.detail.selectedItemName } } },
                    "organization_uuid"
                  )
                }
                on:handleDispatchFilterData={(e) =>
                  handleDropdownCancel(e, "organization_uuid")}
                validationErrors={validationErrors.organization_uuid}
              />
              <SearchableComboBox
                label="State"
                name="state_id"
                title="State"
                options={filteredStateOptions}
                selectedItemId={formData.state_id}
                selectedItemName={filteredStateOptions.find(
                  (opt) => String(opt.id) === String(formData.state_id)
                )?.name || ""}
                required={true}
                placeholder="Select state"
                disabled={!formData.organization_uuid || disableStateDropdown}
                loading={blocksLoading}
                on:handleDispatchComboBoxData={e =>
                  handleDropdownSelect(
                    { detail: { selectedOption: { id: e.detail.selectedItemId, name: e.detail.selectedItemName } } },
                    "state_id"
                  )
                }
                on:handleDispatchFilterData={(e) =>
                  handleDropdownCancel(e, "state_id")}
                validationErrors={validationErrors.state_id}
              />
              <SearchableComboBox
                label="Region"
                name="block_uuid"
                title="Region"
                description="Choose the region where this school is located"
                options={blocks}
                selectedItemId={formData.block_uuid}
                selectedItemName={(formData.block_uuid &&
                  blocks.find(
                    (opt) => String(opt.id) === String(formData.block_uuid)
                  )?.name) ||
                  ""}
                required={true}
                disabled={!formData.organization_uuid ||
                  !formData.state_id ||
                  disableBlockDropdown}
                loading={blocksLoading}
                placeholder="Select region"
                on:handleDispatchComboBoxData={e =>
                  handleDropdownSelect(
                    { detail: { selectedOption: { id: e.detail.selectedItemId, name: e.detail.selectedItemName } } },
                    "block_uuid"
                  )
                }
                on:handleDispatchFilterData={(e) =>
                  handleDropdownCancel(e, "block_uuid")}
                validationErrors={validationErrors.block_uuid}
              />
            </div>
          </div>
        </div>

        <!-- Right Column - Media Upload -->
        <div class="space-y-6">
          <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
            <h3 class="text-base font-semibold text-dark-gray">School Logo</h3>
            <ImageUpload
              label="School Logo"
              id="school-logo"
              recommendedDimensions="240 x 240px"
              error={logoError}
              preview={logoPreview}
              on:fileSelected={handleFileSelected}
              on:error={(e) => logoError = e.detail}
            />
          </div>

          <!-- Status dropdown for edit mode -->
          {#if mode === "edit"}
            <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
              <h3 class="text-base font-semibold text-dark-gray">Status</h3>
              <DropDown
                title="Status"
                placeholder="Select status"
                options={statusOptions}
                selectedItemUuid={formData.is_active}
                selectedItemName={formData.is_active ? "Active" : "Inactive"}
                on:handleDispatchFilterData={(e) => handleDropdownSelect(e, "is_active")}
                on:handleCancelSelection={(e) => handleDropdownCancel(e, "is_active")}
              />
            </div>
          {/if}
        </div>

        <!-- Form Actions -->
        <div class="lg:col-span-3 flex items-center justify-end gap-2">
          <Button
            btnType="secondary"
            on:click={() => window.history.back()}
            disabled={isLoading}
            title="Cancel"
          >
            Cancel
          </Button>
          <Button
            btnType="primary"
            disabled={isLoading}
            title="Submit"
            type="submit"
          >
            {#if isLoading}
              <LoadingSpinner />
            {:else}
              Submit
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
