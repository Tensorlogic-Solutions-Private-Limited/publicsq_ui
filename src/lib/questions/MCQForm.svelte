<script>
  import InputField from "$lib/components/reusable/InputField.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import { onMount } from "svelte";
  export let formData = {};
  export let optionLabels = {
    option1: "A",
    option2: "B",
    option3: "C",
    option4: "D",
  };
  export let availableCorrectAnswers = [];
  export let validationErrors = {};
  export let handleInputData = () => {};
  export let handleDropdownSelect = () => () => {};
  export let handleDropdownCancel = () => () => {};

  // Optionally allow customizing required prop (default true)

  onMount(()=>{
    validationErrors={}
  })
</script>

<div class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm">
  <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
    Question Content
  </h3>
  <InputField
    label="Question Text"
    name="question_text"
    type="text"
    placeholder="Enter your question here."
    value={formData.question_text}
    required
    on:handleInputData={handleInputData}
    validationErrors={validationErrors.question_text}
  />
  <div class="space-y-3">
    <h4 class="text-sm font-medium">Answer Options</h4>
    <div class="space-y-3">
      {#each ["option1", "option2", "option3", "option4"] as optionKey, index}
        <div class="flex items-center gap-3">
          <span
            class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-sm font-medium text-accent"
          >
            {optionLabels[optionKey]}
          </span>
          <div class="w-full">
            <InputField
              name={optionKey}
              type="text"
              placeholder={`Enter Option ${optionLabels[optionKey]}`}
              value={formData[optionKey] || ""}
              on:handleInputData={handleInputData}
              validationErrors={validationErrors[optionKey]}
              required
            />
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4">
    <DropDown
      title="Correct Answer"
      placeholder="Select correct answer"
      options={availableCorrectAnswers}
      selectedItemName={formData.correct_answer
        ? availableCorrectAnswers.find((a) => a.id === formData.correct_answer)
            ?.name || ""
        : ""}
      selectedItemUuid={formData.correct_answer || ""}
      validationErrors={validationErrors.correct_answer}
      required
      on:handleDispatchFilterData={handleDropdownSelect("correct_answer")}
      on:handleCancelSelection={handleDropdownCancel("correct_answer")}
    />
  </div>
</div>
