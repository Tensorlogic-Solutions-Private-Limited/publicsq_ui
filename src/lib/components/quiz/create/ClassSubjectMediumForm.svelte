<script>
  import SearchableComboBox from "$lib/components/reusable/SearchableComboBox.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import InlineNotification from "$lib/components/reusable/InlineNotification.svelte";

  export let classOptions = [
    { id: 1, name: "1" },
    { id: 2, name: "2" },
    { id: 3, name: "3" },
    { id: 4, name: "4" },
    { id: 5, name: "5" },
    { id: 6, name: "6" },
    { id: 7, name: "7" },
    { id: 8, name: "8" },
    { id: 9, name: "9" },
    { id: 10, name: "10" },
    { id: 11, name: "11" },
    { id: 12, name: "12" },
  ];
  export let subjectOptions = [];
  export let mediumOptions = [];
  export let initialClass = "";
  export let initialSubject = "";
  export let initialMedium = "";
  export let loading = false;

  let selectedClassId = initialClass;
  let selectedClassName = "";
  let selectedSubjectId = initialSubject;
  let selectedSubjectName = "";
  let selectedMediumId = initialMedium;
  let selectedMediumName = "";

  const dispatch = createEventDispatcher();

  function handleClassChange(e) {
    selectedClassId = e.detail.selectedItemId;
    selectedClassName = e.detail.selectedItemName;
    dispatch("classChange", { id: selectedClassId, name: selectedClassName });
  }
  function handleSubjectChange(e) {
    selectedSubjectId = e.detail.selectedItemId;
    selectedSubjectName = e.detail.selectedItemName;
    dispatch("subjectChange", {
      id: selectedSubjectId,
      name: selectedSubjectName,
    });
  }
  function handleMediumChange(e) {
    selectedMediumId = e.detail.selectedItemId;
    selectedMediumName = e.detail.selectedItemName;
    dispatch("mediumChange", {
      id: selectedMediumId,
      name: selectedMediumName,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    dispatch("submit", {
      classId: selectedClassId,
      className: selectedClassName,
      subjectId: selectedSubjectId,
      subjectName: selectedSubjectName,
      mediumId: selectedMediumId,
      mediumName: selectedMediumName,
    });
  }

  function handleClear() {
    selectedClassId = "";
    selectedClassName = "";
    selectedSubjectId = "";
    selectedSubjectName = "";
    selectedMediumId = "";
    selectedMediumName = "";
    dispatch("clear");
  }
</script>

<form
  class="space-y-6 border border-gray-200 rounded-lg p-4"
  on:submit|preventDefault={handleSubmit}
>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <SearchableComboBox
        label="Class"
        options={classOptions}
        selectedItemId={selectedClassId}
        selectedItemName={selectedClassName}
        placeholder="Select class"
        on:handleDispatchComboBoxData={handleClassChange}
      />
    </div>
    <div>
      <SearchableComboBox
        label="Subject"
        options={subjectOptions}
        selectedItemId={selectedSubjectId}
        selectedItemName={selectedSubjectName}
        placeholder="Select subject"
        on:handleDispatchComboBoxData={handleSubjectChange}
      />
    </div>
    <div>
      <SearchableComboBox
        label="Medium"
        options={mediumOptions}
        selectedItemId={selectedMediumId}
        selectedItemName={selectedMediumName}
        placeholder="Select medium"
        on:handleDispatchComboBoxData={handleMediumChange}
      />
    </div>
  </div>
  <div class="flex gap-3 justify-end pt-2">
    <Button type="button" btnType="secondary" on:click={handleClear}>
      Clear Selection
    </Button>
    <Button type="submit" btnType="primary" disabled={loading}>
      {#if loading}
        <span
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
        ></span>
        Submitting...
      {:else}
        Submit
      {/if}
    </Button>
  </div>
</form>
