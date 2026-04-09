
import { Button } from "@/components/ui/button";
import { Difficulty } from "@/utils/mathOperations";
import { motion } from "framer-motion";

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

const DifficultySelector = ({ onSelectDifficulty }: DifficultySelectorProps) => {
  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: "easy", label: "Easy", color: "bg-green-100 text-green-700 hover:bg-green-200" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
    { value: "hard", label: "Hard", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="flex flex-col gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <h2 className="text-xl font-semibold text-center mb-2">Select Difficulty</h2>
      <div className="flex flex-col space-y-3">
        {difficulties.map((difficulty) => (
          <motion.div key={difficulty.value} variants={item}>
            <Button
              variant="outline"
              className={`w-full text-lg py-6 font-medium ${difficulty.color}`}
              onClick={() => onSelectDifficulty(difficulty.value)}
            >
              {difficulty.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DifficultySelector;
