<script>
  export let question;
  let showAnswer = false;

  const optionMap = {
    a: "option1",
    b: "option2",
    c: "option3",
    d: "option4",
  };

  let correctAnswerText = "-";
  let correctAnswerLabel = "";
  if (question && question.correct_answer) {
    const key = optionMap[question.correct_answer?.toLowerCase()];
    if (key && question[key] !== undefined && question[key] !== null) {
      correctAnswerText = question[key];
      const idx = Object.keys(optionMap).indexOf(question.correct_answer?.toLowerCase());
      if (idx !== -1) {
        correctAnswerLabel = String.fromCharCode(65 + idx);
      }
    } else {
      correctAnswerText = "Invalid or missing answer";
      correctAnswerLabel = "";
    }
  } else {
    correctAnswerText = "No answer specified";
    correctAnswerLabel = "";
  }
</script>

<td>
  <div class="font-medium mb-2">{question.text}</div>
  <div class="mb-2 flex flex-col gap-1">
    <p> A) {question.option1} </p>
    <p> B) {question.option2} </p>
    <p> C) {question.option3} </p>
    <p> D) {question.option4} </p>
  </div>
  {#if showAnswer}
    ✅ <span>Correct Answer:</span> {correctAnswerLabel}. {correctAnswerText}
    <button on:click={() => (showAnswer = false)} class="underline text-blue-600">Hide</button>
  {:else}
    <button class="text-blue-600 underline text-sm" on:click={() => (showAnswer = true)}>
      Reveal answer
    </button>
  {/if}
</td>
