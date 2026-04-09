import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Provider {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  users: {
    email: string;
    full_name: string;
  };
  experience_years: number;
  created_at: string;
  service_type_id?: string;
}

interface DatabaseProvider {
  id: string;
  user_id: string;
  status: string;
  experience_years: number;
  created_at: string;
  users: {
    email: string;
    full_name: string;
  };
}

const AdminProviderApprovals = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select(`
          id,
          user_id,
          status,
          experience_years,
          created_at,
          users (
            email,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data) {
        const transformedData: Provider[] = data.map(item => {
          // Ensure users is an object, not an array
          const userDetails = Array.isArray(item.users) ? item.users[0] : item.users;
          
          return {
            id: item.id,
            user_id: item.user_id,
            status: item.status as 'pending' | 'approved' | 'rejected',
            experience_years: item.experience_years,
            created_at: item.created_at,
            users: {
              email: userDetails.email,
              full_name: userDetails.full_name
            }
          };
        });
        setProviders(transformedData);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (providerId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', providerId);

      if (error) throw error;

      toast.success(`Provider ${action}d successfully`);
      await fetchPendingProviders();
    } catch (error) {
      console.error('Error updating provider status:', error);
      toast.error(`Failed to ${action} provider`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Provider Approvals
        </h1>
        
        {providers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">No pending provider applications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>{provider.users.full_name}</CardTitle>
                  <CardDescription>{provider.users.email}</CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {provider.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Experience:</strong> {provider.experience_years} years</p>
                    <p><strong>Applied on:</strong> {new Date(provider.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleProviderAction(provider.user_id, 'reject')}
                    className="hover:shadow-md transition-all"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleProviderAction(provider.user_id, 'approve')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all text-white"
                  >
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProviderApprovals;
