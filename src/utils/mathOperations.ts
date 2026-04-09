
// Math question generator with different difficulty levels

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Answer = {
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  question: string;
  answers: Answer[];
  difficulty: Difficulty;
  operation: Operation;
};

// Generate a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random math question based on difficulty and operation
export const generateQuestion = (difficulty: Difficulty, operation: Operation): Question => {
  let num1: number, num2: number, answer: number, question: string;
  const id = Math.random().toString(36).substring(2, 9);
  
  // Set number ranges based on difficulty
  switch (difficulty) {
    case 'easy':
      num1 = getRandomInt(1, 10);
      num2 = getRandomInt(1, 10);
      break;
    case 'medium':
      num1 = getRandomInt(10, 50);
      num2 = getRandomInt(1, 20);
      break;
    case 'hard':
      num1 = getRandomInt(20, 100);
      num2 = getRandomInt(5, 50);
      break;
    default:
      num1 = getRandomInt(1, 10);
      num2 = getRandomInt(1, 10);
  }
  
  // Generate the question and answer based on operation
  switch (operation) {
    case 'addition':
      question = `${num1} + ${num2} = ?`;
      answer = num1 + num2;
      break;
    case 'subtraction':
      // Ensure num1 > num2 to avoid negative answers for simplicity
      if (num1 < num2) [num1, num2] = [num2, num1];
      question = `${num1} - ${num2} = ?`;
      answer = num1 - num2;
      break;
    case 'multiplication':
      question = `${num1} × ${num2} = ?`;
      answer = num1 * num2;
      break;
    case 'division':
      // Ensure division results in an integer
      num2 = getRandomInt(1, 10);
      answer = num2; // This will be the answer
      num1 = num2 * getRandomInt(1, 10); // Ensuring division results in integer
      question = `${num1} ÷ ${num2} = ?`;
      break;
    default:
      question = `${num1} + ${num2} = ?`;
      answer = num1 + num2;
  }

  // Generate incorrect answers (close to the correct answer)
  const offset1 = getRandomInt(1, 5);
  const offset2 = getRandomInt(6, 10);
  const offset3 = getRandomInt(1, 5);
  
  // Randomly position the correct answer
  const incorrectAnswers = [
    answer + offset1,
    answer - offset2,
    answer + (answer > offset3 ? -offset3 : offset3)
  ];
  
  // Shuffle answers
  const allAnswers = [
    { text: answer.toString(), isCorrect: true },
    { text: incorrectAnswers[0].toString(), isCorrect: false },
    { text: incorrectAnswers[1].toString(), isCorrect: false },
    { text: incorrectAnswers[2].toString(), isCorrect: false },
  ];
  
  const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
  
  return {
    id,
    question,
    answers: shuffledAnswers,
    difficulty,
    operation,
  };
};

// Generate multiple questions
export const generateQuestions = (
  count: number,
  difficulty: Difficulty,
  operations: Operation[] = ['addition', 'subtraction', 'multiplication', 'division']
): Question[] => {
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    questions.push(generateQuestion(difficulty, operation));
  }
  
  return questions;
};
