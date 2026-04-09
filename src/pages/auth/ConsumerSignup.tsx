
import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { Link } from "react-router-dom";

const ConsumerSignup = () => {
  return (
    <AuthCard
      title="Create an Account"
      description="Sign up as a consumer to book services"
      footer={
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/consumer/login" className="text-cura-primary font-semibold hover:underline">
            Log in
          </Link>
        </div>
      }
    >
      <SignupForm userType="consumer" />
    </AuthCard>
  );
};

export default ConsumerSignup;
