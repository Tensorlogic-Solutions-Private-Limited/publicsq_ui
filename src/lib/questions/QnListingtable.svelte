<script>
  import { onMount } from "svelte";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import { Pen, Trash } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import QuestionCell from "$lib/questions/QuestionCell.svelte";
  import ImageQuestionCell from "$lib/questions/ImageQuestionCell.svelte";

  export let questions = [];
  export let board;
  export let state;
  export let subject;
  export let showActions = true ; 

  const dispatch = createEventDispatcher();

  let actionConfigObject = [
      { actionName: "delete", icon: Trash },
  ];

  export let tableHeadersDisplay = [
    { key: "text", name: "Question", width: "50%" },
    { key: "grp_type_name", name: "Chapter", width: "30%" },
    { key: "difficulty_level", name: "Difficulty", width: "10%" },
  ];



  $: questionsWithMeta = questions.map(q => ({
    ...q,
    board,
    state,
    subject,
    question_type: q.type,
    format: q.format_code === "6000" ? "Image" : "Text"
  }));

  let customRenderers = {
    text: (row) => {
      if (row?.format_code === "6000" || row?.is_image) {
        return {
          component: ImageQuestionCell,
          props: { question: row }
        };
      }
      return {
        component: QuestionCell,
        props: { question: row }
      };
    },
  };

  function handleTableAction(event) {
    const actionName = event.detail.actionName;
  
    if (actionName === "delete") {
      dispatch("deleteQuestion", event);
    }
  }

</script>

<div>
   <DataTable
    tableData={questionsWithMeta}
    {tableHeadersDisplay}
    notFoundMessage="No questions found."
    {customRenderers}
    actionConfigObject={showActions ? actionConfigObject : undefined}
    on:tableActionClick={showActions ? handleTableAction : undefined}
  />

</div>
