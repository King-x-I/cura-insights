
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use the provided test key from environment variables
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock_key_for_dev_only";

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, amount, serviceType, currency = "inr" } = await req.json();
    
    if (!bookingId || !amount || !serviceType) {
      throw new Error("Missing required parameters: bookingId, amount, serviceType");
    }
    
    console.log(`Creating payment intent: ${bookingId}, ${amount}, ${serviceType}, ${currency}`);
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );
    
    // Get booking details to verify it exists
    // Note: For test bookings, we'll skip the booking verification
    let booking = null;
    let consumerDetails = null;
    
    if (!bookingId.startsWith('test-')) {
      const { data: bookingData, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("*, consumer_details(*), provider_details(*)")
        .eq("id", bookingId)
        .maybeSingle();
        
      if (bookingError) {
        console.error("Error fetching booking:", bookingError);
        throw new Error("Error fetching booking details");
      }
      
      if (!bookingData) {
        throw new Error("Booking not found");
      }
      
      booking = bookingData;
      
      // For non-test bookings, ensure booking is completed
      if (booking.booking_status !== "completed" && booking.booking_status !== "in_progress") {
        throw new Error(`Booking must be completed or in progress before payment. Current status: ${booking.booking_status}`);
      }
      
      // Get consumer details for metadata
      const { data: consumerData } = await supabaseAdmin
        .from("consumer_details")
        .select("*")
        .eq("user_id", booking.consumer_id)
        .maybeSingle();
        
      consumerDetails = consumerData;
    }
    
    // Initialize Stripe with correct key
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Create payment intent with proper amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
      currency,
      metadata: {
        bookingId,
        serviceType,
        consumerId: booking?.consumer_id || 'test-consumer',
        providerId: booking?.provider_id || 'test-provider',
        consumerName: consumerDetails?.full_name || 'Test Consumer'
      },
      automatic_payment_methods: {
        enabled: true,
      }
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`);
    
    // Update booking with payment intent ID if this is a real booking
    if (booking) {
      await supabaseAdmin
        .from("bookings")
        .update({ 
          payment_intent_id: paymentIntent.id,
          payment_status: "pending" 
        })
        .eq("id", bookingId);
    }
      
    // Create a payment record
    const paymentData = {
      booking_id: bookingId,
      user_id: booking?.consumer_id || 'test-consumer',
      amount: amount,
      payment_status: "pending",
      payment_method: "stripe",
      transaction_id: paymentIntent.id
    };
    
    await supabaseAdmin
      .from("payments")
      .insert(paymentData);
    
    console.log("Payment record created successfully");
    
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create payment intent" 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
