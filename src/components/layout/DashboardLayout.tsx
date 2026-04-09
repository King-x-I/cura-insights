
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface DashboardLayoutProps {
  userType: "consumer" | "provider" | "admin";
  children: React.ReactNode;
}

export function DashboardLayout({ userType, children }: DashboardLayoutProps) {
  const { user, userType: currentUserType, isLoading } = useAuth();
  
  // Check if user is authenticated
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to={`/${userType}/login`} replace />;
  }
  
  // If user type doesn't match, redirect to the correct dashboard
  if (currentUserType && currentUserType !== userType) {
    return <Navigate to={`/${currentUserType}/dashboard`} replace />;
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {userType !== "admin" ? (
          <DashboardSidebar userType={userType as "consumer" | "provider"} />
        ) : (
          <DashboardSidebar userType="provider" />
        )}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="md:hidden p-4">
            <SidebarTrigger />
          </div>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
