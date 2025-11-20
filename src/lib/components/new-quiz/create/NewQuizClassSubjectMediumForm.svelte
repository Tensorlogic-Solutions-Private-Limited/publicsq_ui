<script>
  import { onMount, createEventDispatcher } from "svelte";
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";
  import { USER_ROLES } from "$lib/constants.js";
  import { authStore } from "$lib/stores/authStore.js";

  export let showInUI = false;
  export let statesList = [];
  export let boardsList = [];
  export let mediumsList = [];
  export let fetchDataInternally = true; // If false, use props from parent

  // Check if user has permission to see states dropdown
  $: canViewStates =
    $authStore?.roleCode &&
    ["super_admin", "admin", "admin_user"].includes($authStore.roleCode);

  const dispatch = createEventDispatcher();
  let subjectsList = [];
  let classesList = [
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
  let divisionList = Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return { id: letter, name: letter };
  });

  let loading = true;
  let error = null;
  let validationErrors = {
    board: "",
    medium: "",
    class: "",
    division: "",
    subject: "",
    state: "",
  };

  let selectedBoard = { id: "", name: "" };
  let selectedMedium = { id: "", name: "" };
  let selectedClass = { id: "", name: "" };
  let selectedDivision = { id: "", name: "" };
  let selectedSubject = { id: "", name: "" };
  let selectedState = { id: "", name: "" };

  let subjectsLoading = false;
  let subjectsError = null;
  let prevClass = "";
  let prevMedium = "";

  async function fetchResource(url, failMsg) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(failMsg);
      return await res.json();
    } catch (err) {
      error = err.message || failMsg;
      return [];
    }
  }

  async function fetchBoardsAndMediums() {
    if (!fetchDataInternally) {
      loading = false;
      return; // Use props from parent
    }
    
    loading = true;
    error = null;
    boardsList = [];
    mediumsList = [];
    try {
      const [boards, mediums] = await Promise.all([
        fetchResource("/apis/boards", "Failed to fetch boards"),
        fetchResource("/apis/mediums", "Failed to fetch mediums"),
      ]);
      boardsList = (boards?.data || boards).map((b) => ({
        id: b.board_id || b.id,
        name: b.board_name,
      }));
      mediumsList = (mediums?.data || mediums).map((m) => ({
        id: m.medium_code,
        name: m.medium_name,
      }));
    } catch (err) {
      error = err.message || "Failed to fetch filters";
    } finally {
      loading = false;
    }
  }

  async function fetchSubjects() {
    if (!selectedClass.id || !selectedMedium.id) return;
    if (selectedClass.id === prevClass && selectedMedium.id === prevMedium)
      return;
    prevClass = selectedClass.id;
    prevMedium = selectedMedium.id;
    subjectsLoading = true;
    subjectsError = null;
    subjectsList = [];
    try {
      const params = `?standard=${encodeURIComponent(selectedClass.id)}&medium_code=${encodeURIComponent(selectedMedium.id)}`;
      const res = await fetch(`/apis/subjects${params}`);
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      subjectsList = (data || []).map((s) => ({
        id: s.subject_code,
        name: s.subject_name,
      }));
      if (subjectsList.length === 0)
        subjectsError = "No subjects available for the selected combination";
    } catch (err) {
      subjectsError = err.message || "Failed to fetch subjects";
      subjectsList = [];
    } finally {
      subjectsLoading = false;
    }
  }

  function handleSubmit() {
    validationErrors = {
      board: "",
      medium: "",
      class: "",
      subject: "",
      state: "",
    };
    let hasError = false;

    // Only validate state if user has permission to see it
    if (canViewStates && !selectedState.id) {
      validationErrors.state = "Required";
      hasError = true;
    }

    if (!selectedBoard.id) {
      validationErrors.board = "Required";
      hasError = true;
    }
    if (!selectedMedium.id) {
      validationErrors.medium = "Required";
      hasError = true;
    }
    if (!selectedClass.id) {
      validationErrors.class = "Required";
      hasError = true;
    }
    if (!selectedSubject.id) {
      validationErrors.subject = "Required";
      hasError = true;
    }
    if (hasError) return;
    dispatch("submit", {
      boardId: selectedBoard.id,
      boardName: selectedBoard.name,
      mediumId: selectedMedium.id,
      mediumName: selectedMedium.name,
      classId: selectedClass.id,
      className: selectedClass.name,
      division: selectedDivision.id,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      stateName: selectedState.name,
      stateId: selectedState.id,
    });
  }

  function handleClear() {
    selectedBoard = { id: "", name: "" };
    selectedMedium = { id: "", name: "" };
    selectedClass = { id: "", name: "" };
    selectedDivision = { id: "", name: "" };
    selectedSubject = { id: "", name: "" };
    selectedState = { id: "", name: "" };
    subjectsList = [];
    validationErrors = {
      board: "",
      medium: "",
      class: "",
      subject: "",
      state: "",
    };
    dispatch("clear");
  }

  $: if (selectedClass.id && selectedMedium.id) {
    selectedSubject.id = "";
    selectedSubject.name = "";
    fetchSubjects();
  }

  onMount(fetchBoardsAndMediums);
</script>

<div class="sr-only">Class, Sub, Board Fitler</div>
{#if showInUI}
  {#if loading}
    <div class="p-8 text-center text-gray-500">Loading filters...</div>
  {:else}
    {#if error}
      <InlineNotification kind="error" title={error} />
    {/if}
    <form
      class="space-y-6 mb-6 border-b border-b-gray-200 pb-6"
      on:submit|preventDefault={handleSubmit}
    >
    <!-- <form
      class="space-y-6 border-gray-200 border rounded-lg p-4"
      on:submit|preventDefault={handleSubmit}
    > -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4 mb-2"
      >
        {#if canViewStates}
          <div>
            <SearchableComboBox
              required
              label="State"
              options={statesList}
              placeholder="Select state"
              bind:selectedItemId={selectedState.id}
              bind:selectedItemName={selectedState.name}
              validationErrors={validationErrors.state}
            />
          </div>
        {/if}
        <div>
          <SearchableComboBox
            required
            label="Board"
            options={boardsList}
            placeholder="Select board"
            bind:selectedItemId={selectedBoard.id}
            bind:selectedItemName={selectedBoard.name}
            validationErrors={validationErrors.board}
          />
        </div>
        <div>
          <SearchableComboBox
            required
            label="Medium"
            options={mediumsList}
            placeholder="Select medium"
            bind:selectedItemId={selectedMedium.id}
            bind:selectedItemName={selectedMedium.name}
            validationErrors={validationErrors.medium}
          />
        </div>
        <div>
          <SearchableComboBox
            required
            label="Class"
            options={classesList}
            placeholder="Select class"
            bind:selectedItemId={selectedClass.id}
            bind:selectedItemName={selectedClass.name}
            validationErrors={validationErrors.class}
          />
        </div>
        <div>
          <SearchableComboBox
            label="Division"
            options={divisionList}
            placeholder="Select division"
            bind:selectedItemId={selectedDivision.id}
            bind:selectedItemName={selectedDivision.name}
            validationErrors={validationErrors.division}
          />
        </div>
        <div>
          <SearchableComboBox
            required
            label="Subject"
            options={subjectsList}
            placeholder="Select subject"
            bind:selectedItemId={selectedSubject.id}
            bind:selectedItemName={selectedSubject.name}
            validationErrors={validationErrors.subject || subjectsError}
            loading={subjectsLoading}
          />
          <span
            class="text-xs text-accent mt-1 {!selectedClass.id ||
            !selectedMedium.id
              ? 'opacity-100'
              : 'opacity-0'}"
          >
            Help: Select medium and class to get subject list
          </span>
        </div>
      </div>
      <div class="flex gap-3 justify-end">
        <Button type="button" btnType="secondary" on:click={handleClear}
          >Clear</Button
        >
        <Button type="submit" btnType="primary">Submit</Button>
      </div>
    </form>
  {/if}
{/if}
