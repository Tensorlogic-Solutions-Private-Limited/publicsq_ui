<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { page } from "$app/stores";
  import Button from "$lib/components/reusable/Button.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import { ROLES, isAdminRole } from "$lib/utils/roles.js";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import { tick } from "svelte";
  
  import {
    organizationNotification,
    showOrganizationNotification,
    hideOrganizationNotification,
  } from "../../../routes/(protected)/organizations/organizationStore.js";
  import {
    message as regionMessage,
    msgType as regionMsgType,
  } from "../../../routes/(protected)/regions/regionStore.js";
  import {
    message as schoolMessage,
    msgType as schoolMsgType,
  } from "../../../routes/(protected)/schools/schoolStore.js";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  
  import { apiClient } from "$lib/utils/apiClient.js";
  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Props
  export let currentUser = null; // Pass this from parent component
  export let user = null; // User object for edit mode, null for add mode
  export let currentUserRole = ""; // Role of the currently logged-in user
  export let mode = "add"; // "add" or "edit"
  export let loading = false; // Loading state
  let blockDetailsLoaded = false;
  let roleToDisable = "";
  let roleHeader = "";
  // Component state
  let error = null;
  let formData = {  
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role_id: "",
    organization_id: null,
    block_id: null,
    school_id: null,
    is_active: true,
    organization_uuid: null,
    block_uuid: null,
    school_uuid: null,
  };

  //  setup the org and block for the user
  // this will be used for block admin where we cannot fetch the details directly and we have to get the
  // org and block name from auth store.

  let userOrgName = { id: null, name: "" };
  let userBlockName = { id: null, name: "" };

  $: if (currentUserRole === "block_admin") {
    if (currentUser) {
      userOrgName = {
        id: currentUser.orgId || null,
        name: currentUser.orgName || "",
      };
      userBlockName = {
        id: currentUser.blockId || null,
        name: currentUser.blockName || "",
      };
    }
    // for edit user form page
    else if (user) {
      userOrgName = {
        id: user.organization?.uuid || user.organization_id || null,
        name: user.organization?.org_name || user.orgName || "",
      };
      userBlockName = {
        id: user.block?.uuid || user.block_id || null,
        name: user.block?.block_name || user.blockName || "",
      };
    }
  }

  // variable for redirection
  const encodedReturnPath = $page.url.searchParams.get("from");
  $: notificationTarget = $page.url.searchParams.get("nt");
  let returnPath = null;

  // Variables for read-only fields
  let isRoleReadOnly = false;
  let isOrgReadOnly = false;
  let isBlockReadOnly = false;
  let isSchoolReadOnly = false;
  let blockPresetReadOnly = false;
  let orgLoadedForEdit = false;
  let blocksLoadedForEdit = false;
  let schoolsLoadedForEdit = false;
  let schoolPresetReadOnly = false;

  // Password state
  let passwordStrength = 0;
  let passwordFeedback = "";
  let passwordVisible = false;
  let passwordStrengthData = "";

  // Lookup data for dropdowns
  let roles = [];
  let organizations = [];
  let blocks = [];
  let schools = [];
  let initialFormDataSet = false;

  // Validation errors
  let validationErrors = {};
  let validationErrorsUsername = [];
  let validationErrorsFullName = [];
  let validationErrorsEmail = [];
  let validationErrorsPhone = [];
  let validationErrorsPassword = [];
  let validationErrorsConfirmPassword = [];
  let validationErrorsRole = "";
  let validationErrorsOrg = "";
  let validationErrorsBlock = "";
  let validationErrorsSchool = "";

  // For dropdown selection
  let selectedRoleName = "";
  let selectedOrgName = "";
  let selectedBlockName = "";
  let selectedSchoolName = "";

  if (encodedReturnPath) {
    returnPath = decodeURIComponent(encodedReturnPath);
  }

  $: if (
    formData.block_id &&
    formData.role_id === "teacher"
  ) {
    // loadSchools(formData.block_id);
  }

  // Debug function to log what's happening
  function logDebug(message, data) {
    // console.log(`[DEBUG] ${message}:`, data);
  }
  function togglePasswordVisibility() {
    passwordVisible = !passwordVisible;
  }

  // Initialize form data when user prop changes (in edit mode)
  $: if (user && mode === "edit" && !initialFormDataSet) {
    initialFormDataSet = true;

    logDebug("User data for initialization", user);

    // The role structure in the response is different - need to handle both formats
    let roleId = "";
    if (user.role) {
      // Handle both possible role structures
      roleId = user.role.role_code || user.role.id || "";
      logDebug("Role ID determined from user", roleId);
    }

    // Track if the user already has organization, region, and school
    orgLoadedForEdit = !!user.organization;
    blocksLoadedForEdit = !!user.block;
    schoolsLoadedForEdit = !!user.school;

    formData = {
      ...formData,
      username: user.username || "",
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role_id: roleId, // Use the extracted role code
      organization_id: user.organization?.uuid || user.organization_id || null,
      block_id: user.block?.uuid || user.block_id || null,
      school_id: user.school?.uuid || user.school_id || null,
      is_active: user.is_active !== undefined ? user.is_active : true,
    };

    logDebug("Initialized form data", formData);

    // Set selected names for dropdowns
    selectedRoleName = user.role?.role_name || "";
    selectedOrgName = user.organization?.org_name || "";
    selectedBlockName = user.block?.block_name || "";
    selectedSchoolName = user.school?.school_name || "";

    // Load related data if needed
    if (formData.organization_id) {
      loadBlocks(formData.organization_id);
    }

    if (formData.block_id) {
      loadSchools(formData.block_id);
    }

    setTimeout(() => {
      loading = false;
    }, 0);
  }

  $: canEditOrganization = [
    "super_admin",
    "admin",
    "admin_user"
  ].includes(currentUserRole);
  $: canEditBlock = ["super_admin", "admin", "admin_user"].includes(
    currentUserRole
  );
  $: isTeacherRole = formData.role_id === "teacher";

  // Add this reactive statement to your script section
  $: {
    // Determine which dropdowns should be enabled based on selected role
    if (!blockDetailsLoaded || currentUserRole !== "block_admin") {
      if (formData.role_id === "admin" || formData.role_id === "admin_user") {
        // Organization Admin or Organization User
        // Only organization dropdown should be enabled
        isBlockReadOnly = true;
        isSchoolReadOnly = true;

        // Clear dependent fields if they exist
        if (formData.block_id) {
          formData.block_id = null;
          selectedBlockName = "";
        }
        if (formData.school_id) {
          formData.school_id = null;
          selectedSchoolName = "";
        }
      } else if (formData.role_id === "block_admin") {
        // Region Admin
        // Organization and Region dropdowns should be enabled, School should be disabled
        isBlockReadOnly = false;
        isSchoolReadOnly = true;

        // Clear school field if it exists
        if (formData.school_id) {
          formData.school_id = null;
          selectedSchoolName = "";
        }
      } else if (formData.role_id === "teacher") {
        // Teacher - all dropdowns enabled
        isBlockReadOnly = false;
        isSchoolReadOnly = false;
      }
    }
  }


 $: if (organizations.length === 1 && !formData.organization_id && !isOrgReadOnly && mode === "add") {
  formData.organization_id = organizations[0].uuid;
  selectedOrgName = organizations[0].name;
  loadBlocks(organizations[0].uuid);
}

$: if (availableRoles.length === 1 && !formData.role_id && !isRoleReadOnly && mode === "add") {
  formData.role_id = availableRoles[0].id;
  selectedRoleName = availableRoles[0].name;
  isTeacherRole = availableRoles[0].id === "teacher";
}

$: if (blocks.length === 1 && !formData.block_id && !isBlockReadOnly && formData.organization_id && mode === "add") {
  formData.block_id = blocks[0].uuid;
  selectedBlockName = blocks[0].name;
  loadSchools(blocks[0].uuid);
}

$: if (schools.length === 1 && !formData.school_id && !isSchoolReadOnly && formData.block_id && mode === "add") {
  formData.school_id = schools[0].uuid;
  selectedSchoolName = schools[0].name;
}


  // Get available roles based on current user role
  $: availableRoles = getAvailableRoles(currentUserRole);

  // Filter roles based on the current user's role
  function getAvailableRoles(userRole) {
    const roleHierarchy = {
      super_admin: ["admin", "admin_user", "block_admin", "teacher"],
      admin: ["admin_user", "admin", "block_admin", "teacher"],
      admin_user: ["block_admin", "teacher"],
      block_admin: ["teacher"],
    };

    const allowedRoleCodes = roleHierarchy[userRole] || [];

    // Use the imported ROLES constant from your roles.js utility
    return ROLES.filter((role) => allowedRoleCodes.includes(role.id)).map(
      (role) => ({
        id: role.id,
        uuid: role.id,
        name: role.name,
        title: role.name,
      })
    );
  }
  function debugLog(message) {
    // console.log(`[UserForm] ${message}`);
  }
  // Load lookup data on component mount
  onMount(async () => {
    if (browser) {
      const url = new URL(window.location.href);
      const preset = url.searchParams.get("preset") === "true";

      if (currentUserRole === "block_admin" && (currentUser || user)) {
        try {
          // Set this flag to true
          blockDetailsLoaded = true;

          if (userOrgName.id) {
            organizations = [
              {
                id: userOrgName.id,
                uuid: userOrgName.id,
                name: userOrgName.name,
                title: userOrgName.name,
              },
            ];
          }
          // Set the form data
          formData.organization_id = userOrgName.id;
          selectedOrgName = userOrgName.name;
          isOrgReadOnly = true;

          if (userBlockName.id) {
            blocks = [
              {
                id: userBlockName.id,
                uuid: userBlockName.id,
                name: userBlockName.name,
                title: userBlockName.name,
              },
            ];
          }
          formData.block_id = userBlockName.id;
          selectedBlockName = userBlockName.name;
          isBlockReadOnly = true;

          // Load schools for this block
          await loadSchools(userBlockName.id);

          // Wait to ensure state is updated
          await tick();
        } catch (err) {
          console.error("Error setting up block admin details:", err);
        }
      }

      if (preset && mode === "add") {
        // Get IDs from URL params
        const role = url.searchParams.get("role");
        const orgId = url.searchParams.get("org_id");
        const blockId = url.searchParams.get("block_id");
        const schoolId = url.searchParams.get("school_id");

        // Update this variable to disable the required role after getting the values from searchParams
        roleToDisable = role;

        switch (roleToDisable) {
          case "admin":
            roleHeader = "Admin";
            break;
          case "admin_user":
            roleHeader = "Admin User";
            break;
          case "block_admin":
            roleHeader = "Region Admin";
            break;
          case "teacher":
            roleHeader = "Teacher";
            break;
          default:
            break;
        }

        // Set the role first if available
        if (role) {
          formData.role_id = role;
          const roleObj = ROLES.find((r) => r.id === role);
          if (roleObj) {
            selectedRoleName = roleObj.name;
          }
          isTeacherRole = role === "teacher";
          isRoleReadOnly = true;
        }

        // Load lookup data to get names for the IDs
        await loadLookupData();

        // Process organization if provided
        if (orgId) {
          formData.organization_id = orgId;
          isOrgReadOnly = true;

          // Find organization name from the loaded organizations
          const org = organizations.find((o) => o.uuid === orgId);
          if (org) {
            selectedOrgName = org.name;
          }

          // Load blocks for this organization
          await loadBlocks(orgId);
        }

        // Process block if provided
        if (blockId && formData.organization_id) {
          formData.block_id = blockId;
          isBlockReadOnly = true;
          blockPresetReadOnly = true;

          // Find block name from the loaded blocks
          const block = blocks.find((b) => b.uuid === blockId);
          if (block) {
            selectedBlockName = block.name;
          }

          // Load schools for this block
          await loadSchools(blockId);
        }

        // Process school if provided
        if (schoolId && formData.block_id) {
          formData.school_id = schoolId;
          isSchoolReadOnly = true;
          schoolPresetReadOnly = true; // Add this line
          // Find school name from the loaded schools
          const school = schools.find((s) => s.uuid === schoolId);
          if (school) {
            selectedSchoolName = school.name;
          }
        }
      } else {
        // Normal load without preset parameters
        await loadLookupData();
      }
    }
  });

  // Load lookup data for dropdowns
  async function loadLookupData() {
    try {
      if (blockDetailsLoaded) {
        // console.log('Using pre-loaded organization and block data');
        return; // Exit early
      }

      // Use the imported ROLES directly
      roles = ROLES.map((role) => ({
        id: role.id,
        uuid: role.id,
        name: role.name,
        title: role.name,
      }));

      // Load organizations (only for super_admin, admin, and admin_user)

      if (canEditOrganization) {
        const orgsResponse = await apiClient("/apis/organizations");
         if (!orgsResponse ||!orgsResponse.ok) {
        if(orgsResponse === null){
          throw new Error("Failed to fetch organizations.");
        }
        const errorData = await response?.json();
        throw new Error(errorData.error || "Failed to fetch organizations.");
      }

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();

          organizations = (orgsData.data || []).map((org) => ({
            id: org.uuid,
            uuid: org.uuid,
            name: org.org_name,
            title: org.org_name,
          }));
        }
      }

      if (currentUserRole === "block_admin" && (currentUser || user)) {
        // Set organization from currentUser
        organizations = [
          {
            id: userOrgName.id,
            uuid: userOrgName.id,
            name: userOrgName.name,
            title: userOrgName.name,
          },
        ];

        // Auto-select the organization
        formData.organization_id = userOrgName.id;
        selectedOrgName = userOrgName.name;
        isOrgReadOnly = true;

        // Set block from currentUser
        blocks = [
          {
            id: userBlockName.id,
            uuid: userBlockName.id,
            name: userBlockName.name,
            title: userBlockName.name,
          },
        ];

        // Auto-select the block
        formData.block_id = userBlockName.id;
        selectedBlockName = userBlockName.name;
        isBlockReadOnly = true;

        // Load schools for this block
        await loadSchools(userBlockName.id);

        // We're done with specific loading
        blockDetailsLoaded = true;
        return;
      }
    } catch (err) {
      console.error("Error loading lookup data:", err);
      validationErrors.submit = `Error loading form data: ${err.message}`;
    }
  }

  // Load blocks based on selected organization
  async function loadBlocks(organizationId) {
    blocks = [];
    if (!organizationId) return;

    try {
      let blockUrl = `/apis/blocks?organization_uuid=${organizationId}`;

      // If block admin, only load their block
      if (
        currentUserRole === "block_admin" &&
        user &&
        (user.block_id || (user.block && user.block.uuid))
      ) {
        const blockId = user.block_id || user.block.uuid;
        blockUrl = `/apis/blocks/${blockId}`;
      }

      const response = await apiClient(blockUrl);
         if (!response ||!response.ok) {
        if(response === null){
          throw new Error("Failed to fetch regions.");
        }
        const errorData = await response?.json();
        throw new Error(errorData.error || "Failed to fetch regions.");
      }
      if (response.ok) {
        if (
          currentUserRole === "block_admin" &&
          blockUrl.includes("/blocks/")
        ) {
          // Single block case
          const blockData = await response.json();
          blocks = [
            {
              id: blockData.uuid,
              uuid: blockData.uuid,
              name: blockData.block_name,
              title: blockData.block_name,
            },
          ];

         
          // Auto-select if only one block and not already set
        if (blocks.length === 1 && !formData.block_id) {
          formData.block_id = blockData.uuid;
          selectedBlockName = blockData.block_name;
          // Load schools for this block
          await loadSchools(blockData.uuid);
        }
        } else {
          // Multiple blocks case
          const data = await response.json();
          blocks = (data.data || []).map((block) => ({
            id: block.uuid,
            uuid: block.uuid,
            name: block.block_name,
            title: block.block_name,
          }));
        }
      }
    } catch (err) {
      console.error("Error loading blocks:", err);
      validationErrors.submit = `Error loading blocks: ${err.message}`;
    }
  }

  // Load schools based on selected block
  async function loadSchools(blockId) {
    schools = [];
    if (!blockId) return;
    if (blockDetailsLoaded && schools.length > 0) {
      return;
    }

    try {
      const response = await apiClient(`/apis/schools?block_uuid=${blockId}`);
      if (!response ||!response.ok) {
        if(response === null){
          throw new Error("Failed to fetch schools.");
        }
        const errorData = await response?.json();
        throw new Error(errorData.error || "Failed to fetch schools.");
      }
      if (response.ok) {
        const data = await response.json();
        schools = (data.data || []).map((school) => ({
          id: school.uuid,
          uuid: school.uuid,
          name: school.school_name,
          title: school.school_name,
        }));
          // Auto-select if only one school and not already set
      if (schools.length === 1 && !formData.school_id && !isSchoolReadOnly) {
        formData.school_id = schools[0].uuid;
        selectedSchoolName = schools[0].name;
      }

      }
    } catch (err) {
      console.error("Error loading schools:", err);
      validationErrors.submit = `Error loading schools: ${err.message}`;
    }
  }

  // Add this function to map numeric IDs to actual role codes
  function getRoleCodeFromDropdownId(selectedOption) {
    if (!selectedOption) return null;

    // If selectedOption is an object with an id property, use that
    if (typeof selectedOption === "object" && selectedOption.id) {
      return selectedOption.id;
    }

    // Return the selected option directly if it's a valid role code
    return selectedOption;
  }

  function clearAllDependentFields() {
    // Clear organization
    formData.organization_id = null;
    selectedOrgName = "";

    // Clear block/region
    formData.block_id = null;
    selectedBlockName = "";

    // Clear school
    formData.school_id = null;
    selectedSchoolName = "";

    // Clear the dropdown arrays to force reload

    blocks = [];
    schools = [];

    // Reset validation errors
    validationErrorsOrg = "";
    validationErrorsBlock = "";
    validationErrorsSchool = "";
  }

  // Add event handlers for dropdown clearing
  function handleOrgCancel() {
    formData.organization_id = null;
    selectedOrgName = "";

    // Clear dependent fields
    formData.block_id = null;
    selectedBlockName = "";
    formData.school_id = null;
    selectedSchoolName = "";

    // Clear the dropdown arrays
    blocks = [];
    schools = [];

    // Clear validation errors
    validationErrorsOrg = "";
    validationErrorsBlock = "";
    validationErrorsSchool = "";
  }

  function handleBlockCancel() {
    formData.block_id = null;
    selectedBlockName = "";

    // Clear dependent field
    formData.school_id = null;
    selectedSchoolName = "";

    // Clear the school dropdown array
    schools = [];

    // Clear validation errors
    validationErrorsBlock = "";
    validationErrorsSchool = "";
  }

  // Update the handleRoleChange function
  function handleRoleChange(event) {
    const selectedData = event.detail;

    // Get the role code from the selectedOption
    const previousRole = formData.role_id;
    formData.role_id = selectedData.selectedOption.id;
    selectedRoleName = selectedData.selectedOption.name;
    isTeacherRole = formData.role_id === "teacher";
    validationErrorsRole = "";

    // Skip clearing fields for block admin users
    if (currentUserRole === "block_admin") {
      // For block admin, don't clear the org and block fields
      // Only clear school if changing from teacher to block_admin
      if (previousRole === "teacher" && formData.role_id === "block_admin") {
        formData.school_id = null;
        selectedSchoolName = "";
        schools = [];
        validationErrorsSchool = "";
      }
      return; // Exit early to prevent further field clearing
    }

    clearAllDependentFields();
    // If role changed to/from admin/admin_user, handle dependent fields
    if (previousRole === "admin" && formData.role_id !== "admin") {
      formData.organization_id = null;
      selectedOrgName = "";
    }
    if (
      (previousRole === "admin" || previousRole === "admin_user") &&
      formData.role_id !== "admin" &&
      formData.role_id !== "admin_user"
    ) {
      // Role changed FROM organization admin/user TO something else
      // isBlockReadOnly = false;
      canEditBlock = true;
      formData.organization_id = null;
      selectedOrgName = "";
    } else if (
      (formData.role_id === "admin" || formData.role_id === "admin_user") &&
      previousRole !== "admin" &&
      previousRole !== "admin_user"
    ) {
      // Role changed TO organization admin/user FROM something else
      // Clear block and school selections
      formData.organization_id = null;
      selectedOrgName = "";
      formData.block_id = null;
      selectedBlockName = "";
      formData.school_id = null;
      selectedSchoolName = "";
    }

    // If changed from block_admin to teacher, make school dropdown available
    if (previousRole === "block_admin" && formData.role_id === "teacher") {
      isSchoolReadOnly = false;
      formData.organization_id = null;
      selectedOrgName = "";
      formData.block_id = null;
      selectedBlockName = "";
    }

    // If changed to block_admin from teacher, clear school selection
    if (formData.role_id === "block_admin" && previousRole === "teacher") {
      formData.school_id = null;
      selectedSchoolName = "";
      formData.organization_id = null;
      selectedOrgName = "";
    }
    // if changed from teacher to other role clear selection
    if (previousRole === "teacher") {
      formData.organization_id = null;
      selectedOrgName = "";
      formData.block_id = null;
      selectedBlockName = "";
    }
  }

  // Updated handleOrgChange to handle UUIDs correctly
  async function handleOrgChange(event) {
    const selectedData = event.detail;

    // Previous organization ID
    const previousOrgId = formData.organization_id;

    // Update organization data
    formData.organization_id = selectedData.selectedItemId;
    selectedOrgName = selectedData.selectedItemName;
    validationErrorsOrg = "";

    // If organization has changed or been cleared, reset dependent fields
    if (
      !formData.organization_id ||
      formData.organization_id !== previousOrgId
    ) {
      // Clear block/region and school
      formData.block_id = null;
      selectedBlockName = "";
      formData.school_id = null;
      selectedSchoolName = "";

      // Clear the dropdown arrays
      blocks = [];
      schools = [];

      // Clear validation errors
      validationErrorsBlock = "";
      validationErrorsSchool = "";
    }

    // If organization is selected, load its blocks
    if (formData.organization_id) {
      await loadBlocks(formData.organization_id);
    }
  }

  // Updated handleBlockChange to handle UUIDs correctly
  async function handleBlockChange(event) {
    const selectedData = event.detail;

    // Previous block ID
    const previousBlockId = formData.block_id;

    // Update block data
    formData.block_id = selectedData.selectedItemId;
    selectedBlockName = selectedData.selectedItemName;
    validationErrorsBlock = "";

    // If block has changed or been cleared, reset school
    if (!formData.block_id || formData.block_id !== previousBlockId) {
      // Clear school
      formData.school_id = null;
      selectedSchoolName = "";

      // Clear the school dropdown array
      schools = [];

      // Clear validation errors
      validationErrorsSchool = "";
    }

    // If block is selected, load its schools
    if (formData.block_id) {
      await loadSchools(formData.block_id);
    }
  }

  // Updated handleSchoolChange to handle UUIDs correctly
  function handleSchoolChange(event) {
    const selectedData = event.detail;

    // Use the UUID directly without parsing as integer
    formData.school_id = selectedData.selectedItemId || null;

    selectedSchoolName = selectedData.selectedItemName;
    validationErrorsSchool = "";
  }

  function handleCancelSelection() {
    // This function handles when a dropdown selection is cancelled/cleared
    // Can be used for specific dropdown resets if needed
    clearAllDependentFields();
  }

  function handleRoleCancelSelection() {
    // Clear role and all dependent fields
    formData.role_id = "";
    selectedRoleName = "";
    isTeacherRole = false;
    validationErrorsRole = "";

    // Clear all dependent fields
    clearAllDependentFields();
  }

  $: passwordStrengthData = validatePassword(formData.password);
  $: passwordStrength = passwordStrengthData.strength;
  $: passwordFeedback = passwordStrengthData.feedback;

  // Validate password and calculate strength
  function validatePassword(password) {
    if (!password) {
      return { isValid: false, strength: 0, feedback: "No password provided" };
    }

    // Check length
    const lengthValid = password.length >= 8;

    // Check for uppercase letters
    const hasUpperCase = /[A-Z]/.test(password);

    // Check for lowercase letters
    const hasLowerCase = /[a-z]/.test(password);

    // Check for numbers
    const hasNumbers = /\d/.test(password);

    // Check for special characters
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      password
    );

    // Calculate strength (0-5 scale)
    let strength = 0;
    if (lengthValid) strength += 1;
    if (hasUpperCase) strength += 1;
    if (hasLowerCase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecialChars) strength += 1;

    // Determine feedback based on strength
    let feedback;
    if (strength < 3) {
      feedback = "Weak";
    } else if (strength < 5) {
      feedback = "Moderate";
    } else {
      feedback = "Strong";
    }

    // Update component state
    passwordStrength = (strength / 5) * 100;
    passwordFeedback = feedback;

    // Password is valid if it meets all criteria
    const isValid =
      lengthValid &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChars;

    return { isValid, strength: passwordStrength, feedback };
  }

  // Handle password change
  function handlePasswordChange(event) {
    formData.password = event.target.value;
    validatePassword(formData.password);
  }

  // Get password strength color class
  function getPasswordStrengthColorClass(strength) {
    if (strength >= 80) return "bg-green-500";
    if (strength >= 60) return "bg-green-400";
    if (strength >= 40) return "bg-yellow-500";
    if (strength >= 20) return "bg-yellow-600";
    return "bg-red-500";
  }

  // Get password strength text color class
  function getPasswordStrengthTextColorClass(strength) {
    if (strength >= 80) return "text-green-700";
    if (strength >= 60) return "text-green-600";
    if (strength >= 40) return "text-yellow-700";
    if (strength >= 20) return "text-yellow-800";
    return "text-red-700";
  }

  // Get password strength label
  function getPasswordStrengthLabel(strength) {
    if (strength >= 80) return "Strong";
    if (strength >= 60) return "Good";
    if (strength >= 40) return "Moderate";
    if (strength >= 20) return "Weak";
    return "Very Weak";
  }

  // Update the loading state management
  let isSubmitting = false; // Local state to track submission

  // Check if form has validation errors
  function hasValidationErrors() {
    return (
      Object.keys(validationErrors).length > 0 ||
      validationErrorsUsername.length > 0 ||
      validationErrorsFullName.length > 0 ||
      validationErrorsEmail.length > 0 ||
      validationErrorsPhone.length > 0 ||
      validationErrorsPassword.length > 0 ||
      validationErrorsConfirmPassword.length > 0 ||
      validationErrorsRole ||
      validationErrorsOrg ||
      validationErrorsBlock ||
      validationErrorsSchool
    );
  }

  // Form validation
  // TODO ADD VALIDATION FOR BLOCK ADMIN ROLE
  function validateForm() {
    validationErrors = {};
    validationErrorsUsername = [];
    validationErrorsFullName = [];
    validationErrorsPassword = [];
    validationErrorsConfirmPassword = [];
    validationErrorsRole = "";
    validationErrorsOrg = "";
    validationErrorsBlock = "";
    validationErrorsSchool = "";

    if (!formData.username?.trim()) {
      validationErrors.username = "Username is required";
      validationErrorsUsername.push("Username is required");
    }

    if (!formData.role_id) {
      validationErrors.role_id = "Role is required";
      validationErrorsRole = "Role is required";
    }
    // Organization is required for all roles
    if (!formData.organization_id) {
      validationErrors.organization_id = "Organization is required";
      validationErrorsOrg = "Organization is required";
    }

    // Region is required for region_admin and teacher roles
    if (
      (formData.role_id === "block_admin" || formData.role_id === "teacher") &&
      !formData.block_id
    ) {
      validationErrors.block_id = "Region is required";
      validationErrorsBlock = "Region is required";
    }

    // School is required for teacher role
    if (formData.role_id === "teacher" && !formData.school_id) {
      validationErrors.school_id = "School is required";
      validationErrorsSchool = "School is required";
    }

    // Validate password requirements in add mode
    if (mode === "add") {
      if (!formData.password) {
        validationErrors.password = "Password is required";
        validationErrorsPassword.push("Password is required");
      } else if (formData.password !== formData.confirm_password) {
        validationErrors.confirm_password = "Passwords do not match";
        validationErrorsConfirmPassword.push("Passwords do not match");
      } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          const errorMsg =
            "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters";
          validationErrors.password = errorMsg;
          validationErrorsPassword.push(errorMsg);
        }
      }
    }

    return Object.keys(validationErrors).length === 0;
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      isSubmitting = true;
      loading = true;
      validationErrors.submit = null;

      const roleCode = getRoleCodeFromDropdownId(formData.role_id);
      // const roleCode =

      // Clean up form data before sending - don't parse UUIDs as integers
      const cleanedFormData = {
        username: formData.username,
        full_name: formData.full_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        // Use the correctly mapped role code
        role_code: formData.role_id, // Use role_id directly

        // Keep UUIDs as strings
        organization_id: formData.organization_id || null,
        block_id: formData.block_id || null,
        school_id: formData.school_id || null,
        is_active: formData.is_active,
        organization_uuid: formData.organization_id || null,
        block_uuid: formData.block_id || null,
        school_uuid: formData.school_id || null,
      };

      // logDebug(`${mode === 'add' ? 'Creating' : 'Updating'} user with data`, cleanedFormData);

      // Add password only for add mode
      if (mode === "add") {
        cleanedFormData.password = formData.password;
      }

      // const userUuid = url.searchParams.get('')
      const endpoint =
        mode === "add" ? "/apis/users" : `/apis/users/${user.uuid}`;
      const method = mode === "add" ? "POST" : "PUT";

      const response = await apiClient(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedFormData),
      });

      if (!response.ok) {
        // Get detailed error message from response
        let errorData;
        let responseText = "";

        try {
          // Attempt to parse as JSON
          responseText = await response.text();
          console.error("Error response:", response.status, responseText);

          try {
            errorData = JSON.parse(responseText);
          } catch (jsonError) {
            // If not valid JSON, use the text directly
            throw new Error(
              responseText ||
                `Failed to ${mode === "add" ? "create" : "update"} user. Status: ${response.status}`
            );
          }
        } catch (textError) {
          // If text extraction fails, use a generic message
          throw new Error(
            `Failed to ${mode === "add" ? "create" : "update"} user. Status: ${response.status}`
          );
        }

        // Create a descriptive error message
        let errorMessage;

        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage =
            typeof errorData.error === "string"
              ? errorData.error
              : Array.isArray(errorData.error)
                ? errorData.error
                    .map((e) => e.msg || JSON.stringify(e))
                    .join(", ")
                : JSON.stringify(errorData.error);
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (response.status === 422 && errorData.validation_errors) {
          // Format validation errors
          const validationErrors = Object.entries(errorData.validation_errors)
            .map(
              ([field, errors]) =>
                `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
            )
            .join("; ");
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          // Default error message
          errorMessage = `Failed to ${mode === "add" ? "create" : "update"} user (Status: ${response.status})`;
        }

        throw new Error(errorMessage);
      }

      // Get response data
      const responseData = await response.json();
      let userHeading = "";

      if (responseData.role.role_code === "admin") {
        userHeading = "Organization Admin";
      } else if (responseData.role.role_code === "admin_user") {
        userHeading = "Organization User ";
      } else if (responseData.role.role_code === "block_admin") {
        userHeading = "Region Admin";
      } else if (responseData.role.role_code === "teacher") {
        userHeading = "Teacher";
      }

      // Dispatch success event with updated user data
      const message = `${userHeading} "${formData.username}" ${mode === "add" ? "created" : "updated"} successfully!`;
      // notification dispacth for user
      if (notificationTarget === "user") {
        dispatch("success", {
          user: responseData,
          message: message,
          userHeading: userHeading,
        });
      } else if (
        responseData.role.role_code === "admin" ||
        responseData.role.role_code === "admin_user"
      ) {
        if (notificationTarget === "org") {
          showOrganizationNotification("success", message);
        }
      }
      //  else if (userHeading === 'Organization User' && notificationTarget === 'org'){
      //   showOrganizationNotification(
      //   'success',
      //   message
      // )
      // }
      else if (userHeading === "Region Admin" && notificationTarget) {
        if (notificationTarget === "org") {
          showOrganizationNotification("success", message);
        } else if (notificationTarget === "reg") {
          regionMessage.set(message);
          regionMsgType.set("success");
        }
      } else if (
        userHeading === "Teacher" &&
        notificationTarget === "teacher"
      ) {
        schoolMessage.set(message);
        schoolMsgType.set("success");
      }

      // On successful submission redirect the user from where they came
      if (responseData && returnPath) {
        if (returnPath.startsWith("/")) {
          const finalPath = `${returnPath}`;
          goto(finalPath);
        } else {
          // If the path is not internal (e.g., '//google.com'), fall back to a safe default

          goto(`/users`);
        }
      }
      // In case of response data is successful
      else if (responseData) {
        const encodedMessage = encodeURIComponent(message);
        goto(`/users`);
      }
      // In case of failure
      else {
        goto("/users");
      }
    } catch (err) {
      console.error(
        `Error ${mode === "add" ? "creating" : "updating"} user:`,
        err
      );

      if (err.message === "[object Object]") {
        validationErrors.submit = `Failed to ${mode === "add" ? "create" : "update"} user. Server returned an invalid response.`;
      } else {
        validationErrors.submit =
          err.message ||
          `An unexpected error occurred while ${mode === "add" ? "creating" : "updating"} the user`;
      }
      // Dispatch error event
      dispatch("error", validationErrors.submit);
      error = validationErrors.submit;
    } finally {
      // IMPORTANT: Reset both loading states
      isSubmitting = false;
      loading = false;
    }
  }

  // Handle cancel button click
  function handleCancel() {
    if (returnPath) {
      goto(returnPath);
    } else {
      goto("/users");
    }
    dispatch("cancel");
  }
</script>

<!-- Updated layout with consistent styling matching SchoolForm -->
<div class="bg-white max-w-6xl mx-auto text-dark-gray">
  <div
    class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 text-dark-gray"
  >
    {#if mode === "add" && roleToDisable}
      <h2 class="text-base sm:text-lg font-semibold text-dark-gray">
        Add {roleHeader}
      </h2>
      <!-- {/if} -->
    {:else}
      <h2 class="text-base sm:text-lg font-semibold text-dark-gray">
        {mode === "add" ? "Add New User" : "Edit User"}
      </h2>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  {:else}
    <form class="px-6 py-4 space-y-6" on:submit|preventDefault={handleSubmit}>
      <!-- Basic Information Section -->
      <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
        <h3 class="text-base font-semibold text-dark-gray mb-3">
          Basic Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Username -->
          <div>
            <InputField
              label="Username"
              name="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              required={true}
              error={validationErrors.username}
              on:handleInputData={({ detail }) => {
                // Remove all spaces from the input
                formData.username = detail.value.replace(/\s+/g, "");
              }}
            />
            <small class="text-gray-500"
              >No spaces allowed. Only letters, numbers, and underscores.</small
            >
          </div>

          <!-- Full Name -->
          <div>
            <InputField
              label="Full Name"
              name="full_name"
              type="text"
              placeholder="Enter full name"
              value={formData.full_name}
              required={true}
              error={validationErrors.full_name}
              on:handleInputData={({ detail }) =>
                (formData.full_name = detail.value)}
            />
          </div>

          <!-- Email -->
          <div>
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="Enter email "
              value={formData.email}
              error={validationErrors.email}
              on:handleInputData={({ detail }) =>
                (formData.email = detail.value)}
            />
          </div>

          <!-- Phone -->
          <div>
            <InputField
              label="Phone"
              name="phone"
              type="text"
              placeholder="Enter phone"
              value={formData.phone}
              error={validationErrors.phone}
              on:handleInputData={({ detail }) =>
                (formData.phone = detail.value)}
            />
          </div>
        </div>
      </div>

      <!-- Role & Organization Section -->
      <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
        <h3 class="text-base font-semibold text-dark-gray mb-3">
          Role & Organization
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Role selection - Using DropDown since roles are limited -->
          <div>
            <DropDown
              title="Role "
              options={availableRoles}
              selectedItemId={formData.role_id}
              selectedItemName={selectedRoleName}
              validationErrors={validationErrorsRole}
              type="role"
              placeholder="Select Role"
              disabled={isRoleReadOnly}
              required={true}
              on:handleDispatchFilterData={handleRoleChange}
              on:handleCancelSelection={handleRoleCancelSelection}
            />
          </div>

          <!-- Organization selection -->
          <!-- to remove key later  -->
          {#if formData.role_id}
            <div>
              <SearchableComboBox
                label="Organization"
                options={organizations}
                filterCategory="organization"
                selectedItemId={formData.organization_id?.toString() || ""}
                selectedItemName={selectedOrgName}
                key={`block-${selectedBlockName}-${Date.now()}`}
                validationErrors={validationErrorsOrg}
                placeholder="Select Organization"
                disabled={!canEditOrganization ||
                  isOrgReadOnly ||
                  currentUserRole === "block_admin"}
                required={true}
                on:handleDispatchComboBoxData={handleOrgChange}
                on:handleDispatchFilterData={handleOrgCancel}
              />
            </div>
          {/if}
          <!-- Block selection - Using SearchableComboBox -->
          <!-- Add condtions to disable the field for role - admin , admin_user depending upon the hierarchy -->
          <!-- Block/Region selection - shown for block_admin and teacher roles -->
          {#if formData.role_id && !["admin", "admin_user"].includes(formData.role_id)}
            <div>
              <SearchableComboBox
                label="Region"
                options={blocks}
                filterCategory="block"
                selectedItemId={formData.block_id?.toString() || ""}
                selectedItemName={selectedBlockName}
                validationErrors={validationErrorsBlock}
                placeholder="Select Region"
                disabled={!formData.organization_id ||
                  isBlockReadOnly ||
                  blockPresetReadOnly}
                required={formData.role_id === "block_admin" ||
                  formData.role_id === "teacher"}
                on:handleDispatchComboBoxData={handleBlockChange}
                on:handleDispatchFilterData={handleBlockCancel}
              />
            </div>
          {/if}
          <!-- School selection -->
          {#if formData.role_id === "teacher"}
            <div>
              <SearchableComboBox
                label="School"
                options={schools}
                filterCategory="school"
                selectedItemId={formData.school_id?.toString() || ""}
                selectedItemName={selectedSchoolName}
                validationErrors={validationErrorsSchool}
                placeholder="Select School"
                disabled={!formData.block_id ||
                  isSchoolReadOnly ||
                  schoolPresetReadOnly}
                required={true}
                on:handleDispatchComboBoxData={handleSchoolChange}
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- Password Section - only show in add mode -->
      {#if mode === "add"}
        <div class="rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
          <h3 class="text-base font-semibold text-dark-gray mb-3">Password</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Password -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Password <span class="text-red-500">*</span></label
              >
              <div class="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  bind:value={formData.password}
                  class="block w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                  on:input={(e) => validatePassword(e.target.value)}
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  on:click={togglePasswordVisibility}
                >
                  {#if passwordVisible}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  {/if}
                </button>
              </div>

              {#if validationErrors.password}
                <p class="mt-1 text-xs text-red-600">
                  {validationErrors.password}
                </p>
              {/if}
            </div>

            <!-- Confirm Password -->
            <div>
              <label
                for="confirm_password"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Confirm Password <span class="text-red-500">*</span></label
              >
              <input
                type="password"
                id="confirm_password"
                bind:value={formData.confirm_password}
                class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm password"
                required
              />
              {#if validationErrors.confirm_password}
                <p class="mt-1 text-xs text-red-600">
                  {validationErrors.confirm_password}
                </p>
              {:else if formData.password && formData.confirm_password && formData.password !== formData.confirm_password}
                <p class="mt-1 text-xs text-red-600">Passwords do not match</p>
              {/if}
            </div>
          </div>

          <!-- Password strength indicator -->
          {#if formData.password}
            <div class="mt-3">
              <div class="bg-gray-200 rounded-full h-2 mb-1">
                <div
                  class="h-2 rounded-full {passwordStrength >= 80
                    ? 'bg-green-500'
                    : passwordStrength >= 60
                      ? 'bg-green-400'
                      : passwordStrength >= 40
                        ? 'bg-yellow-500'
                        : passwordStrength >= 20
                          ? 'bg-yellow-600'
                          : 'bg-red-500'}"
                  style="width: {passwordStrength}%"
                ></div>
              </div>
              <p class="text-xs text-gray-600">
                Strength: {passwordFeedback}
                {#if passwordStrength < 100}
                  <span class="text-gray-500">
                    (Password must contain at least 8 characters, including
                    uppercase, lowercase, number, and special character)
                  </span>
                {/if}
              </p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Status Section -->
      {#if mode === "edit"}
        <div>
          <DropDown
            title="Status"
            options={[
              { id: true, name: "Active" },
              { id: false, name: "Inactive" },
            ]}
            selectedItemId={formData.is_active}
            selectedItemName={formData.is_active ? "Active" : "Inactive"}
            placeholder="Select status"
            required={true}
            on:handleDispatchFilterData={({ detail }) =>
              (formData.is_active = detail.selectedOption.id)}
          />
          <small class="text-gray-500"
            >Set user status as active or inactive.</small
          >
        </div>
      {/if}

      <!-- Form actions -->
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
          title={mode === "add" ? "Create User" : "Update User"}
        >
          {#if isSubmitting}
            <LoadingSpinner size="small" color="white" />
          {:else}
            {mode === "add" ? "Submit" : "Submit"}
          {/if}
        </Button>
      </div>
    </form>
  {/if}
</div>
