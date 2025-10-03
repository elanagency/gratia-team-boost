import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getErrorMessage, createErrorResponse } from "../_shared/error-utils.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailServiceRequest {
  type: 'invitation' | 'welcome';
  to: string;
  toName: string;
  templateParams: {
    [key: string]: any;
  };
}

const getBrevoTemplateId = (type: string): number => {
  switch (type) {
    case 'invitation':
      return 8;  // Team member invitation template
    case 'welcome':
      return 5;  // Admin signup welcome template
    default:
      throw new Error(`Unsupported email type: ${type}`);
  }
};

const sendEmail = async (
  to: string, 
  toName: string, 
  templateId: number,
  templateParams: any
) => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    throw new Error("Email service not configured - missing Brevo API key");
  }

  console.log(`[EMAIL-SERVICE] Sending template ${templateId} to ${to}`);

  const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: {
        name: "Grattia Team",
        email: "noreply@grattia.com"
      },
      to: [
        {
          email: to,
          name: toName
        }
      ],
      templateId: templateId,
      params: templateParams
    }),
  });

  if (!brevoResponse.ok) {
    const errorData = await brevoResponse.text();
    console.error("[EMAIL-SERVICE] Brevo API error:", errorData);
    throw new Error(`Failed to send email: ${brevoResponse.status} ${errorData}`);
  }

  const brevoData = await brevoResponse.json();
  console.log("[EMAIL-SERVICE] Email sent successfully:", brevoData);
  return brevoData;
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EmailServiceRequest = await req.json();
    console.log("[EMAIL-SERVICE] Processing email request:", { 
      type: request.type, 
      to: request.to 
    });

    // Validate required fields
    if (!request.type || !request.to || !request.toName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: type, to, and toName are required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Brevo template ID for this email type
    const templateId = getBrevoTemplateId(request.type);

    // Send email using Brevo template
    const emailResult = await sendEmail(
      request.to,
      request.toName,
      templateId,
      request.templateParams || {}
    );

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.messageId,
        message: "Email sent successfully",
        type: request.type,
        templateId: templateId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[EMAIL-SERVICE] Error:", error);
    return createErrorResponse(error, "Failed to send email", 500, corsHeaders);
  }
});