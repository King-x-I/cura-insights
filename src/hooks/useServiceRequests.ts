
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ServiceRequest {
  id: string;
  service_type: string;
  location: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  created_at: string;
  details?: any;
}

export const useServiceRequests = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userType } = useAuth();

  // Fetch existing pending requests
  const fetchRequests = async () => {
    if (!user || userType !== 'provider') return;
    
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          id, 
          service_type, 
          location, 
          customer_id, 
          status, 
          created_at, 
          details
        `)
        .eq('status', 'pending');
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // Enhance request data with customer names
        const enhancedRequests = await Promise.all(
          data.map(async (request) => {
            // Get customer details from consumer_details table
            const { data: customerData } = await supabase
              .from('consumer_details')
              .select('full_name')
              .eq('user_id', request.customer_id)
              .single();
              
            return {
              ...request,
              customer_name: customerData?.full_name || 'Unknown Customer'
            };
          })
        );
        
        setRequests(enhancedRequests);
      }
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept a request and create a booking
  const acceptRequest = async (requestId: string) => {
    if (!user) return false;
    
    try {
      // Get the request details first
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (requestError) throw requestError;
      if (!requestData) throw new Error('Request not found');
      
      // Get provider details
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (providerError) throw providerError;
      
      // Create a booking from this request
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          consumer_id: requestData.customer_id,
          provider_id: user.id,
          service_type: requestData.service_type,
          location_pickup: requestData.location,
          booking_status: 'provider_assigned',
          date_time: requestData.created_at,
          service_details: requestData.details,
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      console.log('Created booking:', bookingData);
      
      // Update request status
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          status: 'accepted',
          provider_id: user.id
        })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // Create notification for consumer
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: requestData.customer_id,
          message: `Your ${requestData.service_type} service request has been accepted!`,
          type: 'booking',
          booking_id: bookingData.id
        });
      
      if (notifError) console.error('Error creating notification:', notifError);
      
      // Remove the request from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Request accepted successfully');
      return true;
    } catch (err: any) {
      console.error('Error accepting request:', err);
      toast.error('Failed to accept request');
      return false;
    }
  };

  // Decline a request
  const declineRequest = async (requestId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('requests')
        .update({ status: 'declined' })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // Remove the request from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Request declined');
      return true;
    } catch (err: any) {
      console.error('Error declining request:', err);
      toast.error('Failed to decline request');
      return false;
    }
  };

  // Poll for updates (replaces Supabase Realtime)
  useEffect(() => {
    // Only providers should poll for updates
    if (!user || userType !== 'provider') return;

    // Fetch initial data
    fetchRequests();

    // Poll every 5 seconds for new requests
    const pollInterval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, userType]);

  return { 
    requests, 
    loading, 
    error, 
    fetchRequests,
    acceptRequest,
    declineRequest
  };
};
