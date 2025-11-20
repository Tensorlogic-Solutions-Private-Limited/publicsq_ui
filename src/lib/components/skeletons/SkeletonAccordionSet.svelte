<script>
  import SkeletonSingleAccordion from "./SkeletonSingleAccordion.svelte";

  // Skeleton loader for multiple Accordion components
  export let count = 1; // Number of accordion skeletons to show
  export let isExpanded = true; // Whether to show expanded content
</script>

<div class="space-y-2">
  {#each Array(count) as _, index}
    <SkeletonSingleAccordion {isExpanded} />
  {/each}
</div>
