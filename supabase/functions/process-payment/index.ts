/// <reference types="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, paymentMethod } = await req.json();
    
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      }
    );
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log(`Processing payment for booking ${bookingId} by user ${user.id}`);
    
    // In a real implementation, we would process a payment through Stripe here
    // For now, we'll just update the booking status in the database
    
    // Use service role for admin operations (bypassing RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // First, check if the booking belongs to this user
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('consumer_id, provider_id, booking_status, price_estimate')
      .eq('id', bookingId)
      .single();
    
    if (bookingError) {
      throw new Error(`Booking fetch error: ${bookingError.message}`);
    }
    
    if (bookingData.consumer_id !== user.id) {
      throw new Error("Unauthorized: You don't have permission to process this payment");
    }
    
    if (bookingData.booking_status !== 'completed') {
      throw new Error("Booking must be completed before payment");
    }
    
    // Update booking payment status
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ 
        payment_status: 'completed',
        payment_method: paymentMethod
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log(`Payment for booking ${bookingId} marked as completed`);
    
    // Create a notification for the provider
    if (bookingData.provider_id) {
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: bookingData.provider_id,
            message: `Payment received for booking #${bookingId.substring(0, 8)}`,
            type: 'payment'
          });
        console.log(`Notification sent to provider ${bookingData.provider_id}`);
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
        // Non-critical error, don't throw
      }
    }
    
    // For demonstration purposes, we'll simulate a transaction ID
    const transactionId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment processed successfully",
        transactionId,
        booking: data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
