<script>
  export let questions = [];
  
  function toggleBlacklist(questionId) {
    questions = questions.map(q => {
      if (q.id === questionId) {
        return { ...q, isBlacklisted: !q.isBlacklisted };
      }
      return q;
    });
  }
</script>

<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each questions as question}
        <tr class={question.isBlacklisted ? 'bg-red-50' : ''}>
          <td class="px-6 py-4 whitespace-nowrap">{question.text}</td>
          <td class="px-6 py-4 whitespace-nowrap">{question.type}</td>
          <td class="px-6 py-4 whitespace-nowrap">{question.marks}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
              ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}>
              {question.difficulty}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">{question.chapter}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button
              class={`px-3 py-1 rounded-md text-sm font-medium
                ${question.isBlacklisted ? 
                  'bg-gray-100 text-gray-800 hover:bg-gray-200' : 
                  'bg-red-100 text-red-800 hover:bg-red-200'}`}
              on:click={() => toggleBlacklist(question.id)}
            >
              {question.isBlacklisted ? 'Unblock' : 'Block'}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>