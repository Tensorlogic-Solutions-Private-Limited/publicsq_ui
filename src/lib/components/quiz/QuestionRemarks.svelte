<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  const dispatch = createEventDispatcher();

  export let questionId = "";
  export let remarks = "";
  export let placeholder = "Add remarks for this question...";
  export let readonly = false;
  export let maxLength = 500;

  let tempRemarks = remarks;
  let textareaElement;
  let hasUnsavedChanges = false;
  // Watch for external changes to remarks (only when not being edited)
  $: if (
    remarks !== tempRemarks &&
    document.activeElement !== textareaElement
  ) {
    tempRemarks = remarks;
  }

  function saveRemarks() {
    hasUnsavedChanges = false;
    dispatch("save", {
      questionId,
      remarks: tempRemarks.trim(),
    });
  }

  function handleKeydown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveRemarks();
    }
  }

  function autoResize(event) {
    const textarea = event.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function handleUserInteraction() {
    hasUnsavedChanges = true;
  }

  // Update tempRemarks only on component mount/initial load
  if (remarks && !tempRemarks) {
    tempRemarks = remarks;
  }

  $: charactersLeft = maxLength - (tempRemarks?.length || 0);
  $: hasRemarks = remarks && remarks.trim().length > 0;
</script>

<div
  class="p-4 bg-slate-50 border border-slate-200 rounded-xl h-full w-full max-w-lg flex flex-col "
>
  <div class="flex items-center gap-2 mb-3">
    <svg
      class="w-4 h-4 text-indigo-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
    <span class="text-sm font-semibold text-slate-700">Teacher Remarks</span>
   
  </div>

  {#if readonly}
    <!-- Read-only Display -->
    <div class="bg-white border border-slate-200 rounded-lg p-3">
      {#if hasRemarks}
        <div class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {remarks}
        </div>
      {:else}
        <div class="text-sm text-slate-400 italic">No remarks added</div>
      {/if}
    </div>
  {:else}
    <!-- Editable Mode -->
    <div class="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col">
      <textarea
        bind:this={textareaElement}
        bind:value={tempRemarks}
        on:keydown={handleKeydown}
        on:input={handleUserInteraction}
        {placeholder}
        maxlength={maxLength}
        class="w-full p-3 border-none outline-none resize-none font-sans text-sm leading-relaxed text-slate-700 min-h-[80px] flex-1 overflow-y-auto placeholder-slate-400"
        rows="3"
      ></textarea>

      <div
        class="flex justify-between items-center px-3 py-2 bg-slate-50 border-t border-slate-200"
      >
        <div
          class="text-xs text-slate-500 {charactersLeft < 50
            ? 'text-amber-600 font-medium'
            : ''}"
        >
          {charactersLeft} characters remaining
        </div>
        <Button
          on:click={saveRemarks}
          disabled={!hasUnsavedChanges || tempRemarks?.length > maxLength}
          class="px-4 py-1.5 text-xs rounded-[4px] font-medium bg-accent text-white disabled:bg-gray-30 disabled:cursor-not-allowed"
        >
          {hasUnsavedChanges ? "Save" : "Saved"}
        </Button>
      </div>

      <div class="px-3 py-2 bg-amber-50 border-t border-amber-200">
        <span class="text-xs text-amber-700">
          💡 Press <kbd
            class="text-xs bg-white border border-amber-300 rounded px-1 font-mono"
            >Ctrl+Enter</kbd
          > to save quickly
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  .remarks-container {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    border-left: 4px solid #6366f1;
  }

  .remarks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .remarks-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .remarks-icon {
    width: 1rem;
    height: 1rem;
    color: #6366f1;
  }

  .remarks-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #059669;
    background: #d1fae5;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 500;
  }

  /* Editor Mode */
  .remarks-editor {
    background: white;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    overflow: hidden;
  }

  .remarks-textarea {
    width: 100%;
    padding: 0.75rem;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    min-height: 80px;
    max-height: 200px;
    overflow-y: auto;
  }

  .remarks-textarea::placeholder {
    color: #9ca3af;
  }

  .editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .character-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .character-count.text-warning {
    color: #f59e0b;
    font-weight: 500;
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
  }

  .cancel-btn {
    background: white;
    border-color: #d1d5db;
    color: #6b7280;
  }

  .cancel-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .save-btn {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
  }

  .save-btn:hover {
    background: #4f46e5;
    border-color: #4f46e5;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-hint {
    padding: 0.5rem 0.75rem;
    background: #fef3c7;
    border-top: 1px solid #f59e0b;
  }

  .hint-text {
    font-size: 0.75rem;
    color: #92400e;
  }

  kbd {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
    font-family: monospace;
  }

  /* Display Mode */
  .remarks-display {
    min-height: 2rem;
  }

  .remarks-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .remarks-text {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    white-space: pre-wrap;
    background: white;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .edit-btn {
    flex-shrink: 0;
    padding: 0.5rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  .add-remarks-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: white;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .add-remarks-btn:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: #f8fafc;
  }

  .add-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .no-remarks {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .no-remarks-text {
    font-size: 0.875rem;
    color: #9ca3af;
    font-style: italic;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .remarks-container {
      padding: 0.75rem;
    }

    .editor-footer {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }

    .editor-actions {
      justify-content: flex-end;
    }

    .remarks-content {
      flex-direction: column;
      gap: 0.5rem;
    }

    .edit-btn {
      align-self: flex-end;
    }
  }
</style>
