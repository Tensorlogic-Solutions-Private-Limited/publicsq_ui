import { writable, derived } from 'svelte/store';

// Quiz configuration store
export const quizConfigStore = writable({
  standard: '',
  subject_code: '',
  medium_code: '',
  chapter_topic_type: 'chapter',
  selected_codes: [],
  exam_name: '',
  total_time: 15,
  total_questions: 5,
  no_of_sets: 1,
  no_of_versions: 1
});

// Current quiz data store
export const currentQuizStore = writable(null);

// Quiz session store (for tracking progress during quiz)
export const quizSessionStore = writable({
  startTime: null,
  currentQuestionIndex: 0,
  answers: {},
  remarks: {}, // Add remarks tracking
  timeRemaining: 900, // 15 minutes in seconds
  isCompleted: false,
  isPaused: false
});

// Quiz results store
export const quizResultsStore = writable(null);

// Add remarks store
export const quizRemarksStore = writable({});

// Helper functions
export const quizStore = {
  // Reset all stores
  reset: () => {
    quizConfigStore.set({
      standard: '',
      subject_code: '',
      medium_code: '',
      chapter_topic_type: 'chapter',
      selected_codes: [],
      exam_name: '',
      total_time: 15,
      total_questions: 5,
      no_of_sets: 1,
      no_of_versions: 1
    });
    currentQuizStore.set(null);
    quizSessionStore.set({
      startTime: null,
      currentQuestionIndex: 0,
      answers: {},
      remarks: {},
      timeRemaining: 900,
      isCompleted: false,
      isPaused: false
    });
    quizResultsStore.set(null);
  },

  // Start quiz session
  startSession: (totalTimeInMinutes = 15) => {
    quizSessionStore.update(session => ({
      ...session,
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: {},
      remarks: {},
      timeRemaining: totalTimeInMinutes * 60,
      isCompleted: false,
      isPaused: false
    }));
  },

  // Update answer for a question
  updateAnswer: (questionId, answer) => {
    quizSessionStore.update(session => ({
      ...session,
      answers: {
        ...session.answers,
        [questionId]: answer
      }
    }));
  },

  // Move to next question
  nextQuestion: () => {
    quizSessionStore.update(session => ({
      ...session,
      currentQuestionIndex: session.currentQuestionIndex + 1
    }));
  },

  // Move to previous question
  previousQuestion: () => {
    quizSessionStore.update(session => ({
      ...session,
      currentQuestionIndex: Math.max(0, session.currentQuestionIndex - 1)
    }));
  },

  // Complete quiz
  completeQuiz: () => {
    quizSessionStore.update(session => ({
      ...session,
      isCompleted: true
    }));
  },

  // Calculate results - FIXED VERSION
  calculateResults: (quiz, session) => {
    const { answers } = session;
    const questions = quiz?.questions || [];
    
    console.log('Calculating results with:', { answers, questionsCount: questions.length });
    
    let correct = 0;
    let attempted = 0;
    const questionResults = [];

    questions.forEach((question, index) => {
      // Use question.id to match with answers (not index)
      const userAnswer = answers[question.id];
      const isAttempted = userAnswer !== undefined && userAnswer !== null;
      
      console.log(`Question ${index + 1}:`, {
        questionId: question.id,
        userAnswer,
        isAttempted,
        correctAnswer: question.correct_answer
      });
      
      if (isAttempted) {
        attempted++;
      }

      // Check if the user's answer matches the correct answer
      // Use question.correct_answer which should contain the correct option ID
      const isCorrect = isAttempted && userAnswer === question.correct_answer;
      
      // Alternative: Find correct option and compare IDs
      if (!question.correct_answer) {
        const correctOption = question.options?.find(option => option.is_correct);
        const isCorrectAlt = isAttempted && userAnswer === correctOption?.id;
        console.log(`Alternative check for question ${question.id}:`, {
          correctOptionId: correctOption?.id,
          isCorrectAlt
        });
        
        if (isCorrectAlt) {
          correct++;
        }
      } else if (isCorrect) {
        correct++;
      }

      questionResults.push({
        questionIndex: index,
        questionId: question.id,
        question: question,
        userAnswer: userAnswer,
        correctAnswer: question.correct_answer || question.options?.find(opt => opt.is_correct)?.id,
        isCorrect: isCorrect || (isAttempted && userAnswer === question.options?.find(opt => opt.is_correct)?.id),
        isAttempted: isAttempted
      });
    });

    const percentage = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    
    const results = {
      totalQuestions: questions.length,
      attempted: attempted,
      correct: correct,
      incorrect: attempted - correct,
      unanswered: questions.length - attempted,
      percentage: Math.round(percentage * 100) / 100,
      passed: percentage >= 60, // 60% passing criteria
      timeTaken: session.startTime ? new Date() - session.startTime : 0,
      questionResults: questionResults,
      completedAt: new Date()
    };

    console.log('Final results:', results);

    quizResultsStore.set(results);
    return results;
  }
};

// Add helper functions for remarks
export const remarksHelpers = {
  saveRemark: (questionId, remarkText) => {
    quizRemarksStore.update(remarks => ({
      ...remarks,
      [questionId]: {
        text: remarkText,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }));
    
    // Also update session store
    quizSessionStore.update(session => ({
      ...session,
      remarks: {
        ...session.remarks,
        [questionId]: {
          text: remarkText,
          timestamp: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }
    }));
  },
  
  getRemark: (questionId) => {
    // This will be used reactively
  },
  
  clearRemarks: () => {
    quizRemarksStore.set({});
    quizSessionStore.update(session => ({
      ...session,
      remarks: {}
    }));
  },
  
  exportRemarks: () => {
    // Return current remarks for export/download
  }
};