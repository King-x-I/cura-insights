
/// <reference types="@types/google.maps" />

// Extend the Window interface to include Google Maps
interface Window {
  google?: {
    maps: typeof google.maps;
  };
}

// This ensures the TypeScript compiler knows about the Google Maps API
