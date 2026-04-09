/// <reference types="../deno.d.ts" />

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalPayload {
  userId: string
  status: 'approved' | 'rejected'
  reason?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get the request body
    const payload: ApprovalPayload = await req.json()

    // Update provider status
    const { data: providerData, error: providerError } = await supabaseClient
      .from('provider_details')
      .update({ 
        status: payload.status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', payload.userId)
      .select()
      .single()

    if (providerError) throw providerError

    // Get provider email
    const { data: provider } = await supabaseClient
      .from('provider_details')
      .select('email, full_name')
      .eq('user_id', payload.userId)
      .single()

    if (!provider) throw new Error('Provider not found')

    // Send notification to provider
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.status === 'approved' ? 'PROVIDER_APPROVED' : 'PROVIDER_REJECTED',
        message: payload.status === 'approved' 
          ? 'Your provider application has been approved! You can now start accepting bookings.'
          : `Your provider application has been rejected. Reason: ${payload.reason || 'Not specified'}`,
        seen: false,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        message: `Provider ${payload.status} successfully`,
        data: providerData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 