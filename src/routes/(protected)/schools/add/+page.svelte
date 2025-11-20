<script>
  import SchoolFormPage from "$lib/components/schools/SchoolFormPage.svelte";
  export let data;

  let {states} = data
  $:states = states?.error ? [] : states
</script>

<SchoolFormPage
  mode="add"
  endpoint="/apis/schools"
  {states}
/>
