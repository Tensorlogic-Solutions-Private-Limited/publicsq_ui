<script>
  import { createEventDispatcher, onMount } from "svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";
  import InfoRow from "$lib/components/reusable/InfoRow.svelte";
  import { HelpCircle } from "@lucide/svelte/icons";
  import Button from "$lib/components/reusable/Button.svelte";
  import ImageCard from "$lib/components/reusable/ImageCard.svelte";
  export let detailsRow = null;

  const dispatch = createEventDispatcher();

  // ------------------------- Metadata related functions ------------------------------
  function getMetaRows(row) {
    function getStateName(stateId) {
      if (!stateId) return "-";
      if (typeof row.state === "string") return row.state;
      if (typeof row.state === "object" && row.state.name)
        return row.state.name;
      if (row.state_name) return row.state_name;
      return stateId;
    }
    function getBoardNames(boards) {
      if (!boards) return "-";
      if (Array.isArray(boards)) return boards.join(", ");
      if (typeof boards === "string") return boards;
      if (typeof boards === "object" && boards.name) return boards.name;
      return "-";
    }
    function getSubject(subject) {
      if (!subject) return "-";
      if (typeof subject === "object" && subject.smt_subject_name)
        return subject.smt_subject_name;
      return subject;
    }
    return [
      { label: "State", value: getStateName(row?.state_id || row?.state) },
      { label: "Boards", value: getBoardNames(row?.boards || row?.board) },
      { label: "Subject", value: getSubject(row?.subject) },
      { label: "Question Type", value: row?.question_type || "-" },
      { label: "Format", value: row?.format },
    ];
  }

  // ---------------------- Life cycle functions ----------------------------------

  onMount(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // ----------------------- General Functions -----------------------------------

  function close() {
    dispatch("close");
  }

  function handleKey(ev) {
    if (ev.key === "Escape") close();
  }
</script>

{#if detailsRow}
  <div
    class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
  >
    <!-- Close button -->
    <Button
      class="absolute top-4 right-4 text-gray-600 text-base p-2 rounded-full hover:bg-gray-200 transition-colors z-10"
      aria-label="Close"
      on:click={close}>✕</Button
    >
    <DetailsHeader
      icon={HelpCircle}
      heading="Question Details"
      class_="rounded-t-lg"
      showEdit={false}
      showDelete={false}
      showPasswordChange={false}
      showActiveTag={false}
    />
    <div class="px-6 pb-6 mt-6">
      <!-- Meta Data Card -->
      <div class="bg-slate-50 rounded-xl shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {#each getMetaRows(detailsRow) as { label, value }}
            <InfoRow
              {label}
              {value}
            />
          {/each}
        </div>
      </div>

      <div class="bg-slate-50 rounded-xl shadow-sm p-4 mb-6">

        <!-- Question Content Card -->
        <div class="mb-4">
          <div class="flex items-start gap-3">
            <div class="text-sm font-semibold text-dark-gray mb-1">
              {#if detailsRow.qmt_question_text && detailsRow.qmt_question_text.trim() !== ""}
                {detailsRow.qmt_question_text}
              {:else}
                <span class="italic text-sm font-semibold text-dark-gray mb-1"
                  >Image Question</span
                >
              {/if}
            </div>
          </div>
        </div>
        <!-- Question Images Card -->
        <ImageCard images={detailsRow.qmt_question_text_media} />
        <!-- Options -->
        <div class="mb-4 mt-6">
          <div class="text-sm font-semibold text-dark-gray mb-4">
            Answer Options
          </div>
          <div class="grid gap-y-6 gap-x-3">
            {#each detailsRow.options as opt, idx}
              <div>
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm"
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span class="text-sm text-dark-gray">
                    {#if opt && opt.trim() !== ""}
                      {opt}
                    {:else if detailsRow[`option${idx + 1}_media`] && detailsRow[`option${idx + 1}_media`].length}
                      <i>Image Option</i>
                    {/if}
                  </span>
                </div>
                <ImageCard
                  images={detailsRow[`option${idx + 1}_media`]}
                  class_="mt-2 pl-10"
                />
              </div>
            {/each}
          </div>
        </div>
        <!-- Correct Answer -->
        <div class="mb-2 flex items-center gap-2">
          <div class="text-sm font-semibold text-dark-gray">
            Correct Answer:
          </div>
          <div class="text-green-700 font-semibold text-sm">
            {#if typeof detailsRow.qmt_correct_answer === "string" && detailsRow.qmt_correct_answer.length === 1}
              {detailsRow.qmt_correct_answer.toUpperCase()}.
              {#if detailsRow.options}
                {#if detailsRow.options[detailsRow.qmt_correct_answer.charCodeAt(0) - 65] && detailsRow.options[detailsRow.qmt_correct_answer.charCodeAt(0) - 65].trim() !== ""}
                  {detailsRow.options[
                    detailsRow.qmt_correct_answer.charCodeAt(0) - 65
                  ]}
                {:else if detailsRow[`option${detailsRow.qmt_correct_answer.charCodeAt(0) - 64}_media`] && detailsRow[`option${detailsRow.qmt_correct_answer.charCodeAt(0) - 64}_media`].length}
                  <i>Image Option</i>
                {/if}
              {/if}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
