<script>
  import { onDestroy, onMount } from "svelte";
  import BlockDetailsCard from "$lib/components/blocks/details/BlockDetailsCard.svelte";
  import SchoolsTable from "$lib/components/blocks/details/SchoolsTable.svelte";
  import ErrorMessage from "$lib/components/reusable/ErrorMessage.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import {
    message,
    showAddAdminBtn,
    addAdminBtnText,
    msgType,
    addAdminBtnQueryParams,
  } from "/src/routes/(protected)/regions/regionStore.js";
  import { authStore } from "$lib/stores/authStore.js";

  export let data;

  $: statesList = data.states.error ? [] : data.states;
  
  let blockError = null;
  let preventStoreReset = false;

  let permissions = {
    addRegAdmin: false,
    edit: false,
    delete: false,
  };

  $: successMessage = $page.url.searchParams.get("success") || "";
  $: errorMessage = $page.url.searchParams.get("error") || "";

  $: if (data?.block?.error) {
    blockError = data.block.error;
  }

  async function clearStore() {
    message.set("");
    showAddAdminBtn.set(false);
    addAdminBtnText.set("");
    msgType.set("");
    addAdminBtnQueryParams.set("");
  }

  onMount(() => {
    if (browser) {
      const unsubscribe = authStore.subscribe((user) => {
        if (user && Object.keys(user)?.length > 0) {
          if (user.roleCode === "super_admin") {
            permissions = {
              addRegAdmin: true,
              edit: true,
              delete: true,
            };
          } else if (
            user.roleCode === "admin" ||
            user.roleCode === "admin_user"
          ) {
            permissions = {
              addRegAdmin: true,
              edit: true,
              delete: true,
            };
          } else if (user.roleCode === "block_admin") {
            permissions = {
              addRegAdmin: false,
              edit: true,
              delete: false,
            };
          } else {
            permissions = {
              addRegAdmin: false,
              edit: false,
              delete: false,
            };
          }
        } else {
          permissions = {
            addRegAdmin: false,
            edit: false,
            delete: false,
          };
        }
      });
      permissions = { ...permissions };
      return () => unsubscribe();
    }
  });

  onDestroy(async () => {
    if (!preventStoreReset) {
      await clearStore();
    }
  });
</script>

<div class="space-y-8">
  {#if successMessage}
    <InlineNotification
      kind="success"
      title={successMessage}
      timeout={0}
      on:close={() => {
        successMessage = "";
        // Optionally, remove the param from the URL:
        const url = new URL(window.location);
        url.searchParams.delete("success");
        window.history.replaceState({}, "", url);
      }}
    />
  {/if}

  {#if errorMessage}
    <InlineNotification
      kind="error"
      title={errorMessage}
      timeout={0}
      on:close={() => (errorMessage = "")}
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
              href="/users/add?{addAdminBtnQueryParams}?nt=reg"
              class="text-green-800 text-sm underline hover:text-green-900 font-medium ml-2"
            >
              {$addAdminBtnText}
            </a>
          {/if}
        </svelte:fragment>
      </InlineNotification>
    </div>
  {/if}

  {#if blockError}
    <div
      class="bg-white shadow rounded-lg p-6 min-h-40 flex items-center justify-center"
    >
      <ErrorMessage error={blockError || "Failed to load region details."} />
    </div>
  {:else}
    <BlockDetailsCard
      {statesList}
      block={data.block}
      {permissions}
      on:preventStoreReset={() => {
        preventStoreReset = true;
      }}
    />
    <hr class="text-dark-gray mt-2 mb-6" />
    <SchoolsTable
      blockId={data?.block?.uuid}
      orgId={data?.block?.organization_uuid}
      blockName={data?.block?.block_name}
      stateId={data?.block?.state_id}
      orgName={data?.block?.organization?.org_name}
    />
  {/if}
</div>
