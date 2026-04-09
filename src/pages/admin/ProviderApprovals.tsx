import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProviderService } from '@/services/providerService';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface Provider {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_type: string | null;
  experience_years: number | null;
  skills: string | null;
  govt_id_url: string | null;
  license_url: string | null;
  profile_picture: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const ProviderApprovals = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await ProviderService.getAllPendingProviders();
      if (error) throw error;
      setProviders(data as Provider[]);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to fetch pending providers');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const { success, error } = await ProviderService.approveProvider(userId, approved);
      
      if (error) throw error;
      if (!success) throw new Error('Failed to update provider status');
      
      toast.success(`Provider ${approved ? 'approved' : 'rejected'} successfully`);
      // Refresh the list
      fetchPendingProviders();
    } catch (error) {
      console.error('Error updating provider status:', error);
      toast.error('Failed to update provider status');
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

        <div className="grid gap-6">
          {providers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No pending provider approvals
              </CardContent>
            </Card>
          ) : (
            providers.map((provider) => (
              <Card key={provider.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">
                      {provider.full_name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {provider.service_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-500">Contact Information</h3>
                        <p className="mt-1">Email: {provider.email}</p>
                        <p>Phone: {provider.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-500">Professional Details</h3>
                        <p className="mt-1">Experience: {provider.experience_years} years</p>
                        <p>Skills: {provider.skills || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-500">Documents</h3>
                        <div className="mt-2 space-y-2">
                          {provider.govt_id_url && (
                            <a
                              href={provider.govt_id_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-indigo-600 hover:text-indigo-800"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Government ID
                            </a>
                          )}
                          {provider.license_url && (
                            <a
                              href={provider.license_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-indigo-600 hover:text-indigo-800"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View License
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-4 mt-6">
                        <Button
                          onClick={() => handleApproval(provider.user_id, false)}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApproval(provider.user_id, true)}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProviderApprovals; 