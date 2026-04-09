
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, UserCheck } from "lucide-react";

interface ProfileCompletionPromptProps {
  className?: string;
}

const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({ className }) => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const { completionPercentage, missingFields } = useProfileCompletion();
  
  if (completionPercentage === 100) {
    return null;
  }

  const handleCompleteProfile = () => {
    navigate(`/${userType}/settings`);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-amber-500 mt-0.5">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Complete your profile</h3>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1 text-sm">
              <span>Profile completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          {missingFields.length > 0 && (
            <div className="text-sm text-gray-600 mb-3">
              <p>Missing information:</p>
              <ul className="list-disc pl-5 mt-1">
                {missingFields.slice(0, 3).map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
                {missingFields.length > 3 && <li>...and {missingFields.length - 3} more</li>}
              </ul>
            </div>
          )}
          
          <Button 
            onClick={handleCompleteProfile} 
            size="sm" 
            className="flex items-center gap-1"
          >
            <UserCheck size={16} />
            <span>Complete Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPrompt;
