
import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const ProviderLogin = () => {
  return (
    <AuthCard
      title="Log in to Cura"
      description="Enter your email to login to your service provider account"
      footer={
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Link to="/provider/signup" className="text-cura-primary font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      }
    >
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          Note: Provider accounts require admin approval before accessing full features. After signing up, you can still log in to check your approval status.
        </AlertDescription>
      </Alert>
      
      <LoginForm userType="provider" />
    </AuthCard>
  );
};

export default ProviderLogin;
