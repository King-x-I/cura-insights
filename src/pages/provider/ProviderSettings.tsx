import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import DocumentUpload from "@/components/profile/DocumentUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { LocationSearch } from '@/components/ui/location-search';

interface ProviderProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  profile_picture: string | null;
  service_type: string | null;
  experience_years: number | null;
  is_online: boolean;
  govt_id_url: string | null;
  license_url: string | null;
  skills: string | null;
  languages: string | null;
}

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address is required for service location" }),
  service_type: z.string().min(1, { message: "Service type is required" }),
  experience_years: z.coerce.number().min(0, { message: "Experience must be a valid number" }).nullable(),
  is_online: z.boolean().optional(),
  skills: z.string().optional().nullable(),
  languages: z.string().optional().nullable()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const serviceTypeOptions = [
  { value: "driver", label: "Driver" },
  { value: "caretaker", label: "Caretaker" },
  { value: "nanny", label: "Nanny" },
  { value: "house_helper", label: "House Helper" },
  { value: "chef", label: "Chef" },
  { value: "parcel_delivery", label: "Parcel Delivery" }
];

const ProviderSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProviderProfileData | null>(null);
  const [location, setLocation] = useState('');

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      service_type: "",
      experience_years: null,
      is_online: false,
      skills: "",
      languages: ""
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const fetchProviderProfile = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }

      if (!user) {
        console.error('No user found');
        return;
      }

      console.log('Fetching profile for user:', user.id);

      // Get provider details
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log('Fetched provider profile:', data);
      setProfile(data);
      if (data.address) {
        setLocation(data.address);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      // Reset form with profile data
      profileForm.reset({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        service_type: profile.service_type || "",
        experience_years: profile.experience_years || null,
        skills: profile.skills || "",
        languages: profile.languages || ""
      });
      setLocation(profile.address || "");
    }
  }, [profile]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not found');
      }

      const { error: updateError } = await (supabase
        .from('provider_details') as any)
        .upsert({
          ...data,
          user_id: user.id,
          profile_picture: profile?.profile_picture,
          govt_id_url: profile?.govt_id_url,
          license_url: profile?.license_url,
          address: location || data.address,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) {
        throw updateError;
      }

      toast.success("Profile updated successfully");
      fetchProviderProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (placeId: string, address: string) => {
    setLocation(address);
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">Manage your provider account settings and profile.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Provider Profile</CardTitle>
                <CardDescription>
                  Update your personal details and service information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <ProfileImageUpload 
                    userId={user?.id} 
                    currentImageUrl={profile?.profile_picture}
                    onImageUploaded={(url) => {
                      setProfile({ ...profile, profile_picture: url });
                      fetchProviderProfile();
                    }}
                  />
                </div>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormDescription>Email cannot be changed</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="service_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {serviceTypeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="experience_years"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience (years)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <LocationSearch
                          value={location}
                          onChange={setLocation}
                          onLocationSelect={handleLocationSelect}
                          className="w-full"
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Skills & Expertise</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="List your relevant skills (comma-separated)"
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of your key skills related to your service
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="languages"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Languages</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="E.g., English, Hindi, Tamil"
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of languages you speak
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Identity & Verification</CardTitle>
                <CardDescription>
                  Upload and manage your identification documents and licenses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Government ID</h3>
                  <p className="text-sm text-gray-500">
                    Please upload a valid government-issued ID for verification purposes.
                  </p>
                  <DocumentUpload
                    documentUrl={profile.govt_id_url}
                    documentType="Government ID"
                    userId={user?.id || null}
                    onDocumentUploaded={(url) => setProfile({ ...profile, govt_id_url: url })}
                    allowedFileTypes={[".jpg", ".jpeg", ".png", ".pdf"]}
                    folder="govt_ids"
                  />
                </div>

                <Separator />

                {(profile.service_type === "driver" || profile.license_url) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Driver's License</h3>
                    <p className="text-sm text-gray-500">
                      Required for driver services. Please upload a valid driver's license.
                    </p>
                    <DocumentUpload
                      documentUrl={profile.license_url}
                      documentType="Driver's License"
                      userId={user?.id || null}
                      onDocumentUploaded={(url) => setProfile({ ...profile, license_url: url })}
                      allowedFileTypes={[".jpg", ".jpeg", ".png", ".pdf"]}
                      folder="licenses"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(async (values) => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.updateUser({
                        password: values.newPassword,
                      });
                      
                      if (error) throw error;
                      
                      toast.success("Password updated successfully");
                      passwordForm.reset();
                    } catch (error: any) {
                      console.error("Error updating password:", error);
                      toast.error(error.message || "Failed to update password");
                    } finally {
                      setLoading(false);
                    }
                  })} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProviderSettings;
