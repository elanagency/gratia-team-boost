import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getErrorMessage, createErrorResponse } from "../_shared/error-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  companyName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, companyName }: WelcomeEmailRequest = await req.json();
    
    console.log("[SEND-WELCOME-EMAIL] Processing welcome email for:", email);

    // Validate required fields
    if (!email || !firstName || !companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, firstName, and companyName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the centralized email service with Brevo template ID 5
    const { data, error } = await supabase.functions.invoke('email-service', {
      body: {
        type: 'welcome',
        to: email,
        toName: firstName,
        templateParams: {
          fname: firstName,
          company_name: companyName
        }
      }
    });

    if (error) {
      console.error("[SEND-WELCOME-EMAIL] Email service error:", error);
      throw new Error(error.message || "Failed to send welcome email");
    }

    console.log("[SEND-WELCOME-EMAIL] Welcome email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.messageId,
        message: "Welcome email sent successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[SEND-WELCOME-EMAIL] Error:", error);
    return createErrorResponse(error, "Failed to send welcome email", 500, corsHeaders);
  }
});
