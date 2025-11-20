<script>
  import { FileText } from "@lucide/svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import { goto } from "$app/navigation";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher } from "svelte";

  export let quiz;
  export let examData = {};
  export let canDelete = false;

  const dispatch = createEventDispatcher();

  function handleStartQuiz() {
    goto(`/quiz/${examData.exam_code}/attempt`);
  }
  function triggerDeleteQuiz() {
    dispatch("deleteQuiz");
  }

  function handlePreviewQuiz() { 
    
    dispatch('previewQuiz') ; 
  }
</script>

<div class="bg-white rounded-lg shadow-sm text-dark-gray mb-6">
  <!-- Blue band header -->
  <div
    class="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg"
  >
    <div class="flex items-center gap-3">
      <div
        class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
      >
        <FileText class="text-accent" size={20} />
      </div>

      <h1 class="text-lg font-bold text-blue-900">Quiz Details</h1>

      <div class="flex gap-4">
        {#if examData.status === "draft" && canDelete}
          <Button
            title="Delete quiz"
            btnType="custom"
            on:click={triggerDeleteQuiz}
          >
            <Trash2 size={16} class="text-danger" />
          </Button>
        {/if}
      </div>
    </div>
    {#if examData.status === "draft"}
      <div class= "flex gap-4 justify-end">
      <Button type=""
       on:click={handlePreviewQuiz}
        class="px-6 py-2 sm:text-sm text-xs rounded-[4px] bg-gray-600 text-white font-medium  hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
       >Preview Quiz
      </Button>
      <Button on:click={handleStartQuiz}>Start quiz</Button>
      </div>
    {/if}
  </div>
  <!-- Quiz info card -->
  <div class="p-6">
    <div class="flex gap-4 items-center">
      <h2 class="text-xl font-bold mb-1">{quiz.exam_name}</h2>
      <span
        class={` ${examData.status === "closed" ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"} text-xs font-medium px-4 p-1  rounded-lg capitalize `}
        >{examData.status}</span
      >
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
      <div>
        <span>Class:</span>
        {examData.standard}
        {examData.division ? examData.division : ""}, <span>{examData.subject}</span> quiz,
        <span>{examData.medium}</span> medium
      </div>
    </div>
  </div>
</div>
