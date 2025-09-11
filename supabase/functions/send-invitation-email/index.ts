
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  name: string;
  companyName: string;
  isNewUser: boolean;
  password?: string;
  origin: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InvitationEmailRequest = await req.json();
    console.log("[SEND-INVITATION-EMAIL] Processing email for:", requestData.email);

    const { email, name, companyName, isNewUser, password, origin } = requestData;

    // Validate required fields
    if (!email || !name || !companyName || !origin) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, name, companyName, and origin are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For new users, password is required
    if (isNewUser && !password) {
      return new Response(
        JSON.stringify({
          error: "Password is required for new user invitations",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client for calling the email service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the centralized email service
    const { data, error } = await supabase.functions.invoke('email-service', {
      body: {
        type: 'invitation',
        to: email,
        toName: name,
        data: {
          companyName,
          isNewUser,
          password,
          origin,
          email // Pass email to template data
        }
      }
    });

    if (error) {
      console.error("[SEND-INVITATION-EMAIL] Email service error:", error);
      throw new Error(error.message || "Failed to send invitation email");
    }

    console.log("[SEND-INVITATION-EMAIL] Email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.messageId,
        message: "Invitation email sent successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[SEND-INVITATION-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send invitation email",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
