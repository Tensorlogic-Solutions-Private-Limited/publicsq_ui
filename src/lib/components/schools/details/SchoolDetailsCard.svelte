<script>
  import {
    USER_ROLES,
    localGovtOptions,
    boardOptions,
  } from "$lib/constants.js";
  import { createEventDispatcher } from "svelte";
  import SchoolDeletion from "$lib/components/schools/SchoolDeletion.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";
  import InfoRow from "$lib/components/reusable/InfoRow.svelte";
  import ClassLevelsCard from "./ClassLevelsCard.svelte";

  import {
    School,
    Tag,
    Clock,
    CircleCheck,
    FileText,
    User,
    UserCog,
    Building,
    Building2,
    PencilLine,
    CircleX,
    MapPin,
    LandPlot,
    GraduationCap,
    BookOpen,
    Trash2
  } from "@lucide/svelte/icons";
  import { message, showAddAdminBtn, addAdminBtnText, msgType } from "/src/routes/(protected)/schools/schoolStore.js";
  import { goto } from "$app/navigation";

  export let school = {};
  export let states = [];

  const dispatch = createEventDispatcher();
  let showDeleteModal = false

  const statsItems = [
    { label: "Teachers", value: school.total_teachers ?? "N/A" },
    { label: "Students", value: school.total_students ?? "N/A" },
    { label: "Quiz Generated", value: school.total_quizzes ?? "N/A" },
  ];

  function getStateName(stateId) {
    return states?.find((state) => String(state.id) == String(stateId))?.name || "-";
  }

  function getLocalGovtName(govtId) {
    return localGovtOptions?.find((opt) => opt.id == govtId)?.name || "-";
  }

  function getBoardNames(boardIds) {
    if (!boardIds?.length) return "-";
    return boardIds
      ?.map(
        (id) =>
          boardOptions.find((board) => board.id === id)?.name || `Board ${id}`
      )
      .join(", ");
  }

  function formatClassLevels(levels) {
    if (!levels?.length) return "-";
    return levels.map((level) => `Class ${level}`).join(", ");
  }

  function formatContacts(contacts) {
    return contacts?.length ? contacts : "-";
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "-";
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
    goto(`/schools/${school.uuid}/edit?from=/schools/${school.uuid}/details`);
  }

    async function handleDeletionSuccess(event) {
    const { message: deleteMessage } = event.detail;
    
    // Update store with deletion message
    message.set(deleteMessage);
    showAddAdminBtn.set(false);
    msgType.set("success")

    dispatch('preventStoreReset')

    goto('/schools')
    
    showDeleteModal = false;
  }

  function handleDelete(){
    showDeleteModal=true
  }
</script>

<DetailsHeader
  icon={Building2}
  heading={school.school_name}
  code={school.udise_code}
  description={school.school_description}
  organizationInfo={{ label: "Organization", value: school.organization?.org_name || "-" }}
  blockInfo={{ label: "Block", value: school.block?.block_name || "-" }}
  showEdit={true}
  showDelete={true}
  isActive={school.is_active}
  lastUpdatedOn={formatDate(school?.updated_at)}
  on:edit={handleEdit}
  on:delete={handleDelete}
  class_="mb-4"
>
  <!-- School Information -->
  <div class="p-6">
    <!-- Additional School Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each [
        { label: 'State', value: getStateName(school?.state_id) },
        { label: 'Local Govt', value: getLocalGovtName(school?.local_govt_body_id) },
        { label: 'Boards', value: getBoardNames(school?.boards) }
      ] as { label, value }}
        <InfoRow {label} {value} />
      {/each}
    </div>
  </div>
</DetailsHeader>

<ClassLevelsCard classLevels={school?.class_levels} />

{#if showDeleteModal}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[95vh] overflow-y-scroll"
    >
      <SchoolDeletion
        school={school}
        on:success={handleDeletionSuccess}
        on:cancel={() => {
          showDeleteModal = false;
        }}
      />
    </div>
  </Portal>
{/if}