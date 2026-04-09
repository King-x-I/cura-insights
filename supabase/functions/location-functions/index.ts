
// Import dependencies directly from the Deno standard library
import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handler for location tracking functions
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      const { action, data } = await req.json();
      console.log(`Handling ${action} request:`, data);

      switch (action) {
        case "insert_location":
          return await handleInsertLocation(supabaseAdmin, data, corsHeaders);
        case "get_location":
          return await handleGetLocation(supabaseAdmin, data, corsHeaders);
        default:
          return new Response(
            JSON.stringify({ error: "Invalid action" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
      }
    } catch (error) {
      console.error("Error in location tracking function:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error occurred" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Handler for inserting location data
async function handleInsertLocation(supabase: any, data: any, corsHeaders: any): Promise<Response> {
  const { user_id, booking_id, latitude, longitude, accuracy } = data;
  
  if (!user_id || !booking_id || !latitude || !longitude) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const { data: insertData, error } = await supabase
    .from("location_tracking")
    .upsert({
      user_id,
      booking_id,
      latitude,
      longitude,
      accuracy,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,booking_id",
    });

  if (error) {
    console.error("Error inserting location data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: insertData }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

// Handler for getting location data
async function handleGetLocation(supabase: any, data: any, corsHeaders: any): Promise<Response> {
  const { user_id, booking_id } = data;
  
  if (!user_id || !booking_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const { data: locationData, error } = await supabase
    .from("location_tracking")
    .select("*")
    .eq("user_id", user_id)
    .eq("booking_id", booking_id)
    .single();

  if (error && error.code !== "PGRST116") { // Not found is acceptable
    console.error("Error getting location data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: locationData }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

// Start the server
serve(handler);
