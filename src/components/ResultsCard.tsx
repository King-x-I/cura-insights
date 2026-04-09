
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Difficulty } from "@/utils/mathOperations";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";

interface ResultsCardProps {
  correctAnswers: number;
  totalQuestions: number;
  difficulty: Difficulty;
  timeTaken: number;
  onRestart: () => void;
  onChangeDifficulty: () => void;
}

const ResultsCard = ({
  correctAnswers,
  totalQuestions,
  difficulty,
  timeTaken,
  onRestart,
  onChangeDifficulty,
}: ResultsCardProps) => {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const scoreColor = () => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getMessage = () => {
    if (percentage >= 80) return "Excellent job!";
    if (percentage >= 50) return "Good effort!";
    return "Keep practicing!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex flex-col items-center gap-3">
            <Trophy className="h-12 w-12 text-primary" />
            <span>Quiz Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor()}`}>{percentage}%</span>
              </div>
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                  className={scoreColor()}
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold">{getMessage()}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Correct Answers:</span>
              <span className="font-medium">{correctAnswers} / {totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Difficulty:</span>
              <span className="font-medium capitalize">{difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Taken:</span>
              <span className="font-medium">{Math.round(timeTaken)} seconds</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={onRestart} className="w-full">
            Play Again
          </Button>
          <Button onClick={onChangeDifficulty} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Difficulty
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ResultsCard;
