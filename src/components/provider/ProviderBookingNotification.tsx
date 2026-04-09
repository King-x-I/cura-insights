
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { toast } from 'sonner';

export const ProviderBookingNotification: React.FC = () => {
  const { user } = useAuth();
  const { acceptBooking } = useBookingFlow();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing notifications on component mount
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'booking')
          .eq('seen', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched provider notifications:', data?.length || 0);
        
        if (data && data.length > 0) {
          setNotifications(data);
          // If we have notifications, fetch the booking details for the first one
          fetchBookingDetails(data[0]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('provider-booking-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New notification received:', payload);
          if (payload.new && payload.new.type === 'booking') {
            setNotifications(prev => [payload.new, ...prev]);
            
            // Fetch booking details for this notification
            fetchBookingDetails(payload.new);
            
            // Show toast
            toast.info('New booking request received!');
            
            // Add sound effect for notification
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.error('Audio playback error:', err));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchBookingDetails = async (notification: any) => {
    if (!notification?.booking_id) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, consumer_details(*)')
        .eq('id', notification.booking_id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        console.log('Fetched booking details:', data);
        setSelectedBooking({
          ...data,
          notification_id: notification.id
        });
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const handleAccept = async (booking: any) => {
    setLoading(true);
    try {
      const accepted = await acceptBooking(booking.id);
      if (accepted) {
        // Mark notification as seen
        await supabase
          .from('notifications')
          .update({ seen: true })
          .eq('id', booking.notification_id);
        
        // Remove from notifications list
        setNotifications(prev => prev.filter(n => n.id !== booking.notification_id));
        setSelectedBooking(null);
        
        toast.success('Booking accepted! The customer has been notified.');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error('Failed to accept booking. It may have been accepted by another provider.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (booking: any) => {
    setLoading(true);
    try {
      // Mark notification as seen
      await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('id', booking.notification_id);
      
      // Remove from notifications list
      setNotifications(prev => prev.filter(n => n.id !== booking.notification_id));
      setSelectedBooking(null);
      
      toast.info('Booking request rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking notification');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBooking) return null;

  return (
    <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Booking Request</DialogTitle>
          <DialogDescription>
            You have a new {selectedBooking.service_type} service request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <div className="grid grid-cols-3 gap-1">
              <span className="font-semibold">Service:</span>
              <span className="col-span-2">{selectedBooking.service_type}</span>
              
              <span className="font-semibold">Pickup:</span>
              <span className="col-span-2">{selectedBooking.location_pickup}</span>
              
              <span className="font-semibold">Drop-off:</span>
              <span className="col-span-2">{selectedBooking.location_drop || 'Same as pickup (Round trip)'}</span>
              
              <span className="font-semibold">Date:</span>
              <span className="col-span-2">{new Date(selectedBooking.date_time).toLocaleString()}</span>
              
              {selectedBooking.price_estimate && (
                <>
                  <span className="font-semibold">Est. Price:</span>
                  <span className="col-span-2">₹{selectedBooking.price_estimate}</span>
                </>
              )}
              
              {selectedBooking.service_details && (
                <>
                  {selectedBooking.service_details.startTime && (
                    <>
                      <span className="font-semibold">Start Time:</span>
                      <span className="col-span-2">{selectedBooking.service_details.startTime}</span>
                    </>
                  )}
                  
                  {selectedBooking.service_details.endTime && (
                    <>
                      <span className="font-semibold">End Time:</span>
                      <span className="col-span-2">{selectedBooking.service_details.endTime}</span>
                    </>
                  )}
                  
                  {selectedBooking.service_details.estimatedHours && (
                    <>
                      <span className="font-semibold">Duration:</span>
                      <span className="col-span-2">{selectedBooking.service_details.estimatedHours} hours</span>
                    </>
                  )}
                  
                  {selectedBooking.service_details.additionalNotes && (
                    <>
                      <span className="font-semibold">Notes:</span>
                      <span className="col-span-2">{selectedBooking.service_details.additionalNotes}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between space-x-2">
            <Button 
              variant="destructive" 
              onClick={() => handleReject(selectedBooking)}
              disabled={loading}
            >
              Reject
            </Button>
            <Button 
              onClick={() => handleAccept(selectedBooking)}
              disabled={loading}
            >
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
