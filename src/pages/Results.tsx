
import { useLocation, useNavigate } from "react-router-dom";
import { Difficulty } from "@/utils/mathOperations";
import ResultsCard from "@/components/ResultsCard";
import { Logo } from "@/components/Logo";

interface ResultsState {
  score: number;
  totalQuestions: number;
  difficulty: Difficulty;
  timeTaken: number;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState;

  // If no state is present, redirect to home
  if (!state) {
    navigate("/");
    return null;
  }

  const { score, totalQuestions, difficulty, timeTaken } = state;

  const handleRestart = () => {
    navigate(`/quiz/${difficulty}`);
  };

  const handleChangeDifficulty = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="container mx-auto p-4">
        <Logo />
      </header>

      <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
        <ResultsCard
          correctAnswers={score}
          totalQuestions={totalQuestions}
          difficulty={difficulty}
          timeTaken={timeTaken}
          onRestart={handleRestart}
          onChangeDifficulty={handleChangeDifficulty}
        />
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>© 2025 MathWhiz - Improve your math skills every day</p>
      </footer>
    </div>
  );
};

export default Results;
