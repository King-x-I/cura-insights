
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (_req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (_req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Google Maps API key from environment variables
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables');
      throw new Error('Google Maps API key not found in environment variables');
    }

    console.log('Successfully retrieved Google Maps API key');
    
    return new Response(
      JSON.stringify({ apiKey }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error getting Google Maps API key:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
        status: 500 
      }
    );
  }
};

serve(handler);
