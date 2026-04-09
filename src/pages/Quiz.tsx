
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Difficulty, Question, generateQuestions } from "@/utils/mathOperations";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { PauseCircle, XCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Quiz = () => {
  const { difficulty = "easy" } = useParams<{ difficulty: Difficulty }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20); // seconds per question
  const [timeTaken, setTimeTaken] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  
  const TOTAL_QUESTIONS = 10;
  const TIME_PER_QUESTION = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 15 : 10;

  // Initialize questions
  useEffect(() => {
    const newQuestions = generateQuestions(TOTAL_QUESTIONS, difficulty as Difficulty);
    setQuestions(newQuestions);
    setTimeRemaining(TIME_PER_QUESTION);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (questions.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAnswer(false);
          return TIME_PER_QUESTION;
        }
        return prev - 0.1;
      });
      
      setTimeTaken((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [questions, currentQuestionIndex, isPaused]);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(TIME_PER_QUESTION);
    } else {
      // Quiz completed
      navigate(`/results`, { 
        state: { 
          score, 
          totalQuestions: TOTAL_QUESTIONS, 
          difficulty, 
          timeTaken 
        } 
      });
    }
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleQuit = () => {
    setIsQuitting(true);
  };

  const confirmQuit = () => {
    navigate("/");
  };

  const cancelQuit = () => {
    setIsQuitting(false);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={togglePause}>
            <PauseCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleQuit}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <p className="text-sm font-medium">
              Score: {score}
            </p>
          </div>

          {questions[currentQuestionIndex] && (
            <QuestionCard
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              timeRemaining={timeRemaining}
              totalTime={TIME_PER_QUESTION}
            />
          )}
        </div>
      </main>

      <AlertDialog open={isPaused}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quiz Paused</AlertDialogTitle>
            <AlertDialogDescription>
              Take a moment to breathe. Your time is paused.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={togglePause}>Resume Quiz</AlertDialogAction>
            <AlertDialogCancel onClick={handleQuit}>Quit Quiz</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isQuitting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to quit? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelQuit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuit}>Quit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Quiz;
