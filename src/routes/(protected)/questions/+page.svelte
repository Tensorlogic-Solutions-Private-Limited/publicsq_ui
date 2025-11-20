<script>
  import Modal from "$lib/components/reusable/Modal.svelte";
  import BulkUpload from "$lib/components/BulkUpload.svelte";
  import QuesFiltersSection from "$lib/questions/QuesFiltersSection.svelte";
  import QnListingtable from "$lib/questions/QnListingtable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import QuestionDelete from "$lib/questions/QuestionDelete.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import {
    message,
    msgType,
  } from "/src/routes/(protected)/questions/questionsStore.js";

  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onDestroy } from "svelte";
  import { apiClient } from "$lib/utils/apiClient.js";
  let showBulkUploadModal = false;
  let showDeleteModal = false;
  let selectedQuestion = null;

  $: subjectsList = $page.data.subjectsData?.data || [];
  $: mediumsList = $page.data.mediumsData?.data || [];
  $: boardsList = $page.data.boardsData?.data || [];

  function openBulkUploadModal() {
    showBulkUploadModal = true;
  }

  function closeBulkUploadModal() {
    showBulkUploadModal = false;
  }


  function getFilterParams(qnFilters) {
    return {
      board_id: qnFilters.board.selectedItemId,
      medium_code: qnFilters.medium.selectedItemId,
      subject_code: qnFilters.subject.selectedItemId,
      standard: qnFilters.standard.selectedItemId,
      state_id: qnFilters.state.selectedItemId,
      question_text: qnFilters.text,
    };
  }

  function getFilterLabels(qnFilters) {
    const labels = [];
    if (qnFilters?.state?.selectedItemName) {
      labels.push({
        label: "State",
        value: qnFilters?.state?.selectedItemName,
        color: "bg-orange-100 text-orange-800",
      });
    }
    if (qnFilters.board?.selectedItemName) {
      labels.push({
        label: "Board",
        value: qnFilters.board.selectedItemName,
        color: "bg-blue-100 text-blue-800",
      });
    }
    if (qnFilters.medium?.selectedItemName) {
      labels.push({
        label: "Medium",
        value: qnFilters.medium.selectedItemName,
        color: "bg-green-100 text-green-800",
      });
    }
    if (qnFilters.subject?.selectedItemName) {
      labels.push({
        label: "Subject",
        value: qnFilters.subject.selectedItemName,
        color: "bg-purple-100 text-purple-800",
      });
    }
    if (qnFilters.standard) {
      labels.push({
        label: "Standard",
        value: `Std ${qnFilters.subject.selectedItemName}`,
        color: "bg-yellow-100 text-yellow-800",
      });
    }
    if (qnFilters.text) {
      labels.push({
        label: "Question Text",
        value: qnFilters.text,
        color: "bg-pink-100 text-pink-800",
      });
    }
    return labels;
  }

  let questions = [];
  let filtersApplied = null;

  let loadingQns = false;
  let hasSearchedOnce = false;

  async function handleSearchQns(qnFilters) {
    const paramsObj = getFilterParams(qnFilters);
    filtersApplied = getFilterLabels(qnFilters);
    loadingQns = true;
    hasSearchedOnce = true;

    const params = Object.entries(paramsObj)
      .filter(([key, val]) => val)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const url = `/apis/questions/filtered?${params}&limit=10000`;
    try {
      const res = await apiClient(url);
      if (!res || !res.ok) {
        throw new Error(
          `Failed to fetch questions: ${res?.status || "Unknown error"}`
        );
      }
      questions = await res.json();
      
      
    } catch (err) {
      console.error("Error fetching questions:", err);
      questions = [];
    } finally {
      loadingQns = false;
    }
  }

  function handleDeleteQuesiton(event) {
    selectedQuestion = event.detail.detail.actionData;
    showDeleteModal = true;
  }

  async function handleDeletionSuccess(event) {
    const { message: deleteMessage } = event.detail;

    // Update store with deletion message
    message.set(deleteMessage);
    msgType.set("success");

    // Remove the deleted question from the list
    questions = questions.filter((q) => q.code !== selectedQuestion.code);

    showDeleteModal = false;
    selectedQuestion = null;
  }

  function clearStore() {
    message.set("");
    msgType.set("");
  }
  function handleClearFilters() {
    filtersApplied = [];
  }

  onDestroy(() => {
    clearStore();
  });
</script>

{#if $message}
  <div class="my-4">
    <InlineNotification
      kind={$msgType || "success"}
      title={$message}
      on:close={() => clearStore()}
    />
  </div>
{/if}
<div class="pr-6">
  <div class="flex w-full justify-between items-start">
    <div>
      <h2 class="heading-L">Questions</h2>
      <p class="text-sm text-gray-600 mt-1">
        Search and view questions in your question bank
      </p>
    </div>

    <!-- <Button
      btnType="secondary"
      title="Open Modal"
      on:click={openBulkUploadModal}>Bulk Upload</Button
    > -->
    
  </div>

  <div class="my-12">
    <BulkUpload
      endPoint="/apis/questions/bulk-upload"
      usePolling={true}
      bulkUploadItemName="Questions"
      templatePath="/apis/questions/template"
    />
  </div>
  <hr class=" border-b-gray-200 mb-6" />

  <QuesFiltersSection
    {handleSearchQns}
    on:clearFilters={handleClearFilters}
  />

  {#if filtersApplied && filtersApplied.length > 0}
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="text-sm font-semibold text-gray-700">Filters applied:</span>
      {#each filtersApplied as filter}
        <span class={`px-2 py-1 rounded text-xs ${filter.color}`}
          >{filter.label}: {filter.value}</span
        >
      {/each}
    </div>
  {/if}
  {#if loadingQns}
    <DatatableSkeleton />
  {:else if hasSearchedOnce}
    {#if questions?.length > 0}
      <div class="mt-4">
        <QnListingtable
          {questions}
          {loadingQns}
          board={filtersApplied?.find((f) => f.label === "Board")?.value}
          state={filtersApplied?.find((f) => f.label === "State")?.value}
          subject={filtersApplied?.find((f) => f.label === "Subject")?.value}
          on:deleteQuestion={handleDeleteQuesiton}
        />
      </div>
    {:else}
      <div>
        <h3 class="font-medium text-base">No questions found.</h3>
        <p>
          No questions match your search criteria. Try adjusting your filters.
        </p>
      </div>
    {/if}
  {/if}
  <!-- <QnListingtable {questions} {loadingQns} /> -->
</div>

{#if showDeleteModal && selectedQuestion}
  <Portal>
    <div
      class="bg-neutral-100 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-3/4 overflow-y-scroll"
    >
      <QuestionDelete
        question={selectedQuestion}
        on:success={handleDeletionSuccess}
        on:cancel={() => {
          showDeleteModal = false;
          selectedQuestion = null;
        }}
      />
    </div>
  </Portal>
{/if}
