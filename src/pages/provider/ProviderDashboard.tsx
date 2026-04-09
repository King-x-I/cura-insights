import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ProviderBookingNotification } from "@/components/provider/ProviderBookingNotification";
import { ServiceRequestsWidget } from "@/components/provider/ServiceRequestsWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const stats = [
  {
    title: "Today's Bookings",
    value: "5",
    icon: Calendar,
    color: "bg-blue-100 text-blue-700",
    link: "/provider/bookings",
  },
  {
    title: "Active Hours",
    value: "12.5",
    icon: Clock,
    color: "bg-green-100 text-green-700",
    link: "/provider/settings",
  },
  {
    title: "Earnings",
    value: "$350",
    icon: DollarSign,
    color: "bg-amber-100 text-amber-700",
    link: "/provider/earnings",
  },
  {
    title: "Rating",
    value: "4.8",
    icon: Star,
    color: "bg-purple-100 text-purple-700",
    link: "/provider/settings",
  },
];

interface ProviderData {
  id: string;
  full_name: string;
  email: string;
  status: string;
  is_online: boolean;
  service_type: string;
  profile_picture: string | null;
}

interface BookingWithConsumer {
  id: string;
  service_type: string;
  customer: string;
  date: string;
  address: string;
  status: string;
}

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { acceptBooking } = useBookingFlow();
  const [isOnline, setIsOnline] = useState(false);
  const [bookings, setBookings] = useState<BookingWithConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);
  const navigate = useNavigate();
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const checkProviderStatus = async () => {
      try {
        console.log('Checking provider status for user:', user.id);
        
        // Get user data from auth.users
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error fetching auth user:', authError);
          throw authError;
        }

        // Set email verification status from auth user
        setEmailVerified(authUser?.email_confirmed_at != null);

        // Check provider details
        const { data: providerData, error: providerError } = await supabase
          .from('provider_details')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (providerError) {
          if (providerError.code === 'PGRST116') {
            // No provider record found - redirect to signup
            toast({
              title: "Registration Required",
              description: "Please complete your provider registration",
              variant: "destructive"
            });
            window.location.href = '/provider/signup';
            return;
          } else {
            throw providerError;
          }
        }

        if (providerData) {
          console.log('Provider record found:', providerData);
          setIsOnline(providerData.is_online || false);
          
          // Check if provider is approved
          if (providerData.status !== 'approved') {
            toast({
              title: "Account Not Approved",
              description: "Your provider account is not yet approved. Please wait for admin approval.",
              variant: "destructive"
            });
            setIsOnline(false);
          }
          
          // Fetch bookings if we have a valid provider record
          fetchRealBookings();
        }

        setProviderData(providerData);
      } catch (error) {
        console.error('Error in checkProviderStatus:', error);
        toast({
          title: "Error Checking Status",
          description: "There was a problem checking your provider status. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkProviderStatus();
  }, [user]);

  const fetchRealBookings = async () => {
    if (!user) return;

    try {
      // Use a simpler query that just gets the data without complex joins
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          service_type,
          date_time,
          location_pickup,
          booking_status,
          consumer_id
        `)
        .eq('provider_id', user.id)
        .order('date_time', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Provider bookings:', data);
        
        // Transform bookings into the expected format
        const transformedBookings = data.map(booking => ({
          id: booking.id,
          service_type: booking.service_type,
          customer: "Customer", // Default value without consumer details join
          date: new Date(booking.date_time).toLocaleString(),
          address: booking.location_pickup || "No location specified",
          status: booking.booking_status
        }));

        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleAvailabilityChange = async (checked: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to change your availability",
        variant: "destructive"
      });
      return;
    }

    if (!emailVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email before going online",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check provider status again before allowing online status change
      const { data: providerData, error: statusError } = await supabase
        .from('provider_details')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (statusError) throw statusError;

      if (providerData.status !== 'approved') {
        toast({
          title: "Account Not Approved",
          description: "Your provider account is not yet approved. Please wait for admin approval.",
          variant: "destructive"
        });
        return;
      }

      console.log('Updating provider availability for user:', user.id);
      
      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ 
          is_online: checked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating availability:', updateError);
        throw updateError;
      }

      setIsOnline(checked);
      toast({
        title: "Success",
        description: "Your availability has been updated",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Availability update error:', error);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive"
      });
      setIsOnline(!checked); // Revert the switch state on error
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    const success = await acceptBooking(bookingId);
    if (success) {
      fetchRealBookings();
      toast({
        title: "Success",
        description: "Booking accepted successfully",
        variant: "default"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to accept booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Booking declined successfully",
        variant: "default"
      });
      fetchRealBookings();
    } catch (error) {
      console.error('Error declining booking:', error);
      toast({
        title: "Error",
        description: "Failed to decline booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Verification email sent successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error resending verification:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleAvailability = async () => {
    if (!providerData) return;

    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not found');
      }

      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ 
          is_online: !providerData.is_online,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProviderData(prev => prev ? { ...prev, is_online: !prev.is_online } : null);
      toast({
        title: "Status Updated",
        description: `You are now ${!providerData.is_online ? 'online' : 'offline'}`
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!providerData) {
    return <div>No provider data found</div>;
  }

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap justify-between items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Provider Dashboard
            </h1>
            <p className="text-gray-600">Manage your services and bookings</p>
          </div>
          
          <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2">
              <Switch 
                id="availability" 
                checked={isOnline}
                onCheckedChange={handleAvailabilityChange}
                disabled={loading || !emailVerified}
                className={`${isOnline ? 'bg-green-500' : 'bg-gray-200'} transition-colors duration-200`}
              />
              <Label htmlFor="availability" className={`font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                {isOnline ? "Online" : "Offline"}
              </Label>
            </div>
            <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
              isOnline 
                ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' 
                : 'bg-gray-300'
            }`}></div>
          </div>
        </motion.div>

        {!emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-lg shadow-sm"
          >
            <h3 className="text-amber-800 font-semibold">Email Verification Required</h3>
            <p className="text-amber-700 mb-2">
              Please verify your email address to start receiving booking requests. 
              Check your inbox for the verification link.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 hover:shadow-md transition-all"
                onClick={() => window.open('https://mail.google.com', '_blank')}
              >
                Open Email
              </Button>
              <Button 
                variant="outline"
                className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 hover:shadow-md transition-all"
                onClick={handleResendVerification}
              >
                Resend Verification
              </Button>
            </div>
          </motion.div>
        )}

        {/* New Service Requests Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <ServiceRequestsWidget />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={stat.link} className="block">
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-md ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4"
          id="upcoming-bookings"
        >
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Upcoming Bookings
          </h2>
          
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                    <div className={`border-l-4 ${
                      booking.status === 'provider_assigned' || booking.status === 'accepted' ? 'border-green-500' : 
                      booking.status === 'cancelled' || booking.status === 'declined' ? 'border-red-500' : 
                      'border-indigo-500'
                    } h-full`}>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.service}</h3>
                            <p className="text-gray-500">{booking.customer}</p>
                            <p className="text-gray-500">{booking.date}</p>
                            <p className="text-gray-500">{booking.address}</p>
                            {(booking.status === 'accepted' || booking.status === 'provider_assigned') && (
                              <div className="mt-2 text-sm font-medium text-green-600">Accepted</div>
                            )}
                            {(booking.status === 'declined' || booking.status === 'cancelled') && (
                              <div className="mt-2 text-sm font-medium text-red-600">Declined</div>
                            )}
                          </div>
                          {booking.status === 'finding_provider' && (
                            <div className="flex gap-3 mt-4 sm:mt-0">
                              <Button 
                                variant="outline" 
                                onClick={() => handleDeclineBooking(booking.id)}
                                className="hover:shadow-md transition-all"
                              >
                                Decline
                              </Button>
                              <Button 
                                onClick={() => handleAcceptBooking(booking.id)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all"
                              >
                                Accept
                              </Button>
                            </div>
                          )}
                          {(booking.status === 'accepted' || booking.status === 'provider_assigned') && (
                            <Button 
                              variant="outline"
                              className="hover:shadow-md transition-all"
                            >
                              Contact Customer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No upcoming bookings</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <ProviderBookingNotification />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProviderDashboard;
