<script>
  import Button from "$lib/components/reusable/Button.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher, onMount } from "svelte";
  import { decodeHTMLEntities, cleanQuestionText } from "$lib/utils/textUtils.js";
  
  export let question;
  export let index = 0;
  export let revealAnswer = false;
  export let canDelete = false;
  
  let cleanedQuestion;
  const dispatch = createEventDispatcher();

  function handleDelete() {
    dispatch("deleteQuestion", question);
  }

  function toggleReveal() {
    revealAnswer = !revealAnswer;
  }

  onMount(() => {
    if (question) {
      // Clean both question text and options
      cleanedQuestion = {
        ...cleanQuestionText(question),
        options: question.options?.map(opt => ({
          ...opt,
          text: decodeHTMLEntities(opt.text)
        }))
      };
    }
  });
</script>

<div
  class="bg-white rounded-lg shadow p-4 border border-gray-200"
  id={question.id}
>
  <div class="flex items-start mb-2 w-full justify-between font-medium">
    Q {index + 1}. &nbsp;{cleanedQuestion?.text || question.text}
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
  <div class="space-y-2">
    {#each (cleanedQuestion?.options || question.options) as opt, oidx}
      <div
        class={`text-sm flex items-center rounded-lg px-4 py-2 border transition-all
          ${revealAnswer && opt.is_correct ? "border-green-400 bg-green-50 border-2" : "border-gray-200 bg-white"}
        `}
      >
        <span class="mr-3 font-semibold text-gray-700">
          {String.fromCharCode(65 + oidx)}.
        </span>
        <span class="flex-1 text-gray-800">{opt.text}</span>
        {#if revealAnswer && opt.is_correct}
          <span
            class="ml-4 text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded"
          >
            Correct Answer
          </span>
        {/if}
      </div>
    {/each}
  </div>
</div>