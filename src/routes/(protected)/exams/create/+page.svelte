<script>
  import { goto } from "$app/navigation";
  import ExamMetadataForm from "$lib/components/new-quiz/ExamMetadataForm.svelte";

  async function handleFormSuccess(event) {
    const { data } = event.detail;
    const examCode = data.exam_code;
    await goto(`/exams/${examCode}/details`, { 
      state: { 
        notification: { 
          message: `Successfully created exam ${data?.exam_name}.`, 
          type: "success" 
        } 
      } 
    });
  }

  function handleFormCancel() {
    goto("/exams");
  }
</script>

<div class="bg-white max-w-6xl mx-auto">
  <ExamMetadataForm
    mode="add"
    on:success={handleFormSuccess}
    on:cancel={handleFormCancel}
  />
</div>
