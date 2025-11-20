<script>
  import { createEventDispatcher } from "svelte";
  import ImageModal from "$lib/components/reusable/ImageModal.svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";

  export let question;

  let reveal = false;
  let showModal = false;
  const mediaFields = [
    "qmt_option1_media",
    "qmt_option2_media",
    "qmt_option3_media",
    "qmt_option4_media",
  ];
  const optionKeys = ["option1", "option2", "option3", "option4"];

  function getCorrectAnswerIdx(row) {
    if (
      typeof row.correct_answer !== "string" ||
      row.correct_answer.length !== 1
    )
      return -1;
    const code = row.correct_answer.toUpperCase().charCodeAt(0);
    return code >= 65 && code <= 68 ? code - 65 : -1; // A–D → 0–3
  }

  function getCorrectAnswerText(row) {
    const idx = getCorrectAnswerIdx(row);
    if (idx === -1) return "Invalid or missing answer";
    const label = String.fromCharCode(65 + idx);
    const optVal = row[optionKeys[idx]] || "";
    const mediaUrls = row[mediaFields[idx]] || [];
    const hasText = typeof optVal === "string" && optVal.trim() !== "";
    const hasImage = Array.isArray(mediaUrls) && mediaUrls.length > 0;
    if (hasText) {
      return `${label}) ${optVal}`;
    } else if (hasImage) {
      return `${label}. Image Option `;
    } else if (!hasText && !hasImage) {
      return `${label}. No text or image option available`;
    }
    return `${label})`;
  }

  $: detailsRow = {
    ...question,
    qmt_question_text: question.text ?? question.qmt_question_text ?? "",
    qmt_question_text_media: question.qmt_question_text_media ?? [],
    options: [
      question.option1 ?? "",
      question.option2 ?? "",
      question.option3 ?? "",
      question.option4 ?? "",
    ],
    option1_media: question.qmt_option1_media ?? [],
    option2_media: question.qmt_option2_media ?? [],
    option3_media: question.qmt_option3_media ?? [],
    option4_media: question.qmt_option4_media ?? [],
    qmt_correct_answer:
      question.correct_answer ?? question.qmt_correct_answer ?? "",
  };

</script>

<td>
  <div class="font-medium mb-2">
    {question.text ? question.text : "Image Question"}
  </div>

  <!-- Options -->
  <div class="mb-2 flex flex-col gap-1">
    {#each optionKeys as key, i}
      {#if question[key] && String(question[key]).trim() !== ""}
        <p>{String.fromCharCode(65 + i)}) {question[key]}</p>
      {:else if Array.isArray(question[mediaFields[i]]) && question[mediaFields[i]].length > 0}
        <p>{String.fromCharCode(65 + i)}) <span class="italic">Image Option</span></p>
      {:else}
        <p>{String.fromCharCode(65 + i)}) <span class="text-slate-400 italic">No text or image option available</span></p>
      {/if}
    {/each}
  </div>

  {#if reveal}
    ✅ <span>Correct Answer:</span>
    {getCorrectAnswerText(question)}

    <button
      on:click={() => (reveal = false)}
      class="underline text-blue-600 text-sm"
    >
      Hide
    </button>
  {:else}
    <button
      class="text-blue-600 underline text-sm"
      on:click={() => (reveal = true)}
    >
      Reveal answer
    </button>
  {/if}

  <div class="mt-1">
    <a
      href="#"
      class="text-blue-600 underline text-sm"
      style="display:inline-block"
      data-role="view-details"
      data-row={question.code || question.id || ""}
      on:click|preventDefault={() => (showModal = true)}>View details</a
    >
  </div>
  {#if showModal}
    <Portal>
      <ImageModal
        {detailsRow}
        on:close={() => (showModal = false)}
      />
    </Portal>
  {/if}
</td>
