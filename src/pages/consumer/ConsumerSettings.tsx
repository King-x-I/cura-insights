import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import { ConsumerService } from '@/services/consumerService';

// Define a simple independent interface that doesn't reference other complex types
interface ConsumerProfileData {
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  profile_picture?: string | null;
  [key: string]: any; // Allow for any additional properties without complex typing
}

const ConsumerSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ConsumerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setFetchError(null);
    
    try {
      console.log('Fetching profile for user ID:', user.id);
      
      // First try to get the profile directly from the database
      const { data, error } = await supabase
        .from('consumer_details')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile from database by id:', error);
        
        // Try with user_id instead of id
        const { data: dataByUserId, error: errorByUserId } = await supabase
          .from('consumer_details')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (errorByUserId) {
          console.error('Error fetching profile from database by user_id:', errorByUserId);
          
          // If both database queries fail, try the service
          const profileData = await ConsumerService.getProfile(user.id);
          
          if (profileData) {
            console.log('Profile loaded from service successfully:', profileData);
            setProfile(profileData);
          } else {
            // Last resort: create a minimal profile
            console.log('Creating minimal profile with available data');
            setProfile({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              phone: '',
              address: '',
            });
            
            // Try to save this minimal profile
            try {
              await supabase
                .from('consumer_details')
                .upsert({
                  user_id: user.id,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  email: user.email || '',
                  created_at: new Date().toISOString()
                });
            } catch (saveErr) {
              console.error('Error saving minimal profile:', saveErr);
            }
          }
        } else if (dataByUserId) {
          console.log('Profile loaded from database by user_id successfully:', dataByUserId);
          setProfile(dataByUserId as ConsumerProfileData);
        }
      } else if (data) {
        console.log('Profile loaded from database by id successfully:', data);
        setProfile(data as ConsumerProfileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setFetchError('Error fetching profile data');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !profile) return;

    setSaving(true);
    try {
      console.log('Updating profile with data:', {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      });
      
      // Directly upsert using user_id as the conflict target
      const { error: upsertError } = await supabase
        .from('consumer_details')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone || '',
          address: profile.address || '',
          email: profile.email || user.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (upsertError) {
        throw upsertError;
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpdate = async (imageUrl: string) => {
    if (!user?.id) return;

    try {
      console.log('Updating profile picture to:', imageUrl);
      
      const { error: upsertError } = await supabase
        .from('consumer_details')
        .upsert({
          user_id: user.id,
          profile_picture: imageUrl,
          email: profile?.email || user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (upsertError) {
        throw upsertError;
      }
      
      setProfile(prev => prev ? { ...prev, profile_picture: imageUrl } : null);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="consumer">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout userType="consumer">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your personal information and profile settings
            </p>
          </div>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <p className="text-red-600 mb-4">{fetchError}</p>
                <Button onClick={loadProfile}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="consumer">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and profile settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileImageUpload
              currentImageUrl={profile?.profile_picture || null}
              userId={user?.id || null}
              onImageUploaded={handleProfileImageUpdate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile?.address || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <Separator />

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="mr-2">Saving...</span>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConsumerSettings;
