
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBookings = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      try {
        // Fetch active bookings (those with pending, finding_provider, or provider_assigned status)
        const { data: active, error: activeError } = await supabase
          .from('bookings')
          .select(`
            *,
            provider_details:provider_id(full_name, phone, profile_picture)
          `)
          .eq('consumer_id', user.id)
          .in('booking_status', ['finding_provider', 'provider_assigned'])
          .order('date_time', { ascending: true });

        if (activeError) throw activeError;
        setActiveBookings(active || []);

        // Fetch recent completed or cancelled bookings
        const { data: recent, error: recentError } = await supabase
          .from('bookings')
          .select('*')
          .eq('consumer_id', user.id)
          .in('booking_status', ['completed', 'cancelled'])
          .order('date_time', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        setRecentBookings(recent || []);

      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  return { activeBookings, recentBookings, loading };
};
