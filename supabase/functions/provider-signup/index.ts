/// <reference types="../deno.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ProviderSignupPayload {
  userId: string
  email: string
  fullName: string
  phone: string
  address: string
  serviceType: string
  experienceYears: number
  skills: string
  govtIdUrl: string
  licenseUrl: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const payload: ProviderSignupPayload = await req.json()

    // Create provider details record
    const { data: providerData, error: providerError } = await supabaseClient
      .from('provider_details')
      .insert({
        user_id: payload.userId,
        email: payload.email,
        full_name: payload.fullName,
        phone: payload.phone,
        address: payload.address,
        service_type: payload.serviceType,
        experience_years: payload.experienceYears,
        skills: payload.skills,
        govt_id_url: payload.govtIdUrl,
        license_url: payload.licenseUrl,
        status: 'pending',
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (providerError) throw providerError

    // Send notification to admin
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: null, // Admin notification
        type: 'PROVIDER_SIGNUP',
        message: `New provider signup request from ${payload.fullName}`,
        seen: false,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        message: 'Provider signup successful',
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