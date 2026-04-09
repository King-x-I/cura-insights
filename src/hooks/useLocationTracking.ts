
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface UseLocationTrackingProps {
  bookingId?: string | null;
  trackInterval?: number; // in milliseconds
  enabled?: boolean;
}

export const useLocationTracking = ({
  bookingId,
  trackInterval = 10000, // 10 seconds by default
  enabled = true
}: UseLocationTrackingProps = {}) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Start tracking user's location
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    if (!user) {
      setError("User must be logged in to track location");
      return;
    }

    setIsTracking(true);
    setError(null);

    try {
      // Watch position for continuous updates
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = position.timestamp;
          
          const locationData = {
            latitude,
            longitude, 
            accuracy,
            timestamp
          };
          
          setCurrentLocation(locationData);
          
          // If booking ID is provided, save to database
          if (bookingId) {
            saveLocationToDatabase(locationData);
          }
        },
        (err) => {
          console.error("Error getting location:", err);
          setError(`Location error: ${err.message}`);
          toast.error("Failed to get your location. Please check your location permissions.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
      
      setWatchId(id);
    } catch (err) {
      console.error("Error starting location tracking:", err);
      setError("Failed to start location tracking");
      setIsTracking(false);
    }
  };

  // Stop tracking user's location
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Save location to database
  const saveLocationToDatabase = async (location: LocationData) => {
    if (!user || !bookingId) return;

    try {
      // Instead of using RPC, directly insert/update in the location_tracking table
      const { error } = await supabase
        .from('location_tracking')
        .upsert({
          user_id: user.id,
          booking_id: bookingId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,booking_id'
        });

      if (error) {
        console.error("Error saving location to database:", error);
      }
    } catch (err) {
      console.error("Error in database operation:", err);
    }
  };

  // Get location for a specific user in a booking
  const getLocationForUser = async (userId: string, bookingId: string) => {
    try {
      // Directly query the location_tracking table
      const { data, error } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        console.error("Error getting user location:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error in getLocationForUser:", err);
      return null;
    }
  };

  // Auto-start tracking based on enabled prop
  useEffect(() => {
    if (enabled && !isTracking && user) {
      startTracking();
    } else if (!enabled && isTracking) {
      stopTracking();
    }
    
    // Cleanup on unmount
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [enabled, user, bookingId]);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getLocationForUser
  };
};
