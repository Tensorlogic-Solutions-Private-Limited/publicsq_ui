<script>
  import { createEventDispatcher } from 'svelte';
  import Card from './Cards/Card.svelte';
  const dispatch = createEventDispatcher();

  // Props declaration (moved to top)
  export let groups = [];
  export let questions = [];


  

  // let activeView = 'groups';

  // Updated mock questions data to include all types
  const mockQuestions = {
    'Chapter': {
      'Algebra': [
        { id: 'c1', text: 'Basic algebraic equation', type: 'MCQ', marks: 2, difficulty: 'Easy' },
        { id: 'c2', text: 'Complex algebraic problem', type: 'MCQ', marks: 2, difficulty: 'Hard' }
      ]
    },
    'Topic': {
      'Linear Equations': [
        { id: 't1', text: 'Linear equation basics', type: 'MCQ', marks: 2, difficulty: 'Easy' },
        { id: 't2', text: 'Advanced linear equations', type: 'MCQ', marks: 2, difficulty: 'Medium' }
      ]
    },
    'Subtopic': {
      'Solving Linear Equations': [
        { id: 'q1', text: 'Solve the equation 2x + 3 = 7', type: 'MCQ', marks: 2, difficulty: 'Easy' },
        { id: 'q2', text: 'Find x in 3x - 4 = 8', type: 'MCQ', marks: 2, difficulty: 'Medium' }
      ],
      'Word Problems': [
        { id: 'q3', text: 'A train travels at speed x...', type: 'MCQ', marks: 2, difficulty: 'Hard' },
        { id: 'q4', text: 'John has twice as many marbles...', type: 'MCQ', marks: 2, difficulty: 'Medium' }
      ]
    }
  };

  function generateQuestionsForGroup(group) {
    console.log('Generating questions for group:', group); // Debug log
    const questions = [];
    group.items.forEach(item => {
      console.log('Processing item:', item); // Debug log
      const mockQuestionsForType = mockQuestions[item.type]?.[item.name] || [];
      console.log('Found mock questions:', mockQuestionsForType); // Debug log
      questions.push(...mockQuestionsForType.map(q => ({
        ...q,
        groupId: group.id,
        chapter: item.parentChapter || (item.type === 'Chapter' ? item.name : null),
        topic: item.parentTopic || (item.type === 'Topic' ? item.name : null),
        subtopic: item.type === 'Subtopic' ? item.name : null
      })));
    });
    return questions;
  }

  $: {
    if (groups.length > 0) {
      console.log('Groups changed:', groups); // Debug log
      questions = groups.flatMap(group => generateQuestionsForGroup(group));
      console.log('Generated questions:', questions); // Debug log
    }
  }

  function handleUpdateGroup(index, field, value) {
    const updatedGroups = [...groups];
    updatedGroups[index][field] = value;
    dispatch('updateGroups', updatedGroups);
  }

  function removeGroup(groupId) {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    const updatedQuestions = questions.filter(q => q.groupId !== groupId);
    
    dispatch('updateGroups', updatedGroups);
    dispatch('updateQuestions', updatedQuestions);
  }

  function updateGroupQuestions(group, value) {
    const updatedGroups = groups.map(g => {
      if (g.id === group.id) {
        return { ...g, questionsToInsert: parseInt(value) };
      }
      return g;
    });
    
    dispatch('updateGroups', updatedGroups);
  }

  let activeView = 'groups';

  // Debug logging for props
  $: {
    console.log('=== QuestionsList Component Debug ===');
    console.log('Groups prop received:', groups);
    console.log('Questions prop received:', questions);
  }

  
  
  function handleRemove(questionId) {
    const event = new CustomEvent('removeQuestion', {
      detail: questionId
    });
    dispatch('removeQuestion', questionId);
  }
  
</script>

<div class="space-y-4">
  {#if groups.length > 0}
    {#each groups as group (group.id)}
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">
            {group.description}
          </h3>
          <span class="text-sm text-gray-500">
            {group.questionsToInsert} / {group.availableQuestions} questions
          </span>
        </div>

        <!-- Selected Items -->
        <div class="space-y-2 mb-4">
          <div class="text-sm text-gray-600">Selected items:</div>
          <ul class="list-disc pl-5">
            {#each group.items as item}
              <li class="text-sm">
                {item.name} 
                {#if item.parentChapter}(from {item.parentChapter}){/if}
                {#if item.parentTopic}(in {item.parentTopic}){/if}
              </li>
            {/each}
          </ul>
        </div>

        <!-- Questions Table -->
        {#if questions.filter(q => q.groupId === group.id).length > 0}
          <table class="min-w-full mt-4">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Question</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Difficulty</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Marks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each questions.filter(q => q.groupId === group.id) as question}
                <tr>
                  <td class="px-4 py-2 text-sm">{question.text}</td>
                  <td class="px-4 py-2 text-sm">{question.type}</td>
                  <td class="px-4 py-2 text-sm">{question.difficulty}</td>
                  <td class="px-4 py-2 text-sm">{question.marks}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="text-center py-8 text-gray-500">
      No groups created yet. Select items and create a group to get started.
    </div>
  {/if}
</div>





<div class="w-full">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each questions as question (question.id)}
        <tr class:opacity-50={question.isRemoved}>
          <td class="px-6 py-4 text-sm text-gray-900">{question.text}</td>
          <td class="px-6 py-4 text-sm text-gray-500">{question.type}</td>
          <td class="px-6 py-4 text-sm text-gray-500">{question.marks}</td>
          <td class="px-6 py-4 text-sm text-gray-500">{question.difficulty}</td>
          <td class="px-6 py-4 text-sm text-gray-500">
            {#if question.parent}
              {question.parent.name} ({question.parent.type})
            {:else}
              -
            {/if}
          </td>
          <td class="px-6 py-4 text-sm text-gray-500">
            <button
              class="text-red-600 hover:text-red-900"
              on:click={() => handleRemove(question.id)}
            >
              {question.isRemoved ? 'Restore' : 'Remove'}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

