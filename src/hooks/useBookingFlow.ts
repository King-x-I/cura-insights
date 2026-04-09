
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

export enum BookingStatus {
  FINDING_PROVIDER = 'finding_provider',
  PROVIDER_ASSIGNED = 'provider_assigned',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export const useBookingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendEmailNotification } = useNotifications();
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(BookingStatus.FINDING_PROVIDER);
  const [assignedProvider, setAssignedProvider] = useState<any | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentBookingId) return;

    console.log("Setting up polling for booking:", currentBookingId);
    
    // Poll for booking updates every 3 seconds (replaces Supabase Realtime)
    const pollInterval = setInterval(async () => {
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', currentBookingId)
          .single();

        if (booking) {
          const newStatus = booking.booking_status as BookingStatus;
          
          if (newStatus !== bookingStatus) {
            setBookingStatus(newStatus);
            
            if (newStatus === BookingStatus.PROVIDER_ASSIGNED) {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              
              const { data: providerData } = await supabase
                .from('provider_details')
                .select('*')
                .eq('id', booking.provider_id)
                .single();
                
              setAssignedProvider(providerData);
              toast.success('A service provider has accepted your booking!');
              navigate(`/consumer/booking-confirmation?bookingId=${currentBookingId}`);
            } else if (newStatus === BookingStatus.CANCELLED) {
              setAssignedProvider(null);
              toast.error('No providers available at the moment. Please try again later.');
            } else if (newStatus === BookingStatus.COMPLETED) {
              toast.success('Your service has been completed');
              navigate(`/consumer/booking-confirmation?bookingId=${currentBookingId}`);
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => {
      console.log("Stopping polling for booking:", currentBookingId);
      clearInterval(pollInterval);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentBookingId, navigate, bookingStatus]);

  const createBooking = async (serviceType: string, serviceDetails: any) => {
    if (!user) {
      toast.error('Please log in to create a booking');
      return null;
    }

    if (isCreatingBooking) {
      toast.info('Booking is already in progress');
      return null;
    }

    try {
      setError(null);
      setIsCreatingBooking(true);
      console.log('Creating booking for service type:', serviceType);
      console.log('Service details:', serviceDetails);
      
      setBookingStatus(BookingStatus.FINDING_PROVIDER);
      setAssignedProvider(null);
      
      const { data: consumerData, error: consumerError } = await supabase
        .from('consumer_details')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (consumerError) {
        console.error('Error getting consumer details:', consumerError);
        throw new Error('Could not retrieve your profile information');
      }
      
      const { data: providers, error: providerError } = await supabase
        .from('provider_details')
        .select('id, email, full_name')
        .eq('service_type', serviceType.toLowerCase())
        .eq('is_online', true)
        .eq('status', 'approved');

      if (providerError) {
        console.error('Error finding providers:', providerError);
        throw providerError;
      }
      
      console.log('Available providers:', providers?.length || 0);
      
      if (!providers || providers.length === 0) {
        toast.error('No providers available for this service');
        setBookingStatus(BookingStatus.CANCELLED);
        return null;
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          consumer_id: consumerData.user_id, // Use user_id instead of id
          service_type: serviceType,
          booking_status: BookingStatus.FINDING_PROVIDER,
          service_details: serviceDetails,
          date_time: new Date().toISOString(),
          location_pickup: serviceDetails.pickupLocation,
          location_drop: serviceDetails.dropoffLocation,
          price_estimate: serviceDetails.estimatedCost || null,
          payment_status: PaymentStatus.PENDING
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      console.log('Booking created:', bookingData);
      setCurrentBookingId(bookingData.id);

      const notifications = providers.map(provider => ({
        user_id: provider.id,
        message: `New ${serviceType} service request from ${serviceDetails.pickupLocation}`,
        type: 'booking',
        booking_id: bookingData.id
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error sending notifications:', notificationError);
      } else {
        console.log('Notifications sent to providers:', notifications.length);
      }
      
      try {
        await sendEmailNotification({
          to: user.email!,
          subject: `Your ${serviceType} Booking Confirmation`,
          templateType: 'booking-confirmation',
          templateData: {
            userName: consumerData.full_name || user.email!.split('@')[0],
            bookingId: bookingData.id,
            serviceType: serviceType,
            dateTime: new Date().toLocaleString(),
            pickupLocation: serviceDetails.pickupLocation,
            dropLocation: serviceDetails.dropoffLocation,
            estimatedCost: serviceDetails.estimatedCost
          }
        });
      } catch (emailError) {
        console.error('Error sending booking confirmation email:', emailError);
      }
      
      timeoutRef.current = setTimeout(async () => {
        try {
          const { data: currentBooking } = await supabase
            .from('bookings')
            .select('booking_status')
            .eq('id', bookingData.id)
            .single();

          if (currentBooking?.booking_status === BookingStatus.FINDING_PROVIDER) {
            await supabase
              .from('bookings')
              .update({ booking_status: BookingStatus.CANCELLED })
              .eq('id', bookingData.id);
            
            setBookingStatus(BookingStatus.CANCELLED);
            setAssignedProvider(null);
            toast.error('No service providers available at the moment. Please try again later.');
          }
        } catch (error) {
          console.error('Error in timeout handler:', error);
        }
      }, 30000);

      return bookingData;
    } catch (error) {
      console.error('Booking creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const acceptBooking = async (bookingId: string) => {
    if (!user) {
      toast.error('Please log in');
      return false;
    }

    try {
      console.log('Provider accepting booking:', bookingId);
      
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (providerError) {
        console.error('Error getting provider details:', providerError);
        throw new Error('Could not retrieve your profile information');
      }
      
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: providerData.id,
          booking_status: BookingStatus.PROVIDER_ASSIGNED 
        })
        .eq('id', bookingId)
        .eq('booking_status', BookingStatus.FINDING_PROVIDER)
        .select()
        .single();

      if (error) {
        console.error('Error accepting booking:', error);
        throw error;
      }

      if (!bookingData) {
        throw new Error('Booking not found or already accepted by another provider');
      }

      // Safe type handling for consumerDetails
      const { data: consumerData } = await supabase
        .from('consumer_details')
        .select('*')
        .eq('user_id', bookingData.consumer_id)
        .single();

      if (consumerData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: consumerData.user_id,
            message: `Your ${bookingData.service_type} booking has been accepted by ${providerData.full_name}`,
            type: 'booking',
            booking_id: bookingId
          });
          
        if (consumerData.email) {
          try {
            await sendEmailNotification({
              to: consumerData.email,
              subject: `Your ${bookingData.service_type} Service Provider Has Been Assigned`,
              templateType: 'booking-confirmation',
              templateData: {
                userName: consumerData.full_name || consumerData.email.split('@')[0],
                bookingId: bookingId,
                serviceType: bookingData.service_type,
                dateTime: new Date(bookingData.date_time).toLocaleString(),
                pickupLocation: bookingData.location_pickup,
                dropLocation: bookingData.location_drop,
                estimatedCost: bookingData.price_estimate,
                providerName: providerData.full_name,
                providerPhone: providerData.phone
              }
            });
          } catch (emailError) {
            console.error('Error sending provider assignment email:', emailError);
          }
        }
      }

      toast.success('Booking accepted successfully');
      
      navigate(`/provider/bookings?bookingId=${bookingId}`);
      
      return true;
    } catch (error) {
      console.error('Booking acceptance error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept booking';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const completeBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          booking_status: BookingStatus.COMPLETED,
          payment_status: PaymentStatus.PENDING 
        })
        .eq('id', bookingId)
        .in('booking_status', [BookingStatus.PROVIDER_ASSIGNED]);

      if (error) throw error;
      
      try {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('consumer_id, service_type')
          .eq('id', bookingId)
          .single();
          
        if (bookingData?.consumer_id) {
          const { data: consumerData } = await supabase
            .from('consumer_details')
            .select('user_id')
            .eq('user_id', bookingData.consumer_id)
            .single();
          
          if (consumerData?.user_id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: consumerData.user_id,
                message: `Your ${bookingData.service_type} service has been completed. Please proceed with payment.`,
                type: 'payment_request',
                booking_id: bookingId
              });
          }
        }
      } catch (notifError) {
        console.error('Error sending payment notification:', notifError);
      }
      
      toast.success('Service marked as completed');
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete service');
      return false;
    }
  };

  return { 
    createBooking, 
    acceptBooking,
    completeBooking,
    bookingStatus, 
    assignedProvider,
    currentBookingId,
    isCreatingBooking,
    error
  };
};
