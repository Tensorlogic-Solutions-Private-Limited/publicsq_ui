<script>
  import SchoolFormPage from "$lib/components/schools/SchoolFormPage.svelte";
  import { page } from "$app/stores";
  import ErrorMessage from "$lib/components/reusable/ErrorMessage.svelte";

  export let data;

  let { school, states } = data;

  $:states = states?.error ? [] : states

  $:if(!school.error){
    school = {
      udise_code: school.udise_code || "",
      school_name: school.school_name || "",
      address: school.address || "",
      local_govt_body_id: school.local_govt_body_id || "",
      block_uuid: school.block_uuid || "",
      organization_uuid: school.organization_uuid || "",
      state_id: school.state_id || "",
      boards: school.boards || [],
      class_levels: school.class_levels || [],
      is_active: typeof school.is_active === 'boolean' ? school.is_active : true,
    }
  }
</script>

{#if school?.error}
  <div
    class="bg-white shadow rounded-lg p-6 min-h-40 flex items-center justify-center"
  >
    <ErrorMessage error={school?.error || "Failed to load school details."} />
  </div>
{:else}
  <SchoolFormPage
    mode="edit"
    endpoint={`/apis/schools/${$page.params.id}`}
    existingSchool={school}
    {states}
  />
{/if}
