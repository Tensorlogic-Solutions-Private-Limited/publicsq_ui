<script>
  
    import { quizSessionStore, remarksHelpers } from "$lib/stores/quizStore.js";
  

  export let questionId ; // take the question id prop 
  export let remarkText = '' ; // pass the remarks 

  $: charCount = remarkText.length ; 
    $:  { 
        const savedRemark = $quizSessionStore.remarks[questionId] ; 
        if(savedRemark) { 
            remarkText = savedRemark.text ; 
        } else { 
            remarkText = '' ; 
        }
    }    
    function handleSave() { 
        remarksHelpers.saveRemark(questionId,remarkText) ; 
        alert('Remark saved') ; 
    }

</script>

<div class="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
  <div class="space-y-2">
    <label for= "remarks-{questionId}" class="block text-sm font-medium text-gray-700">
      Teacher Remarks
    </label>
    
    <textarea 
      id="remarks-{questionId}"
      rows="5"
      placeholder="Enter your remarks here..."
      class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      bind:value={remarkText}
      maxlength="500"
    ></textarea>
    
    <div class="flex justify-between items-center">
      <!-- Character Counter -->
      <p class="text-xs text-gray-500">
        {charCount} / 500 characters
      </p>

      <!-- Save Button (only shows when there's text) -->
      {#if charCount > 0}
        <button
          type="button"
          on:click={handleSave}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Remark
        </button>
      {/if}
    </div>
  </div>
</div>
