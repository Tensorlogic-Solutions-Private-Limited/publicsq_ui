<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import LineLoader from "$lib/components/reusable/LineLoader.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let block = null;

  const dispatch = createEventDispatcher();
  let confirmationText = "";
  let error = "";
  let loading = false;

  function handleCancel() {
    dispatch("cancel");
  }

  function handleConfirmInput(event) {
    confirmationText = event.detail.value;
    error = "";
  }

  async function handleDelete() {
    if (confirmationText.toLowerCase().trim() !== "delete") {
      error = "Please type DELETE to confirm";
      return;
    }

    loading = true;
    try {
      const response = await apiClient(`/apis/blocks/${block.uuid}`, {
        method: "DELETE",
      });

      if (!response ||!response.ok) {
        if(response === null){
          throw new Error("Failed to delete region.");
        }
        const errorData = await response?.json();
        throw new Error(errorData.error || "Failed to delete region");
      }

      await response.json();
      dispatch("success", {
        block,
        message: `Successfully deleted region '${block.block_name}'.`,
      });
    } catch (err) {
      console.error("Error deleting region:", err);
      error = err.message || "Failed to delete region. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-neutral-100 p-6 rounded-md">
  {#if loading}
    <div class="mb-4">
      <LineLoader loaderColor={"bg-red-600"} />
    </div>
  {/if}

  {#if error}
    <div class="mb-4">
      <InlineNotification
        kind="error"
        title={error}
        hideCloseButton={true}
      />
    </div>
  {/if}

  <div class="mb-4">
    <div class="flex items-center gap-2">
      <Trash2 class="h-5 w-5 text-red-600" />

      <div class="">
        <h2 class="text-base font-semibold text-red-600">
          About to delete the Region - {block?.block_name || "-"}
        </h2>
      </div>
    </div>
  </div>

  <p class="text-sm text-dark-gray mb-2 mx-1">
    Are you sure you want to delete this region? This action cannot be undone.
  </p>
  <div class="space-y-6">
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
      <dl class="space-y-2">
        <div class="flex items-center">
          <dt class="text-sm font-medium text-gray-500 w-24">Name:</dt>
          <dd class="text-sm text-dark-gray">{block.block_name}</dd>
        </div>
        <div class="flex">
          <dt class="text-sm font-medium text-gray-500 w-24">Code:</dt>
          <dd class="text-sm text-dark-gray">{block.block_code}</dd>
        </div>
        <div class="flex">
          <dt class="text-sm font-medium text-gray-500 w-24">Description:</dt>
          <dd class="text-sm text-dark-gray">
            {block.block_description || "-"}
          </dd>
        </div>
      </dl>
    </div>

    <div class="border-t border-gray-200 pt-2">
      <p class="text-sm text-gray-700 mb-3">
        Please type <span class="font-medium text-red-600">DELETE</span> to confirm.
      </p>
      <InputField
        type="text"
        placeholder="Type DELETE to confirm"
        value={confirmationText}
        disabled={loading}
        on:handleInputData={handleConfirmInput}
      />
    </div>
  </div>

  <div class="mt-6 flex items-center justify-end gap-x-3">
    <Button
      btnType="secondary"
      on:click={handleCancel}
      disabled={loading}
      title="Cancel"
    >
      Cancel
    </Button>
    <Button
      btnType="danger"
      on:click={handleDelete}
      disabled={loading || confirmationText.toLowerCase().trim() !== "delete"}
      title="Delete Region"
    >
      Submit
    </Button>
  </div>
</div>
