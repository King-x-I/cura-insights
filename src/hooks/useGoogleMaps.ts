
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Global variable to track if the script is currently loading
let isLoadingScript = false;
// Global variable to track if the API is fully loaded
let isApiLoaded = false;

// Google Maps Places Autocomplete Hook
export function useGooglePlacesAutocomplete() {
  const [isLoaded, setIsLoaded] = useState(isApiLoaded);
  const [placePredictions, setPlacePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKeyFetchAttempted = useRef(false);

  // Load Google Maps API key
  useEffect(() => {
    const loadGoogleMapsApiKey = async () => {
      try {
        // Check if we already have the key in memory or if we've already tried fetching it
        if (apiKey || apiKeyFetchAttempted.current) return;
        
        // Mark that we've attempted to fetch the API key
        apiKeyFetchAttempted.current = true;
        
        console.log('Fetching Google Maps API key from edge function...');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          console.error('Error fetching Google Maps API key:', error);
          setError('Failed to load Google Maps API');
          toast.error('Error loading maps. Please try again later.');
          return;
        }
        
        if (data?.apiKey) {
          console.log('Successfully fetched Google Maps API key');
          setApiKey(data.apiKey);
        } else {
          console.error('No Google Maps API key returned');
          setError('No maps API key available');
          toast.error('Maps configuration error. Please try again later.');
        }
      } catch (error) {
        console.error('Failed to fetch Google Maps API key:', error);
        setError('Network error loading maps');
        toast.error('Network error loading maps. Please check your connection.');
      }
    };
    
    loadGoogleMapsApiKey();
  }, [apiKey]);

  // Load Google Maps script
  useEffect(() => {
    // If we don't have the API key yet, don't proceed
    if (!apiKey) return;
    
    // Check if the script is already loaded
    if (window.google?.maps && isApiLoaded) {
      console.log('Google Maps already loaded, using existing instance');
      setIsLoaded(true);
      return;
    }
    
    // Don't try to load if another instance is already loading
    if (isLoadingScript) {
      console.log('Google Maps script is already loading, waiting for it to finish...');
      const checkIfLoaded = setInterval(() => {
        if (isApiLoaded) {
          console.log('Detected Google Maps has loaded from another component');
          setIsLoaded(true);
          clearInterval(checkIfLoaded);
        }
      }, 100);
      
      return () => clearInterval(checkIfLoaded);
    }
    
    // Start loading the script
    isLoadingScript = true;
    
    // Check for existing script to avoid duplicates
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for it to load');
      const checkExisting = setInterval(() => {
        if (window.google?.maps) {
          console.log('Existing Google Maps script finished loading');
          isApiLoaded = true;
          setIsLoaded(true);
          isLoadingScript = false;
          clearInterval(checkExisting);
        }
      }, 100);
      
      return () => clearInterval(checkExisting);
    }
    
    console.log('Loading Google Maps script with API key');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      isApiLoaded = true;
      setIsLoaded(true);
      isLoadingScript = false;
    };
    
    script.onerror = (e) => {
      console.error('Error loading Google Maps script:', e);
      setError('Failed to load maps script');
      isLoadingScript = false;
      toast.error('Failed to load maps. Please refresh and try again.');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // We don't actually remove the script on unmount to avoid issues with multiple components
      isLoadingScript = false;
    };
  }, [apiKey]);

  const getPlacePredictions = useCallback(async (input: string) => {
    if (!isLoaded || !input) {
      setPlacePredictions([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const autocompleteService = new google.maps.places.AutocompleteService();
      const results = await autocompleteService.getPlacePredictions({
        input,
        componentRestrictions: { country: 'in' }, // Restrict to India, change as needed
      });
      
      setPlacePredictions(results?.predictions || []);
    } catch (error) {
      console.error('Place Autocomplete Error:', error);
      setPlacePredictions([]);
    } finally {
      setIsSearching(false);
    }
  }, [isLoaded]);

  const getPlaceDetails = useCallback(async (placeId: string) => {
    if (!isLoaded || !placeId) {
      return null;
    }

    try {
      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      return new Promise((resolve, reject) => {
        placesService.getDetails(
          { placeId, fields: ['formatted_address', 'geometry', 'name'] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error(`Place details request failed: ${status}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Place Details Error:', error);
      return null;
    }
  }, [isLoaded]);

  const calculateDistance = useCallback(async (origin: string, destination: string) => {
    if (!isLoaded || !origin || !destination) {
      return null;
    }

    try {
      const service = new google.maps.DistanceMatrixService();
      const response = await service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (response.rows[0]?.elements[0]?.status === 'OK') {
        return {
          distance: response.rows[0].elements[0].distance,
          duration: response.rows[0].elements[0].duration,
        };
      }
      return null;
    } catch (error) {
      console.error('Distance Matrix Error:', error);
      return null;
    }
  }, [isLoaded]);

  return {
    isLoaded,
    isSearching,
    placePredictions,
    getPlacePredictions,
    getPlaceDetails,
    calculateDistance,
    error
  };
}
