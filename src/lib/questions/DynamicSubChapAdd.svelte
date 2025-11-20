<script>
  import { createEventDispatcher } from "svelte";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { validateTaxonomyCreation } from "$lib/questions/form-helper.js";
import {mapApiError} from "$lib/utils/helper.js"
  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let type = ""; //  "chapter", "topic", "subtopic"
  export let formData = {};
  export let states = [];
  export let boards = [];
  export let mediums = [];
  export let subjects = [];
  export let chapters = [];
  export let topics = [];

  export let newItemData = {
    chapter_name: "", // For entering new chapter name
    topic_name: "", // For entering new topic name
    subtopic_name: "", // For entering new subtopic name
  };

  let validationErrors = {};
  let isLoading = false;

  
  let title = "Add Chapter / Topic / Subtopic";
 
  $: if (isOpen && type) {
    initializeNewItemData();
  }

  function initializeNewItemData() {
    validationErrors = {};
  }

  function handleInputData(event) {
    const { name, value } = event.detail;
    newItemData[name] = value;
    newItemData = { ...newItemData };

    // Clear validation error for this field
    if (validationErrors[name]) {
      validationErrors[name] = "";
      validationErrors = { ...validationErrors };
    }
  }

  function validateForm() {
    validationErrors = {};

    // Use helper function to validate basic required fields
    const basicValidation = validateTaxonomyCreation(formData, newItemData);
    if (!basicValidation.isValid) {
      validationErrors.general = basicValidation.error;
      return false;
    }

    // At least one field must be provided (chapter, topic, or subtopic)
    const hasChapter = newItemData.chapter_name.trim() || formData.chapter_code;
    const hasTopic = newItemData.topic_name.trim() || formData.topic_code;
    const hasSubtopic = newItemData.subtopic_name.trim();

    if (!hasChapter && !hasTopic && !hasSubtopic) {
      validationErrors.general = "At least one hierarchy item (chapter, topic, or subtopic) must be provided.";
      return false;
    }

    // If creating subtopic without chapter context, require either new/existing chapter
    if (hasSubtopic && !hasChapter && !hasTopic) {
      validationErrors.general = "Cannot create subtopic without chapter and topic context.";
      return false;
    }

    // If creating subtopic, ensure we have topic context (either new or existing)
    if (hasSubtopic && hasChapter && !hasTopic) {
      validationErrors.topic_name = "Topic is required when creating subtopics.";
      return false;
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      validationErrors = { ...validationErrors };
      return;
    }

    isLoading = true;

    try {
      
      const apiPayload = {
        state_id: formData.state_id,
        board_id: formData.board_id,
        medium_code: formData.medium_code,
        standard: formData.standard,
        subject_code: formData.subject_code,
      };

      // Determine payload based strictly on what user is creating
      // Rule: Only include what the user explicitly entered OR what exists and user didn't override
      
      // Chapter handling
      if (newItemData.chapter_name.trim()) {
        // User is creating a new chapter
        apiPayload.chapter_name = newItemData.chapter_name.trim();
      } else if (formData.chapter_code) {
        // User is not creating new chapter, use existing one
        apiPayload.chapter_code = formData.chapter_code;
      }

      // Topic handling - only include topic if user is creating one OR using existing without new chapter
      if (newItemData.topic_name.trim()) {
        // User is creating a new topic
        apiPayload.topic_name = newItemData.topic_name.trim();
      } else if (!newItemData.chapter_name.trim() && formData.topic_code) {
        // User is NOT creating new chapter AND has existing topic selected
        // This handles the case where user is adding subtopic to existing chapter/topic
        apiPayload.topic_code = formData.topic_code;
      }
      // Note: If user creates new chapter but leaves topic empty, no topic data is included

      // Subtopic handling - only if user entered subtopic name
      if (newItemData.subtopic_name.trim()) {
        apiPayload.subtopic_name = newItemData.subtopic_name.trim();
      }


      const response = await fetch("/apis/questions/taxonomy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(mapApiError(response.status,'chapter-topic-subtopic combination'));
      }

      const responseData = await response.json();
     
      dispatch("submit", {
        type: "hierarchy",
        data: responseData,
      });
    } catch (error) {
      console.error("Error in creating taxonomy:", error);

      validationErrors.general = error.message || "Failed to create the chapter-topic-subtopic combination. Please try again.";
      validationErrors = { ...validationErrors };
    } finally {
      isLoading = false;
    }
  }

  function handleCancel() {
    dispatch("cancel");
  }

  // Helper functions to get display names
  function getStateName(stateId) {
    return states.find((s) => s.id == stateId)?.name || "";
  }

  function getBoardName(boardId) {
    return boards.find((b) => b.id == boardId)?.name || "";
  }

  function getMediumName(mediumCode) {
    return mediums.find((m) => m.id == mediumCode)?.name || "";
  }

  function getSubjectName(subjectCode) {
    return (
      subjects.find((s) => s.subject_code === subjectCode)?.name || ""
    );
  }

  function getChapterName(chapterCode) {
    return chapters.find((c) => c.id === chapterCode)?.name || "";
  }

  function getTopicName(topicCode) {
    return topics.find((t) => t.id === topicCode)?.name || "";
  }
</script>

{#if isOpen}
  <Portal>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          on:click={handleCancel}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- State Field - Always show as read-only from formData -->
         <div class="grid grid-cols-2 md:grid-cols-3 gap-2 border-b border-b-gray-200 pb-4">

           <div class="flex items-center">
             <span class="text-sm text-gray-500 font-medium">State: </span>
             <span class="text-sm ml-2">{getStateName(formData.state_id)}</span>
           </div>
   
           <!-- Board Field - Always show as read-only from formData -->
           <div class="flex items-center">
             <span class="text-sm text-gray-500 font-medium">Board: </span>
             <span class="text-sm ml-2">{getBoardName(formData.board_id)}</span>
           </div>
   
           <!-- Medium Field - Always show as read-only from formData -->
           <div class="flex items-center">
             <span class="text-sm text-gray-500 font-medium">Medium: </span>
             <span class="text-sm ml-2">{getMediumName(formData.medium_code)}</span
             >
           </div>
   
           <!-- Standard Field - Always show as read-only from formData -->
           <div class="flex items-center">
             <span class="text-sm text-gray-500 font-medium">Standard: </span>
             <span class="text-sm ml-2">{formData.standard}</span>
           </div>
   
           <!-- Subject Field - Always show as read-only from formData (when available) -->
           {#if formData.subject_code}
             <div class="flex items-center">
               <span class="text-sm text-gray-500 font-medium">Subject: </span>
               <span class="text-sm ml-2"
                 >{getSubjectName(formData.subject_code)}</span
               >
             </div>
           {/if}
         </div>

        <!-- New Hierarchy Items - Show all fields from current level onwards -->
        <div class="space-y-3">
          <div class="grid grid-cols-1 gap-3">
            <!-- Chapter field - show if popup opened from chapter dropdown or higher -->
            {#if type=== "chapter" }
              <InputField
                label="Chapter Name"
                name="chapter_name"
                placeholder="Enter new chapter name"
                bind:value={newItemData.chapter_name}
                validationErrors={validationErrors.chapter_name}
                required={false}
                on:handleInputData={handleInputData}
              />
            {:else}
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium">Chapter: </span>
                <span class="text-sm ml-2"
                  >{newItemData.chapter_name || getChapterName(formData.chapter_code)}</span
                >
              </div>
            {/if}

            <!-- Topic field - show if popup opened from chapter or topic dropdown -->
            {#if type==="chapter" || type === "topic"}
              <InputField
                label="Topic Name"
                name="topic_name"
                placeholder="Enter topic name"
                bind:value={newItemData.topic_name}
                validationErrors={validationErrors.topic_name}
                required={false}
                on:handleInputData={handleInputData}
              />
            {:else}
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium">Topic: </span>
                <span class="text-sm ml-2"
                  >{newItemData.topic_name ||getTopicName(formData.topic_code)}</span
                >
              </div>
            {/if}

            <!-- Subtopic field - show for all types (chapter, topic, subtopic) -->
            {#if !formData.subtopic_name}
              <InputField
                label="Subtopic Name"
                name="subtopic_name"
                placeholder="Enter subtopic name"
                bind:value={newItemData.subtopic_name}
                validationErrors={validationErrors.subtopic_name}
                required={false}
                on:handleInputData={handleInputData}
              />
            {:else}
              <div class="flex items-center">
                <span class="text-sm text-gray-500 font-medium"
                  >Sub-topic:
                </span>
                <span class="text-sm ml-2">{newItemData.topic_name || formData.subtopic_code}</span>
              </div>
            {/if}
          </div>

          {#if validationErrors.general}
            <p class="text-xs text-red-500">{validationErrors.general}</p>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4">
          <Button
            btnType="secondary"
            on:click={handleCancel}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} btnType="primary">
            {#if isLoading}
              <LoadingSpinner size="small" color="white" />
            {/if}
            <span>Submit</span>
          </Button>
        </div>
      </form>
    </div>
  </Portal>
{/if}
