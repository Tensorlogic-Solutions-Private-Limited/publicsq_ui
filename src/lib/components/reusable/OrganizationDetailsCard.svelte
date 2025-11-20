<script>
  import { createEventDispatcher } from "svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import OrganizationForm from "$lib/components/organizations/OrganizationForm.svelte";
  import { goto } from "$app/navigation";
  import OrganizationDeletion from "../organizations/OrganizationDeletion.svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";
  import Button from "./Button.svelte";
  import { page } from "$app/stores";
  import { organizationNotification,showOrganizationNotification,hideOrganizationNotification } from "../../../routes/(protected)/organizations/organizationStore.js";``

  // Lucide icons
  import { Building, Plus } from "@lucide/svelte/icons";

  export let organization = {};
  export let permissions = {};

  const dispatch = createEventDispatcher();
  let showEditModal = false;
  let showDeleteModal = false;

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "—";
    return new Date(
      dateString.endsWith("Z") ? dateString : dateString + "Z"
    ).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  function handleEdit() {
    showEditModal = true;
  }

  function handleDelete() {
    showDeleteModal = true;
  }

  function handleFormSuccess(event) {
    const { result } = event.detail;
    organization = result;
    showEditModal = false;
    dispatch("success", {
      // message: `Successfully updated details of '${result.org_name}'.`,
      message : `Organization ${result.org_name} updated successfully.`
    });
  }

  function handleDeleteSuccess(event) {
    console.log('event',event.detail) ; 
    const orgName = event.detail.organization.org_name ;     
    showDeleteModal = false;
    dispatch("success", {
      message: `Organization ${orgName}  deleted successfully.`,      
    });
    
    goto("/organizations");
  }
  // Function to add user add page wtih preselected org and role
  // we are sending the uuid and admin role here
  // eg http://localhost:5174/users/add?role=admin_user&org_id=77ea4110-da74-4807-bc65-930ee34b088f&preset=true
  function handleAddOrgAdmin() {
    const currentPath = $page.url.pathname;
    goto(
      `/users/add?org_id=${organization.uuid}&role=admin&preset=true&from=${encodeURIComponent(currentPath)}&nt=org`
    );
  }
  // // we are sending the uuid and admin_user  role here
  function handleAddOrgUser() {
    const currentPath = $page.url.pathname;
    goto(
      `/users/add?org_id=${organization.uuid}&role=admin_user&preset=true&from=${encodeURIComponent(currentPath)}&nt=org`
    );
  }
</script>

<!-- Organization Details Card using DetailsHeader -->
<DetailsHeader
  icon={Building}
  heading={organization.org_name || "Organization"}
  code={organization.org_code || ""}
  description={organization.org_description || ""}
  showEdit={permissions?.edit === true ? true : false}
  showDelete={permissions?.delete === true ? true : false}
  isActive={organization.is_active}
  lastUpdatedOn={formatDate(organization.updated_at)}
  on:edit={handleEdit}
  on:delete={handleDelete}
></DetailsHeader>

<!-- Organization Edit Modal -->
{#if showEditModal}
  <Portal>
    <div
      class="bg-white  rounded-lg max-w-xl w-full  mx-4"
    >
      <OrganizationForm
        mode="edit"
        existingOrganization={organization}
        on:success={handleFormSuccess}
        on:cancel={() => (showEditModal = false)}
      />
    </div>
  </Portal>
{/if}

<!-- Delete Modal using Portal -->
{#if showDeleteModal && organization}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
    >
      <OrganizationDeletion
        {organization}
        on:success={handleDeleteSuccess}
        on:cancel={() => {
          showDeleteModal = false;
        }}
      />
    </div>
  </Portal>
{/if}

<!-- Add organization admin and user buttons  -->
<div class="flex space-x-3 justify-end">
  {#if permissions?.addOrgAdmin}
    <Button
      btnType="primary"
      type="button"
      on:click={handleAddOrgAdmin}
    >
      <Plus class="w-4 h-4 mr-2" />
      Organization Admin
    </Button>
  {/if}
  {#if permissions?.addOrgUser}
    <Button
      btnType="primary"
      type="button"
      on:click={handleAddOrgUser}
    >
      <Plus class="w-4 h-4 mr-2" />
      Organization User
    </Button>
  {/if}
</div>
