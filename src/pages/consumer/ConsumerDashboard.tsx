
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ServicesGrid } from "@/components/consumer/dashboard/ServicesGrid";
import { ActiveBookingsList } from "@/components/consumer/dashboard/ActiveBookingsList";
import { RecentBookingsList } from "@/components/consumer/dashboard/RecentBookingsList";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { Separator } from "@/components/ui/separator";

const ConsumerDashboard = () => {
  const { user } = useAuth();
  const { activeBookings, recentBookings, loading } = useBookings();
  
  return (
    <DashboardLayout userType="consumer">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Welcome back, {user?.user_metadata?.full_name || "Customer"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Book a service or check your active bookings below
          </p>
        </div>
        

        <h2 className="text-2xl font-semibold">Our Services</h2>
        <ServicesGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Active Bookings</h2>
            <ActiveBookingsList bookings={activeBookings} loading={loading} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Bookings</h2>
            <RecentBookingsList bookings={recentBookings} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConsumerDashboard;
