
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Google OAuth is not available without Supabase
    toast.error("Google Sign-In is not available. Please use email/password login.");
    navigate("/consumer/login", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">Google Sign-In is not available. Redirecting to login.</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
