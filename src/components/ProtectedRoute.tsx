import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  requiredUserType: "consumer" | "provider" | "admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredUserType
}) => {
  const { user, userType, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || userType !== requiredUserType) {
    // Redirect to appropriate login page
    const loginPath = requiredUserType === "consumer"
      ? "/consumer/login"
      : requiredUserType === "provider"
      ? "/provider/login"
      : "/admin/login";

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
