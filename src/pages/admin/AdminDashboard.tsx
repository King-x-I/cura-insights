
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UsersIcon, UserCheckIcon, CalendarIcon, DollarSignIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStat {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch total consumers
        const { count: consumerCount, error: consumerError } = await supabase
          .from('consumer_details')
          .select('*', { count: 'exact', head: true });
          
        if (consumerError) throw consumerError;
        
        // Fetch total providers
        const { count: providerCount, error: providerError } = await supabase
          .from('provider_details')
          .select('*', { count: 'exact', head: true });
          
        if (providerError) throw providerError;
        
        // Fetch pending provider approvals
        const { count: pendingApprovalCount, error: pendingError } = await supabase
          .from('provider_details')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false);
          
        if (pendingError) throw pendingError;
        
        // Fetch total bookings
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });
          
        if (bookingError) throw bookingError;
        
        setStats([
          {
            title: 'Total Consumers',
            value: consumerCount || 0,
            icon: <UsersIcon className="h-6 w-6" />,
            description: 'Total registered consumers',
            color: 'bg-blue-500'
          },
          {
            title: 'Total Providers',
            value: providerCount || 0,
            icon: <UserCheckIcon className="h-6 w-6" />,
            description: 'Total registered service providers',
            color: 'bg-green-500'
          },
          {
            title: 'Pending Approvals',
            value: pendingApprovalCount || 0,
            icon: <UserCheckIcon className="h-6 w-6" />,
            description: 'Providers awaiting approval',
            color: 'bg-amber-500'
          },
          {
            title: 'Total Bookings',
            value: bookingCount || 0,
            icon: <CalendarIcon className="h-6 w-6" />,
            description: 'Total service bookings',
            color: 'bg-purple-500'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [user]);

  return (
    <DashboardLayout userType="admin">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            // Loading state
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-20 animate-pulse bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Actual stats
            stats.map((stat, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${stat.color} bg-opacity-10 mr-4`}>
                      <div className={`text-${stat.color.replace('bg-', '')}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <h4 className="text-2xl font-bold">{stat.value}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">{stat.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="/admin/provider-approvals" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <h3 className="font-medium">Provider Approvals</h3>
                    <p className="text-sm text-gray-500 mt-1">Review and approve service providers</p>
                  </a>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">User Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Coming soon</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">Service Analytics</h3>
                    <p className="text-sm text-gray-500 mt-1">Coming soon</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">System Settings</h3>
                    <p className="text-sm text-gray-500 mt-1">Coming soon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 py-6 text-center">
                The activity feed is currently in development.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
