<script>
  import { BookOpen } from "@lucide/svelte/icons";
  
  export let classLevels = [];
</script>

<div class="bg-white rounded-lg shadow-sm text-dark-gray mt-0">
  <div class="p-6">
    <div class="flex items-center gap-2 mb-2">
      <BookOpen class="w-4 h-4 text-blue-600" />
      <h3 class="text-base font-medium text-dark-gray">Class Levels</h3>
    </div>
    {#if classLevels?.length}
      <div class="flex flex-wrap gap-2">
        {#each classLevels as level}
          <span class="px-3 py-1 bg-gray-50 rounded-full text-sm">
            Class {level}
          </span>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-gray-500">No class levels assigned</p>
    {/if}
  </div>
</div>
