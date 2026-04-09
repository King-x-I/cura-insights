
import { useState } from "react";
import { Question } from "@/utils/mathOperations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  timeRemaining: number;
  totalTime: number;
}

const QuestionCard = ({ question, onAnswer, timeRemaining, totalTime }: QuestionCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswerClick = (answer: string, isCorrect: boolean) => {
    if (answered) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    
    // Short delay to show the selected answer before moving to next question
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedAnswer(null);
      setAnswered(false);
    }, 1000);
  };

  const getButtonClass = (answer: string, isCorrect: boolean) => {
    if (!selectedAnswer) return "";
    
    if (selectedAnswer === answer) {
      return isCorrect ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600";
    }
    
    return isCorrect ? "border-green-500 border-2" : "";
  };

  const progressPercentage = (timeRemaining / totalTime) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-2">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm font-medium text-muted-foreground">
              Difficulty: <span className="capitalize">{question.difficulty}</span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Time: {Math.ceil(timeRemaining)}s
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bold my-8">{question.question}</h2>
            <div className="grid grid-cols-2 gap-4 w-full">
              {question.answers.map((answer, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "text-lg py-6 h-auto transition-all duration-200 transform hover:scale-105",
                    getButtonClass(answer.text, answer.isCorrect)
                  )}
                  onClick={() => handleAnswerClick(answer.text, answer.isCorrect)}
                  disabled={answered}
                >
                  {answer.text}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuestionCard;
