<script>
  import { onMount } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Funnel from "@lucide/svelte/icons/funnel";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import QuesFiltersSkeleton from "./QuesFiltersSkeleton.svelte";
  import { createEventDispatcher } from "svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let handleSearchQns = () => {};

  const dispatch = createEventDispatcher();

  let validationErrors = {
    board: "",
    medium: "",
    subject: "",
    standard: "",
    state: "",
  };

  $: canSearch =
    !loading &&
    qnFilters.board.selectedItemId &&
    qnFilters.medium.selectedItemId &&
    qnFilters.subject.selectedItemId;

  let qnFilters = {
    medium: { selectedItemId: "", selectedItemName: "" },
    board: { selectedItemId: "", selectedItemName: "" },
    subject: { selectedItemId: "", selectedItemName: "" },
    standard: { selectedItemId: "", selectedItemName: "" },
    state: { selectedItemId: "", selectedItemName: "" },
    text: "",
  };
  // <Funnel />

  // Remove props, manage all filter lists locally
  let statesList = []; // NOTE: THIS IS  a temporary arrangement. Can be optimised further by taking states data from layout
  let localSubjectsList = [];
  let subjectsLoading = false;
  let subjectsError = null;
  let mediumsList = [];
  let boardsList = [];
  let loading = true;
  let mediumsError = null;
  let boardsError = null;
  let statesError = null;
  const classesList = [
    { id: "1", name: "Class 1" },
    { id: "2", name: "Class 2" },
    { id: "3", name: "Class 3" },
    { id: "4", name: "Class 4" },
    { id: "5", name: "Class 5" },
    { id: "6", name: "Class 6" },
    { id: "7", name: "Class 7" },
    { id: "8", name: "Class 8" },
    { id: "9", name: "Class 9" },
    { id: "10", name: "Class 10" },
    { id: "11", name: "Class 11" },
    { id: "12", name: "Class 12" },
  ];

  let prevStandard = "";
  let prevMedium = "";
  $: if (qnFilters.standard.selectedItemId && qnFilters.medium.selectedItemId) {

    // guard clause to prevent fetching on every qnFilters change
    if (
      qnFilters.standard.selectedItemId !== prevStandard ||
      qnFilters.medium.selectedItemId !== prevMedium
    ) {
      prevStandard = qnFilters.standard.selectedItemId;
      prevMedium = qnFilters.medium.selectedItemId;

      //resetting subject data in UI when subject is fetched
      qnFilters.subject.selectedItemName = "";
      qnFilters.subject.selectedItemId = "";

      fetchSubjects(
        qnFilters.standard.selectedItemId,
        qnFilters.medium.selectedItemId
      );
    }
  }

  async function fetchResource(url, failMsg) {
    const result = { data: null, error: false, errorMsg: "" };
    try {
      const res = await fetch(url);
      if (!res.ok) {
        result.error = true;
        result.errorMsg = failMsg;
      } else {
        result.data = await res.json();
      }
    } catch (err) {
      result.error = true;
      result.errorMsg = err.message || "Unknown error";
    }
    return result;
  }

  async function fetchAll() {
    loading = true;
    mediumsError = null;
    boardsError = null;
    statesError = null;
    validationErrors.board = "";
    validationErrors.medium = "";
    validationErrors.state = "";
    const [mediumsRes, boardsRes, statesRes] = await Promise.all([
      fetchResource("/apis/mediums", "Failed to fetch mediums"),
      fetchResource("/apis/boards", "Failed to fetch boards"),
      fetchResource("/apis/states", "Failed to fetch states"),
    ]);
    // mediums response handling
    if (mediumsRes.error) {
      mediumsError = mediumsRes.errorMsg;
      validationErrors.medium = "Failed to fetch mediums";
      mediumsList = [];
    } else {
      mediumsList = (mediumsRes?.data || []).map((m) => ({
        id: m.medium_code,
        name: m.medium_name,
      }));
    }

    // boards response handling
    if (boardsRes.error) {
      boardsError = boardsRes.errorMsg;
      validationErrors.board = "Failed to fetch boards";
      boardsList = [];
    } else {
      boardsList = (boardsRes?.data || []).map((b) => ({
        id: b.board_id || b.id,
        name: b.board_name,
      }));
    }
    // states response handling
    if (statesRes.error) {
      statesError = statesRes.errorMsg;
      validationErrors.state = "Failed to fetch states";
      statesList = [];
    } else {
      statesList = (statesRes?.data?.data || []).map((s) => ({
        id: s.id,
        name: s.state_name,
      }));
    }
    loading = false;
  }

  async function retryResource(type) {
    loading = true;
    try {
      if (type === "mediums") {
        mediumsError = null;
        validationErrors.medium = "";
        const res = await fetchResource(
          "/apis/mediums",
          "Failed to fetch mediums"
        );
        if (res.error) {
          mediumsError = res.errorMsg;
          mediumsList = [];
        } else {
          mediumsList = (res.data || []).map((m) => ({
            id: m.medium_code,
            name: m.medium_name,
          }));
        }
      } else if (type === "boards") {
        boardsError = null;
        validationErrors.board = "";
        const res = await fetchResource(
          "/apis/boards",
          "Failed to fetch boards"
        );
        if (res.error) {
          boardsError = res.errorMsg;
          validationErrors.board = "Failed to fetch boards";
          boardsList = [];
        } else {
          boardsList = (res.data || []).map((b) => ({
            id: b.board_code || b.id,
            name: b.board_name || b.name,
          }));
        }
      } else if (type === "states") {
        statesError = null;
        validationErrors.state = "";
        const res = await fetchResource(
          "/apis/states",
          "Failed to fetch states"
        );
        if (res.error) {
          statesError = res.errorMsg;
          validationErrors.state = "Failed to fetch states";
          statesList = [];
        } else {
          statesList = (res?.data?.data || []).map((s) => ({
            id: s.id,
            name: s.state_name,
          }));
        }
      }
    } catch (err) {
      if (type === "mediums") {
        mediumsError = err.message || "Unknown error";
        mediumsList = [];
      } else if (type === "boards") {
        boardsError = err.message || "Unknown error";
        boardsList = [];
      } else if (type === "states") {
        statesError = err.message || "Unknown error";
        statesList = [];
      }
    } finally {
      loading = false;
    }
  }

  onMount(fetchAll);

  //Hardcoded class options 1 to 12

  async function fetchSubjects(standard, mediumId) {
    subjectsLoading = true;
    subjectsError = null;
    validationErrors.subject = "";
    try {
      let params = [];
      if (standard) params.push(`standard=${encodeURIComponent(standard)}`);
      if (mediumId) params.push(`medium_code=${encodeURIComponent(mediumId)}`);
      const url = `/apis/subjects${params.length ? "?" + params.join("&") : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      // Transform to {id, name}
      localSubjectsList = (data || []).map((s) => ({
        id: s.subject_code,
        name: s.subject_name,
      }));
      if (localSubjectsList?.length === 0) {
        validationErrors.subject =
          "No subjects available for the selected combination";
      }
    } catch (err) {
      localSubjectsList = [];
      subjectsError = err.message;
      validationErrors.subject = subjectsError;
    } finally {
      subjectsLoading = false;
    }
  }

  function handleMediumSelection(e) {}

  function handleClassSelection(e) {}
  function handleSubjectSelection(e) {}

  function handleclearAllFilters() {
    qnFilters = {
      medium: { selectedItemId: "", selectedItemName: "" },
      board: { selectedItemId: "", selectedItemName: "" },
      subject: { selectedItemId: "", selectedItemName: "" },
      standard: { selectedItemId: "", selectedItemName: "" },
      text: "",
    };
    dispatch("clearFilters");
  }

  function handleSearch() {
    // Reset errors
    validationErrors = { board: "", medium: "", subject: "" };
    let hasError = false;
    if (!qnFilters.standard.selectedItemId) {
      validationErrors.standard = "Required";
      hasError = true;
    }
    // if (!qnFilters.board.selectedItemId) {
    //   validationErrors.board = "Required";
    //   hasError = true;
    // }
    if (!qnFilters.medium.selectedItemId) {
      validationErrors.medium = "Required";
      hasError = true;
    }
    if (!qnFilters.subject.selectedItemId) {
      validationErrors.subject = "Required";
      hasError = true;
    }
    if (!qnFilters.state.selectedItemId) {
      validationErrors.state = "Required";
      hasError = true;
    }
    if (hasError) return;
    handleSearchQns?.(qnFilters);
  }
</script>

{#if loading}
  <QuesFiltersSkeleton />
{:else}
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">List questions</h3>
        <p class="text-sm text-gray-600 mt-1">
          Refine your search by adding filters
        </p>
      </div>
    </div>

    {#if mediumsError && boardsError}
      <div class="py-4">
        <InlineNotification
          kind="error"
          title="Failed to load filters"
          subtitle={`${mediumsError} | ${boardsError}`}
          action={{ text: "Retry All", handler: fetchAll, closeAfter: true }}
        />
      </div>
    {:else if mediumsError}
      <div class="py-4">
        <InlineNotification
          kind="error"
          title="Failed to load mediums"
          subtitle={mediumsError}
          action={{
            text: "Retry",
            handler: () => retryResource("mediums"),
            closeAfter: true,
          }}
        />
      </div>
    {:else if boardsError}
      <div class="py-4">
        <InlineNotification
          kind="error"
          title="Failed to load boards"
          subtitle={boardsError}
          action={{
            text: "Retry",
            handler: () => retryResource("boards"),
            closeAfter: true,
          }}
        />
      </div>
    {:else if statesError}
      <div class="py-4">
        <InlineNotification
          kind="error"
          title="Failed to load states"
          subtitle={statesError}
          action={{
            text: "Retry",
            handler: () => retryResource("states"),
            closeAfter: true,
          }}
        />
      </div>
    {/if}
    <!-- Search Filters -->
    <div class=" border border-gray-200 rounded-lg p-6">
      <div class="flex items-center gap-2 mb-4">
        <Funnel size={16} />
        <h4 class="text-sm font-medium text-gray-900">Filters</h4>
      </div>

      <div class="mb-4">
        <InputField
          label="Question text"
          placeholder="Enter question text"
          bind:value={qnFilters.text}
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <!-- State Name -->
        <div>
          <SearchableComboBox
            label={"State"}
            required
            validationErrors={validationErrors.state}
            placeholder="Select state"
            options={statesList}
            filterCategory="state-name"
            bind:selectedItemId={qnFilters.state.selectedItemId}
            bind:selectedItemName={qnFilters.state.selectedItemName}
          />
        </div>
        <!-- Board Name -->
        <div>
          <SearchableComboBox
            label={"Board"}
            required
            validationErrors={validationErrors.board}
            placeholder="Select board"
            options={boardsList}
            filterCategory="edu-board-name"
            bind:selectedItemId={qnFilters.board.selectedItemId}
            bind:selectedItemName={qnFilters.board.selectedItemName}
          />
        </div>
        <!-- Medium -->
        <div>
          <SearchableComboBox
            required
            label={"Medium"}
            validationErrors={validationErrors.medium}
            placeholder="Select medium"
            options={mediumsList}
            filterCategory="medium-name"
            bind:selectedItemId={qnFilters.medium.selectedItemId}
            bind:selectedItemName={qnFilters.medium.selectedItemName}
            on:handleDispatchComboBoxData={handleMediumSelection}
          />
        </div>
        <!-- class -->
        <div>
          <SearchableComboBox
            required
            label={"Class"}
            validationErrors={validationErrors.standard}
            placeholder="Select class"
            options={classesList}
            filterCategory="class-name"
            bind:selectedItemId={qnFilters.standard.selectedItemId}
            bind:selectedItemName={qnFilters.standard.selectedItemName}
            on:handleDispatchComboBoxData={handleSubjectSelection}
          />
        </div>
        <!-- Subject -->
        <div>
          <SearchableComboBox
            required
            label={"Subject"}
            validationErrors={validationErrors.subject}
            placeholder="Select subject"
            options={localSubjectsList}
            filterCategory="subject-name"
            bind:selectedItemId={qnFilters.subject.selectedItemId}
            bind:selectedItemName={qnFilters.subject.selectedItemName}
            on:handleDispatchComboBoxData={handleClassSelection}
          />
          <span
            class="text-xs text-accent mt-1 {!qnFilters.standard
              .selectedItemId || !qnFilters.medium.selectedItemId
              ? 'opacity-100'
              : 'opacity-0'}"
          >
            Help: Select medium and class to get subject list
          </span>
        </div>
        <!-- Standard/Class -->
        <div></div>
        <!-- Start Date -->
        <div></div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          btnType="secondary"
          type="button"
          on:click={handleclearAllFilters}
        >
          <div class="flex items-center justify-center">
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear Filters
          </div>
        </Button>

        <Button
          btnType="primary"
          type="button"
          disabled={!canSearch}
          on:click={handleSearch}
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching...
            </div>
          {:else}
            <div class="flex items-center justify-center">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </div>
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
