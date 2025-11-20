<script>
  import SchoolDetailsCard from "$lib/components/schools/details/SchoolDetailsCard.svelte";
  import TeachersTable from "$lib/components/schools/details/TeachersTable.svelte";
  import ErrorMessage from "$lib/components/reusable/ErrorMessage.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { message, showAddAdminBtn, addAdminBtnText, msgType } from "/src/routes/(protected)/schools/schoolStore.js";
  import { onDestroy } from 'svelte';
  import { page } from '$app/stores';

  export let data
 
  let {states}=data
  let schoolError = null;
  let preventStoreReset = false

  let successMessage = "";
  let errorMessage = "";
  let successAction = null;
  $: successMessage = $page.url.searchParams.get('success') || '';
  $: errorMessage = $page.url.searchParams.get('error') || '' ; 

 

  $:statesdata = states?.error ? [] : states

  $: if (data?.school?.error) {
    schoolError = data.school.error;
  }

  async function clearStore() {
    message.set('');
    showAddAdminBtn.set(false);
    addAdminBtnText.set('');
    msgType.set('')
  }

  onDestroy(async() => {
    if(!preventStoreReset){
      await clearStore();
    }
  });
</script>

<div class="">
  {#if successMessage}
  <InlineNotification
    kind="success"
    title={successMessage}
    timeout={0}
    on:close={() => {
      successMessage = "";
      // Optionally, remove the param from the URL:
      const url = new URL(window.location);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url);
    }}
  />
{/if}

{#if errorMessage}
  <InlineNotification
    kind="error"
    title={errorMessage}
    timeout={0}
    on:close={() => errorMessage = ""}
  />
{/if}

  {#if $message}
    <div class="mb-4">
      <InlineNotification
        kind={$msgType}
        title={$message}
        on:close={() => clearStore()}
      >
        <svelte:fragment slot="subtitle">
          {#if $showAddAdminBtn}
            <a
              href="/users/addUsers"
              class="text-green-800 text-sm underline hover:text-green-900 font-medium ml-2"
            >
              {$addAdminBtnText}
            </a>
          {/if}
        </svelte:fragment>
      </InlineNotification>
    </div>
  {/if}

  {#if schoolError}
    <div class="bg-white shadow rounded-lg p-6 min-h-40 flex items-center justify-center">
      <ErrorMessage error={schoolError || "Failed to load school details."} />
    </div>
  {:else}
    <SchoolDetailsCard 
      school={data.school} 
      states={statesdata}
      on:preventStoreReset={()=>{
        preventStoreReset=true
      }}
    />
    <hr class="text-dark-gray mt-6 mb-6"/>
    <TeachersTable
      schoolId={data?.school?.uuid}
      blockId={data?.school?.block_uuid}
      orgId={data?.school?.organization_uuid}
      schoolName={data?.school?.school_name}
    />
  {/if}
</div>
