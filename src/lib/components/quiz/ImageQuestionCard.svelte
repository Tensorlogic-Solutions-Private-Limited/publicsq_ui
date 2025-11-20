<script>
  import Button from "$lib/components/reusable/Button.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher } from "svelte";

  export let question;
  export let index = 0;
  export let revealAnswer = false;

  export let canDelete = false;

  const dispatch = createEventDispatcher();

  function handleDelete() {
    dispatch("deleteQuestion", question);
  }

  function toggleReveal() {
    revealAnswer = !revealAnswer;
  }

  // Helper to get media array for a given option index (1-based)
  function getOptionMedia(idx) {
    return question[`qmt_option${idx}_media`] || [];
  }
</script>

<div
  class="bg-white rounded-lg shadow p-4 border border-gray-200"
  id={question.id}
>
  <div class="flex items-start mb-2 w-full justify-between font-medium">
    <!-- Optional: Question number/title -->
    Q {index + 1}. &nbsp;{question.text}
    <div class="flex gap-3 shrink-0">
      <Button
        btnType="custom"
        class="underline text-accent text-sm cursor-pointer"
        on:click={toggleReveal}
      >
        {revealAnswer ? "Hide Answer" : "Reveal Answer"}
      </Button>
      {#if canDelete}
        <Button btnType="custom" on:click={handleDelete}>
          <Trash2 size={16} class="text-danger" />
        </Button>
      {/if}
    </div>
  </div>
  <div class="mb-4 text-base text-gray-900 flex w-full justify-between">
    <span>
      {#if question.qmt_question_text_media && question.qmt_question_text_media.length}
        <div class="flex flex-wrap gap-2 mt-2">
          {#each question.qmt_question_text_media as imgUrl}
            <img
              src={imgUrl}
              alt="Question Image"
              class="max-h-32 rounded border border-gray-200"
            />
          {/each}
        </div>
      {/if}
    </span>
  </div>
  <div class="space-y-2">
    {#each question.options as opt, oidx}
      <div
        class={`text-sm  rounded-lg px-4 py-2 pb-3 border transition-all
          ${revealAnswer && opt.is_correct ? "border-green-400 bg-green-50 border-2" : "border-gray-200 bg-white"}
        `}
      >
        <p class="mb-2">
          <span class="mr-1 font-semibold text-gray-700">
            {String.fromCharCode(65 + oidx)}.
          </span>
          <span class=" text-gray-800 gap-2">
            {opt.text}
          </span>
        </p>
        <div class="mb-2 flex gap-2">
          {#if getOptionMedia(oidx + 1).length}
            {#each getOptionMedia(oidx + 1) as optImgUrl}
              <img
                src={optImgUrl}
                alt=""
                class="max-h-16 rounded border border-gray-200 ml-2"
              />
            {/each}
          {/if}
        </div>
        {#if revealAnswer && opt.is_correct}
          <span
            class="ml-1 text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded"
            >Correct Answer</span
          >
        {/if}
      </div>
    {/each}
  </div>
</div>
