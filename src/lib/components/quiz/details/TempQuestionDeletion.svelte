<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import LineLoader from "$lib/components/reusable/LineLoader.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";

  export let question = null;
  export let questionMetaData = {};
  export let deletionUrl = null; // Accept deletion URL as prop
  
  const dispatch = createEventDispatcher();
  let confirmationText = "";
  let error = "";
  let loading = false;

  $: console.log('question',question)
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
    
    // Use provided deletionUrl or construct from questionMetaData
    console.log('deletionUrl in temp quesiton deltion',deletionUrl)
    const url = deletionUrl || 
      `/apis/exams/${questionMetaData?.exam_code}/qn_papers/${questionMetaData?.qp_code}/questions/${question?.id}`;
    
    loading = true;
    try {
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete question");
      }

      await response.json();
      dispatch("deleteSuccess", {
        question,
        message: `Successfully removed question '${question.text}'.`,
      });
    } catch (err) {
      console.error("Error deleting quiz:", err);
      error = err.message || "Failed to removed question. Please try again.";
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

    {#if error}
      <div class="mb-4">
        <InlineNotification kind="error" title={error} hideCloseButton={true}>
          <Button
            slot="actions"
            btnType="secondary"
            on:click={handleDelete}
            disabled={loading || confirmationText.toLowerCase().trim() !== "delete"}
          >
            Retry
          </Button>
        </InlineNotification>
      </div>
    {/if}

    <div class="mb-4">
      <div class="flex items-center gap-2">
       
        <div>
          <h2 class="text-base font-semibold text-red-600">
            About to remove the Question - {question?.text || "-"}
          </h2>
        </div>
      </div>
    </div>

    <p class="text-sm text-dark-gray mb-2 ">
      Are you sure you want to remove this question from this quiz? This action
      cannot be undone.
    </p>
    <div class="space-y-6">
      <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
        <dl class="space-y-2">
          <div class="flex items-center">
            <dd class="text-sm text-dark-gray">{question?.text}</dd>
          </div>
          {#each question.options as option}
            <div class="flex gap-2">
              <dt class="text-sm text-gray-500">
                {option.id}.
              </dt>
              <dd class="text-sm text-dark-gray">
                {option?.text}
                {option.is_correct ? "(Correct answer)" : ""}
              </dd>
            </div>
          {/each}
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
        title="Delete Question"
      >
        Delete
      </Button>
    </div>
  </div>
</Portal>
