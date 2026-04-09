
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";

const LoginWithGoogle = () => {
  const { signInWithGoogle } = useAuth();
  
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={signInWithGoogle}
        >
          <FcGoogle size={20} />
          <span>Sign in with Google</span>
        </Button>
      </div>
    </div>
  );
};

export default LoginWithGoogle;
