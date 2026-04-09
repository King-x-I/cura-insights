
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, User, Phone, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocationMap } from '@/components/maps/LocationMap';
import { BookingPayment } from '@/components/payment/BookingPayment';
import { useBookingFlow, BookingStatus } from '@/hooks/useBookingFlow';

const BookingConfirmation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: uiToast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [consumer, setConsumer] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const bookingId = location.state?.bookingId || new URLSearchParams(location.search).get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      uiToast({
        title: "Error",
        description: "No booking ID provided",
        variant: "destructive"
      });
      navigate('/consumer/dashboard');
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Booking not found');

        setBooking(data);

        // Fetch provider details
        if (data.provider_id) {
          const { data: providerData, error: providerError } = await supabase
            .from('provider_details')
            .select('*')
            .eq('id', data.provider_id)
            .single();

          if (providerError) throw providerError;
          setProvider(providerData);
        }

        // Fetch consumer details
        if (data.consumer_id) {
          const { data: consumerData, error: consumerError } = await supabase
            .from('consumer_details')
            .select('*')
            .eq('id', data.consumer_id)
            .single();

          if (consumerError) throw consumerError;
          setConsumer(consumerData);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        uiToast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();

    // Set up real-time updates for this booking
    const channel = supabase
      .channel(`booking-updates-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Booking updated:', payload);
          setBooking(payload.new);
          
          // If provider was just assigned, fetch provider details
          if (payload.new.provider_id && (!booking?.provider_id || payload.new.provider_id !== booking.provider_id)) {
            fetchProviderDetails(payload.new.provider_id);
          }
          
          // If payment status changed to completed
          if (payload.new.payment_status === 'completed' && booking?.payment_status !== 'completed') {
            toast.success('Payment completed!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, navigate, uiToast]);
  
  const fetchProviderDetails = async (providerId) => {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      setProvider(data);
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
  };

  const handleCompleteBooking = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: BookingStatus.COMPLETED })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Service marked as completed!');
      setShowPayment(true);
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete service');
    }
  };

  const handlePayment = async () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    toast.success('Payment successful!');
    setShowPayment(false);
    navigate('/consumer/dashboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case BookingStatus.FINDING_PROVIDER:
        return <Badge className="bg-yellow-500">Finding Provider</Badge>;
      case BookingStatus.PROVIDER_ASSIGNED:
        return <Badge className="bg-blue-500">Provider Assigned</Badge>;
      case BookingStatus.COMPLETED:
        return <Badge className="bg-green-500">Completed</Badge>;
      case BookingStatus.CANCELLED:
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Payment Pending</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="consumer">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showPayment && booking) {
    return (
      <DashboardLayout userType="consumer">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Complete Payment</h1>
            <p className="text-gray-500">Your service has been completed. Please proceed with payment.</p>
          </div>
          
          <BookingPayment
            bookingId={booking.id}
            serviceType={booking.service_type}
            amount={booking.price_estimate ? booking.price_estimate * 100 : 49900} // Convert to cents or use default
            customerName={consumer?.full_name || 'Customer'}
            customerEmail={consumer?.email || user?.email || ''}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="consumer">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-gray-500">Track your current booking</p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(booking?.booking_status)}
            {booking?.payment_status && getPaymentStatusBadge(booking.payment_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p className="font-medium capitalize">{booking?.service_type?.replace(/-/g, ' ')}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Booking Status</p>
                    <p className="font-medium flex items-center gap-1">
                      {getStatusBadge(booking?.booking_status)}
                      {booking?.booking_status === BookingStatus.FINDING_PROVIDER && (
                        <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500"></span>
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Booking ID</p>
                    <p className="font-medium">{booking?.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">{new Date(booking?.date_time).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>Pickup Location</span>
                    </div>
                    <p className="font-medium">{booking?.location_pickup}</p>
                  </div>
                  
                  {booking?.location_drop && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>Drop Location</span>
                      </div>
                      <p className="font-medium">{booking?.location_drop}</p>
                    </div>
                  )}
                  
                  {booking?.price_estimate && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <DollarSign size={14} />
                        <span>Estimated Price</span>
                      </div>
                      <p className="font-medium">₹{booking?.price_estimate}</p>
                    </div>
                  )}
                  
                  {booking?.payment_status && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <DollarSign size={14} />
                        <span>Payment Status</span>
                      </div>
                      <p className="font-medium">{getPaymentStatusBadge(booking.payment_status)}</p>
                    </div>
                  )}
                </div>
                
                {/* Additional service details */}
                {booking?.service_details && Object.keys(booking.service_details).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2">Additional Details</h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {booking.service_details.estimatedHours && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>Estimated Hours</span>
                          </div>
                          <p>{booking.service_details.estimatedHours} hours</p>
                        </div>
                      )}
                      
                      {booking.service_details.startTime && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar size={14} />
                            <span>Start Time</span>
                          </div>
                          <p>{booking.service_details.startTime}</p>
                        </div>
                      )}
                      
                      {booking.service_details.endTime && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar size={14} />
                            <span>End Time</span>
                          </div>
                          <p>{booking.service_details.endTime}</p>
                        </div>
                      )}
                      
                      {booking.service_details.additionalNotes && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-sm text-gray-500">Additional Notes</p>
                          <p>{booking.service_details.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {booking?.location_pickup && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <LocationMap 
                      pickupLocation={booking.location_pickup}
                      dropoffLocation={booking.location_drop}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {provider && (
              <Card>
                <CardHeader>
                  <CardTitle>Provider Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {provider.profile_picture ? (
                        <img 
                          src={provider.profile_picture} 
                          alt={provider.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={30} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{provider.full_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{provider.service_type?.replace(/-/g, ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    {provider.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-500" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    
                    {provider.experience_years && (
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-500" />
                        <span>{provider.experience_years} years of experience</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
              </CardHeader>
              <CardContent>
                {booking?.booking_status === BookingStatus.FINDING_PROVIDER ? (
                  <p>Searching for a service provider. Please wait...</p>
                ) : booking?.booking_status === BookingStatus.PROVIDER_ASSIGNED ? (
                  <p>Your service is in progress. Once completed, you'll be asked to make a payment.</p>
                ) : booking?.booking_status === BookingStatus.COMPLETED ? (
                  booking?.payment_status === 'completed' ? (
                    <p>This service has been completed and payment has been received. Thank you!</p>
                  ) : (
                    <p>This service has been completed. Please proceed with payment.</p>
                  )
                ) : (
                  <p>This booking has been cancelled.</p>
                )}
              </CardContent>
              <CardFooter>
                {booking?.booking_status === BookingStatus.PROVIDER_ASSIGNED && (
                  <Button 
                    onClick={handleCompleteBooking} 
                    className="w-full flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Mark as Completed
                  </Button>
                )}
                
                {booking?.booking_status === BookingStatus.COMPLETED && booking?.payment_status !== 'completed' && (
                  <Button 
                    onClick={handlePayment} 
                    className="w-full"
                  >
                    Pay Now
                  </Button>
                )}
                
                {(booking?.booking_status === BookingStatus.FINDING_PROVIDER || 
                  (booking?.booking_status === BookingStatus.COMPLETED && booking?.payment_status === 'completed')) && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/consumer/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookingConfirmation;
