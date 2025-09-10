
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const generateEmailContent = (data: InvitationEmailRequest) => {
  const { name, companyName, isNewUser, email, password, origin } = data;
  
  const subject = isNewUser 
    ? `Welcome to ${companyName} - Your Account Details`
    : `You've been invited to join ${companyName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #0F0533 0%, #1a0a4a 100%); color: white; padding: 40px 20px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 20px; }
        .welcome-message { font-size: 24px; color: #0F0533; margin-bottom: 20px; font-weight: 600; }
        .credentials-box { background-color: #f8f9fa; border: 2px solid #F572FF; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #0F0533; }
        .credential-value { font-family: 'Courier New', monospace; background-color: #e9ecef; padding: 5px 8px; border-radius: 4px; margin-left: 10px; }
        .cta-button { display: inline-block; background-color: #F572FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .cta-button:hover { background-color: #E061EE; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .highlight { color: #F572FF; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Grattia</div>
          <p>Employee Recognition Platform</p>
        </div>
        
        <div class="content">
          <h1 class="welcome-message">Hello ${name}!</h1>
          
          ${isNewUser && password ? `
            <p>Welcome to <span class="highlight">${companyName}</span>! We're excited to have you join our team recognition platform.</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
          ` : `
            <p>Great news! You've been invited to join <span class="highlight">${companyName}</span> on Grattia, our employee recognition platform.</p>
            <p>You can now log in using your existing account credentials and start participating in team recognition activities.</p>
          `}
          
          <p>Click the button below to access the platform:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${origin}/login" class="cta-button">Access Grattia Platform</a>
          </div>
          
          <p>Once you log in, you'll be able to:</p>
          <ul>
            <li>Give and receive recognition points</li>
            <li>Participate in team activities</li>
            <li>Redeem points for rewards</li>
            <li>View team leaderboards</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to your team administrator.</p>
          
          <p>Welcome to the team!</p>
          <p><strong>The Grattia Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This email was sent by Grattia on behalf of ${companyName}</p>
          <p>If you didn't expect this email, please contact your team administrator</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
};

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

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("[SEND-INVITATION-EMAIL] Brevo API key not found");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate email content
    const { subject, htmlContent } = generateEmailContent(requestData);

    // Send email via Brevo API
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
            email: email,
            name: name
          }
        ],
        subject: subject,
        htmlContent: htmlContent,
        tags: ["team-invitation", companyName.toLowerCase().replace(/\s+/g, '-')]
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error("[SEND-INVITATION-EMAIL] Brevo API error:", errorData);
      throw new Error(`Failed to send email: ${brevoResponse.status} ${errorData}`);
    }

    const brevoData = await brevoResponse.json();
    console.log("[SEND-INVITATION-EMAIL] Email sent successfully:", brevoData);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: brevoData.messageId,
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
