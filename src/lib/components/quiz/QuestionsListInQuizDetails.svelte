<script>
  import TextQuestionCard from "$lib/components/quiz/TextQuestionCard.svelte";
  import ImageQuestionCard from "$lib/components/quiz/ImageQuestionCard.svelte";
  import { createEventDispatcher } from "svelte";

  export let questions = [];
  export let revealAnswer = false;
  export let status = 'draft';

  const dispatch = createEventDispatcher();

  function deleteQuestion(qnData) {
    dispatch("delete", qnData);
  }
</script>

<div class="space-y-4">
  {#each questions as q, idx}
    {#if q.qmt_question_text_media || q.qmt_option1_media || q.qmt_option2_media || q.qmt_option3_media || q.qmt_option4_media}
      <ImageQuestionCard
        question={q}
        index={idx}
        revealAnswer={revealAnswer}
        canDelete={questions?.length > 1 && status === 'draft'}
        on:deleteQuestion={() => deleteQuestion(q)}
      />
    {:else}
      <TextQuestionCard
        question={q}
        index={idx}
        revealAnswer={revealAnswer}
        canDelete={questions?.length > 1 && status === 'draft'}
        on:deleteQuestion={() => deleteQuestion(q)}
      />
    {/if}
  {/each}
</div>
