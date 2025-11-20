<script>
  import { USER_ROLES } from "$lib/constants.js";
  import { createEventDispatcher, onDestroy } from "svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import BlockForm from "$lib/components/blocks/BlockForm.svelte";
  import BlockDeletion from "$lib/components/blocks/BlockDeletion.svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import { Plus } from "@lucide/svelte/icons";
  import { page } from "$app/stores";
  import {
    message as regionMessage,
    showAddAdminBtn as regionShowAddAdminBtn,
    msgType as regionMsgType,
  } from "/src/routes/(protected)/regions/regionStore.js";

  // Lucide icons
  import { Building2 } from "@lucide/svelte/icons";
  import { goto } from "$app/navigation";

  export let block = {};
  export let permissions = {};
  export let statesList = []

  const dispatch = createEventDispatcher();
  let showEditModal = false;
  let showDeleteModal = false;

  const statsItems = [
    { label: "Schools", value: block.total_schools ?? "N/A" },
    { label: "Teachers", value: block.total_teachers ?? "N/A" },
    { label: "Quiz Generated", value: block.total_quizzes ?? "N/A" },
  ];

  function handleEdit() {
    showEditModal = true;
  }
  function handleDelete() {
    showDeleteModal = true;
  }

  function handleRegAdmin() {
    const currentPath = $page.url.pathname;
    console.log('currentPath',currentPath) ; 
    goto(`/users/add?block_id=${block.uuid}&org_id=${block.organization.uuid}&role=block_admin&preset=true&from=${encodeURIComponent(currentPath)}&nt=reg`);
  }

  function handleDeleteSuccess(event) {
    const { message } = event.detail;

    regionMessage.set(message);
    regionShowAddAdminBtn.set(false);
    regionMsgType.set("success");

    dispatch("preventStoreReset");

    goto("/regions");
  }
  function handleFormSuccess(event) {
    const { result } = event.detail;
    block = result;
    showEditModal = false;

    regionMessage.set(
      `Successfully updated details of '${result.block_name || "-"}'.`
    );
    regionShowAddAdminBtn.set(false);
    regionMsgType.set("success");
  }

  $: updatedOn = block?.updated_at
    ? new Date(
        block.updated_at.endsWith("Z")
          ? block.updated_at
          : block.updated_at + "Z"
      ).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      })
    : "-";
</script>

<DetailsHeader
  icon={Building2}
  heading={block.block_name}
  code={block.block_code}
  description={block.block_description || "No description available"}
  organizationInfo={{
    label: "Organization",
    value: block.organization?.org_name || "-",
  }}
  stateInfo={{
    label: "State",
    value: block?.state_name || "-",
  }}
  showEdit={permissions?.edit === true ? true : false}
  showDelete={permissions?.delete === true ? true : false}
  isActive={block.is_active}
  lastUpdatedOn={updatedOn}
  on:edit={handleEdit}
  on:delete={handleDelete}
/>

<!-- Block Edit Modal -->
{#if showEditModal}
  <Portal>
    <div
      class="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full mx-4 max-h-[95vh] mt-4 mb-4 overflow-y-scroll"
    >
      <BlockForm
        mode="edit"
        {statesList}
        existingBlock={block}
        on:success={handleFormSuccess}
        on:cancel={() => (showEditModal = false)}
      />
    </div>
  </Portal>
{/if}

{#if showDeleteModal}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[95vh] overflow-y-scroll"
    >
      <BlockDeletion
        {block}
        on:success={handleDeleteSuccess}
        on:cancel={() => {
          showDeleteModal = false;
        }}
      />
    </div>
  </Portal>
{/if}
<!-- Add Region admin  button  -->
{#if permissions?.addRegAdmin}
  <div class="flex space-x-3 justify-end">
    <Button btnType="primary" type="button" on:click={handleRegAdmin}>
      <Plus class="w-4 h-4 mr-2" />
      Region Admin
    </Button>
  </div>
{/if}
