
import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGoogleMaps';

interface LocationMapProps {
  pickupLocation?: { lat: number; lng: number } | null;
  dropoffLocation?: { lat: number; lng: number } | null;
  providerLocation?: { lat: number; lng: number } | null;
  consumerLocation?: { lat: number; lng: number } | null;
  className?: string;
  showRoute?: boolean;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

export function LocationMap({
  pickupLocation,
  dropoffLocation,
  providerLocation,
  consumerLocation,
  className = "w-full h-[300px] rounded-md",
  showRoute = true,
  zoom = 14,
  mapType = 'roadmap'
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the shared hook for Google Maps
  const { isLoaded, error: mapsError } = useGooglePlacesAutocomplete();

  // Initialize Google Maps when API is loaded
  useEffect(() => {
    if (!isLoaded) {
      console.log('Waiting for Google Maps API to load...');
      setIsLoading(true);
      return;
    }
    
    try {
      console.log('Google Maps API loaded, initializing map component');
      if (!mapRef.current) {
        setError("Map container not found");
        setIsLoading(false);
        return;
      }

      // Create the map
      const mapOptions: google.maps.MapOptions = {
        zoom,
        mapTypeId: mapType,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
      };

      // Create new map instance
      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      console.log('Map instance created successfully');

      // Create directions renderer if needed
      if (showRoute) {
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#4f46e5",
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        directionsRendererRef.current = directionsRenderer;
        console.log('Direction renderer created');
      }

      setIsLoading(false);
      
      // Update markers and routes now that map is initialized
      updateMarkersAndRoutes();
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Error initializing map. Please try again later.");
      setIsLoading(false);
    }
  }, [isLoaded, mapType, showRoute, zoom]);

  // Set error from maps hook
  useEffect(() => {
    if (mapsError) {
      console.error('Maps error from hook:', mapsError);
      setError(mapsError);
    }
  }, [mapsError]);

  // Update markers and routes when locations change
  const updateMarkersAndRoutes = () => {
    if (!isLoaded || isLoading || !mapInstanceRef.current) {
      console.log('Cannot update markers - map not ready yet');
      return;
    }

    console.log('Updating map markers and routes');
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const map = mapInstanceRef.current;

    // Add pickup marker
    if (pickupLocation) {
      console.log('Adding pickup marker at', pickupLocation);
      const pickupMarker = new google.maps.Marker({
        position: pickupLocation,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        title: "Pickup Location"
      });
      markersRef.current.push(pickupMarker);
      bounds.extend(pickupLocation);
    }

    // Add dropoff marker
    if (dropoffLocation) {
      console.log('Adding dropoff marker at', dropoffLocation);
      const dropoffMarker = new google.maps.Marker({
        position: dropoffLocation,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        title: "Dropoff Location"
      });
      markersRef.current.push(dropoffMarker);
      bounds.extend(dropoffLocation);
    }

    // Add provider marker
    if (providerLocation) {
      console.log('Adding provider marker at', providerLocation);
      const providerMarker = new google.maps.Marker({
        position: providerLocation,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        title: "Service Provider"
      });
      markersRef.current.push(providerMarker);
      bounds.extend(providerLocation);
    }

    // Add consumer marker
    if (consumerLocation) {
      console.log('Adding consumer marker at', consumerLocation);
      const consumerMarker = new google.maps.Marker({
        position: consumerLocation,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        title: "Your Location"
      });
      markersRef.current.push(consumerMarker);
      bounds.extend(consumerLocation);
    }

    // If we have both pickup and dropoff and showing route is enabled
    if (showRoute && pickupLocation && dropoffLocation && directionsRendererRef.current) {
      console.log('Calculating route between pickup and dropoff');
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: pickupLocation,
          destination: dropoffLocation,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
            console.log('Route calculated successfully');
            directionsRendererRef.current.setDirections(result);
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    } else if (directionsRendererRef.current) {
      // Clear directions if we're not showing a route
      console.log('Clearing route directions');
      directionsRendererRef.current.setDirections({ 
        routes: [],
        geocoded_waypoints: [],
        request: { travelMode: google.maps.TravelMode.DRIVING } as any
      } as google.maps.DirectionsResult);
    }

    // Fit the map to the markers if we have any
    if (markersRef.current.length > 0) {
      console.log(`Fitting map to ${markersRef.current.length} markers`);
      map.fitBounds(bounds);
      
      // If only one marker, zoom in more
      if (markersRef.current.length === 1) {
        map.setZoom(15);
      }
    } else {
      // If no markers, center on a default location (India)
      console.log('No markers to fit, using default center');
      map.setCenter({ lat: 20.5937, lng: 78.9629 });
      map.setZoom(5);
    }
  };

  // Update markers and routes when locations change
  useEffect(() => {
    updateMarkersAndRoutes();
  }, [pickupLocation, dropoffLocation, providerLocation, consumerLocation, isLoaded, isLoading, showRoute]);

  if (isLoading || !isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 text-destructive p-4`}>
        <p className="text-center font-medium">Map could not be loaded</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return <div ref={mapRef} className={className}></div>;
}
