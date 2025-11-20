<script>
  import { onMount } from "svelte";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import ImageModal from "$lib/components/reusable/ImageModal.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";

  export let questionList = [];

  let detailsModalOpen = false;
  let detailsModalRow = null;
  let container;
  let rowMap = new Map();

  const mediaFields = [
    "option1_media",
    "option2_media",
    "option3_media",
    "option4_media",
  ];
  const optionKeys = ["option1", "option2", "option3", "option4"];

  const tableHeadersDisplay = [
    { key: "qmt_question_text", name: "Question", width: "25%" },
    { key: "state", name: "State", width: "10%" },
    { key: "board", name: "Board", width: "10%" },
    { key: "question_type", name: "Type", width: "10%" },
    { key: "format", name: "Format", width: "10%" },
    { key: "subject", name: "Subject", width: "10%" },
  ];

  const customRenderers = {
    qmt_question_text: (row) => {
      const rowKey = String(
        row?.id ?? row?.qmt_question_code ?? cryptoRandomKey()
      );

      let questionTitle = renderQuestionTitle(row);
      let optionsHTML = renderOptions(row);
      let answerHTML = renderCorrectAnswer(row);

      let viewDetails = row?.is_image
        ? `<div class="mt-1"><a href="#" class="text-blue-600 underline text-xs" data-role="view-details" data-row="${rowKey}">View details</a></div>`
        : "";

      return `<div data-row-key="${rowKey}">
            ${questionTitle}
            ${optionsHTML}${answerHTML}
            ${viewDetails}
        </div>`;
    },
    subject: (row) => {
      if (row?.subject && typeof row.subject === "object") {
        return row.subject.smt_subject_name ?? "";
      }
      return row?.subject ?? "";
    },
  };

  $: {
    const m = new Map();
    if (Array.isArray(questionList)) {
      questionList.forEach((r) => {
        const key = String(r?.id ?? r?.qmt_question_code ?? cryptoRandomKey());
        m.set(key, r);
      });
    }
    rowMap = m;
  }

  // ------------- Table Related Functions --------------------------

  function handleDelegatedClick(e) {
    const el = e.target.closest('[data-role="view-details"]');
    if (!el) return;
    const rowKey = el.getAttribute("data-row");
    const row = rowMap.get(rowKey);
    if (row) openDetailsModal(row);
    e.preventDefault();
  }

  function renderQuestionTitle(row) {
    if (row?.qmt_question_text && String(row.qmt_question_text).trim() !== "") {
      return `<div class="font-medium mb-2">${escapeHtml(row.qmt_question_text)}</div>`;
    } else if (row?.is_image) {
      return `<div class="font-medium mb-2">Image Question</div>`;
    }
    return "";
  }

  function renderOptions(row) {
    return row?.options && Array.isArray(row.options)
      ? row.options
          .map((opt, idx) => {
            const label = String.fromCharCode(65 + idx);
            const mediaUrls = row?.[mediaFields[idx]] || [];
            const hasText = typeof opt === "string" && opt.trim() !== "";

            if (row?.is_image) {
              if (hasText) {
                return `<div class="mt-1">${label}. ${escapeHtml(opt)}</div>`;
              } else if (mediaUrls.length > 0) {
                return `<div class="mt-1">${label}. <i>Image Option</i></div>`;
              } else {
                return "";
              }
            }
            if (hasText) {
              return `<div class="mt-1">${label}. ${escapeHtml(opt)}</div>`;
            }
            return "";
          })
          .join("")
      : "";
  }

  function renderCorrectAnswer(row) {
    const answerKey = row?.qmt_correct_answer ?? row?.correct_answer;
    const idx = getCorrectAnswerIdx(answerKey);
    if (idx === -1) return "";

    const label = String.fromCharCode(65 + idx);
    let optText = "";
    if (row?.is_image) {
      const hasText =
        row?.options &&
        row.options[idx] &&
        String(row.options[idx]).trim() !== "";
      const hasImage =
        Array.isArray(row?.[mediaFields[idx]]) &&
        row[mediaFields[idx]].length > 0;
      if (hasText) {
        optText = ` ${escapeHtml(row.options[idx])}`;
      } else if (hasImage) {
        optText = " <i>Image Option</i>";
      }
    } else if (
      row?.options &&
      row.options[idx] &&
      String(row.options[idx]).trim() !== ""
    ) {
      optText = ` ${escapeHtml(row.options[idx])}`;
    }
    return `<div class="mt-2 mb-1 text-green-700 font-semibold">Correct Answer: ${label}.${optText}</div>`;
  }

  function getCorrectAnswerIdx(answerKey) {
    let idx = optionKeys.indexOf(answerKey);
    if (idx === -1 && typeof answerKey === "string" && answerKey.length === 1) {
      const code = answerKey.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 68) idx = code - 65;
    }
    return idx;
  }

  // ------------------------ Modal Related Functions ------------------------
  function openDetailsModal(row) {
    detailsModalRow = row;
    detailsModalOpen = true;
  }
  function closeDetailsModal() {
    detailsModalOpen = false;
    detailsModalRow = null;
  }

  // -------------------------- Lifecycle Functions --------------------------

  onMount(() => {
    container?.addEventListener("click", handleDelegatedClick);
    return () => container?.removeEventListener("click", handleDelegatedClick);
  });

  // ------------------------------General Functions ------------------------------

  function cryptoRandomKey() {
    return Math.random().toString(36).slice(2);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
</script>

{#if questionList && questionList.length > 0}
  <div
    class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm"
    bind:this={container}
  >
    <h3 class="text-sm sm:text-base font-semibold text-dark-gray mb-4">
      Questions Added in This Session
    </h3>
    <DataTable
      {tableHeadersDisplay}
      {customRenderers}
      tableData={questionList}
      notFoundMessage="No questions added yet."
    />
  </div>
{/if}

{#if detailsModalOpen && detailsModalRow}
  <Portal>
    <ImageModal
      detailsRow={detailsModalRow}
      on:close={closeDetailsModal}
      detailsMode={true}
    />
  </Portal>
{/if}
