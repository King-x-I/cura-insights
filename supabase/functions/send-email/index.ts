
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

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
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Application Received</h1>
          <p>Dear ${data.name},</p>
          <p>Thank you for applying to be a service provider with Cura. We have received your application and it is currently being reviewed by our team.</p>
          <p>Here's a summary of your application:</p>
          <ul>
            <li><strong>Service Type:</strong> ${data.serviceType}</li>
            <li><strong>Experience:</strong> ${data.experience} years</li>
            <li><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>We'll notify you as soon as your application is approved. This typically takes 1-2 business days.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
    
    case "provider-approved":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #008000; font-size: 24px; margin-bottom: 20px;">Application Approved!</h1>
          <p>Dear ${data.name},</p>
          <p>We're pleased to inform you that your application to be a service provider with Cura has been <strong>approved</strong>!</p>
          <p>You can now log in to your account and start accepting service requests.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${data.loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In Now</a>
          </div>
          <p>Here's what to do next:</p>
          <ol>
            <li>Log in to your account</li>
            <li>Complete your profile if needed</li>
            <li>Set your availability status to "Online"</li>
            <li>Start receiving service requests!</li>
          </ol>
          <p>Welcome to the Cura family! We're excited to have you on board.</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
    
    case "provider-rejected":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #d32f2f; font-size: 24px; margin-bottom: 20px;">Application Status Update</h1>
          <p>Dear ${data.name},</p>
          <p>Thank you for your interest in becoming a service provider with Cura.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
          <p>This could be due to one of the following reasons:</p>
          <ul>
            <li>Incomplete or insufficient documentation</li>
            <li>Experience requirements not met</li>
            <li>High volume of applications in your area</li>
          </ul>
          <p>You're welcome to apply again after 30 days with updated information.</p>
          <p>If you believe this decision was made in error or would like more specific feedback, please contact our support team.</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
    
    case "booking-confirmation":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #1976d2; font-size: 24px; margin-bottom: 20px;">Booking Confirmation</h1>
          <p>Dear ${data.userName},</p>
          <p>Your booking has been confirmed! Here are the details:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Service Type:</strong> ${data.serviceType}</p>
            <p><strong>Date & Time:</strong> ${data.dateTime}</p>
            <p><strong>Pickup Location:</strong> ${data.pickupLocation}</p>
            ${data.dropLocation ? `<p><strong>Drop Location:</strong> ${data.dropLocation}</p>` : ''}
            ${data.estimatedCost ? `<p><strong>Estimated Cost:</strong> ₹${data.estimatedCost}</p>` : ''}
          </div>
          ${data.providerName ? `
            <p><strong>Service Provider:</strong> ${data.providerName}</p>
            ${data.providerPhone ? `<p><strong>Contact:</strong> ${data.providerPhone}</p>` : ''}
          ` : '<p>A service provider will be assigned to you shortly.</p>'}
          <p>You can track your booking status in the app.</p>
          <p>Thank you for choosing Cura!</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
    
    case "payment-receipt":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Payment Receipt</h1>
          <p>Dear ${data.userName},</p>
          <p>Thank you for your payment. Here's your receipt:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Service Type:</strong> ${data.serviceType}</p>
            <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
            <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          <p>This receipt serves as confirmation of your payment.</p>
          <p>Thank you for choosing Cura!</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
    
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Cura Notification</h1>
          <p>Hello,</p>
          <p>${data.message || "This is a notification from Cura."}</p>
          <p>Best regards,<br/>The Cura Team</p>
        </div>
      `;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, templateType, templateData } = await req.json() as EmailRequest;
    
    console.log(`Sending ${templateType} email to:`, to);
    console.log("Template data:", templateData);
    
    if (!to || !subject || !templateType) {
      throw new Error("Missing required fields: to, subject, templateType");
    }
    
    const html = renderTemplate(templateType, templateData);
    
    const { data, error } = await resend.emails.send({
      from: "Cura <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html
    });
    
    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    console.log("Email sent successfully:", data);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      data
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to send email"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
