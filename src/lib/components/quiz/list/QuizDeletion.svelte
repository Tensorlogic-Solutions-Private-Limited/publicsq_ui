<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import LineLoader from "$lib/components/reusable/LineLoader.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";

  export let quiz = null;
  export let deletionUrl = null; // Accept deletion URL as prop

  const dispatch = createEventDispatcher();
  let confirmationText = "";
  let error = {
    type: "",
    message: "",
    cbFn: null,
  };
  let loading = false;

  function resetError() {
    error = {
      type: "",
      message: "",
      cbFn: null,
    };
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleConfirmInput(event) {
    confirmationText = event.detail.value;
    resetError();
  }

  async function handleDelete() {
    if (confirmationText.toLowerCase().trim() !== "delete") {
      error = {
        type: "error",
        message: "Please type DELETE to confirm",
        cbFn: null,
      };
      return;
    }

    // Use provided deletionUrl or fallback to default
    const url = deletionUrl || `/apis/exams/${quiz.exam_code}`;

    loading = true;
    try {
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(()=>{});
        throw new Error(errorData.detail || "Failed to delete quiz");
      }

      await response.json();
      dispatch("success", {
        quiz,
        message: `Successfully deleted quiz '${quiz.exam_name}'.`,
      });
    } catch (err) {
      console.error("Error deleting quiz:", err);
      error = {
        type: "error",
        message: err.message || "Failed to delete quiz. Please try again.",
        cbFn: handleDelete,
      };
    } finally {
      loading = false;
    }
  }
</script>

<Portal>
  <div class="bg-neutral-100 p-6 rounded-md max-w-3xl width-[90%]">
    {#if loading}
      <div class="mb-4">
        <LineLoader loaderColor={"bg-red-600"} />
      </div>
    {/if}

    {#if error.message}
      <div class="mb-4">
        <InlineNotification
          kind={error.type}
          title={error.message}
          hideCloseButton={true}
        >
          <span slot="actions">
            {#if error.type === "error" && error.cbFn}
              <Button btnType="secondary" on:click={error.cbFn}>Retry</Button>
            {/if}
          </span>
        </InlineNotification>
      </div>
    {/if}

    <div class="mb-4">
      <div class="flex items-center gap-2">
        <Trash2 class="h-5 w-5 text-red-600" />
        <div>
          <h2 class="text-base font-semibold text-red-600">
            About to delete the Quiz - {quiz?.exam_name || "-"}
          </h2>
        </div>
      </div>
    </div>

    <p class="text-sm text-dark-gray mb-2 mx-1">
      Are you sure you want to delete this quiz? This action cannot be undone.
    </p>
    <div class="space-y-6">
      <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
        <dl class="space-y-2">
          <div class="flex items-center">
            <dt class="text-sm font-medium text-gray-500 w-24">Name:</dt>
            <dd class="text-sm text-dark-gray">{quiz.exam_name}</dd>
          </div>
          <div class="flex">
            <dt class="text-sm font-medium text-gray-500 w-24">Code:</dt>
            <dd class="text-sm text-dark-gray">{quiz.exam_code}</dd>
          </div>
          <div class="flex">
            <dt class="text-sm font-medium text-gray-500 w-24">Status:</dt>
            <dd class="text-sm text-dark-gray">{quiz.status}</dd>
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
        title="Delete Quiz"
      >
        Submit
      </Button>
    </div>
  </div>
</Portal>
