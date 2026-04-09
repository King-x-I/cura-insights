
import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";

const ConsumerLogin = () => {
  return (
    <AuthCard
      title="Log in to Cura"
      description="Enter your email to login to your consumer account"
      footer={
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Link to="/consumer/signup" className="text-cura-primary font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      }
    >
      <LoginForm userType="consumer" />
    </AuthCard>
  );
};

export default ConsumerLogin;
