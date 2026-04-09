import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailTemplateType = 
  | "provider-application" 
  | "provider-approved" 
  | "provider-rejected" 
  | "booking-confirmation" 
  | "payment-receipt";

interface EmailRequest {
  to: string | string[];
  subject: string;
  templateType: EmailTemplateType;
  templateData: Record<string, any>;
}

const renderTemplate = (templateType: EmailTemplateType, data: Record<string, any>): string => {
  switch (templateType) {
    case "provider-application":
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1>Application Received</h1><p>Dear ${data.name}, thank you for applying as a ${data.serviceType} provider with Cura.</p></div>`;
    case "provider-approved":
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: green;">Application Approved!</h1><p>Dear ${data.name}, your application has been approved. You can now start accepting service requests.</p></div>`;
    case "provider-rejected":
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1>Application Status Update</h1><p>Dear ${data.name}, we regret to inform you that your application was not approved at this time.</p></div>`;
    case "booking-confirmation":
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1>Booking Confirmed</h1><p>Dear ${data.userName}, your ${data.serviceType} booking is confirmed for ${data.dateTime}.</p></div>`;
    case "payment-receipt":
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1>Payment Receipt</h1><p>Dear ${data.userName}, payment of ₹${data.amount} received. Transaction ID: ${data.transactionId}</p></div>`;
    default:
      return `<div><p>${data.message || "Notification from Cura."}</p></div>`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, templateType, templateData } = await req.json() as EmailRequest;
    
    if (!to || !subject || !templateType) {
      throw new Error("Missing required fields: to, subject, templateType");
    }
    
    const html = renderTemplate(templateType, templateData);
    
    // Log the email for now - in production, integrate with an email service
    console.log(`Email to: ${to}, Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Email processed successfully",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to process email"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
