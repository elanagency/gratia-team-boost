
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate a secure random password with specific requirements
function generateSecurePassword() {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  
  // Ensure we have at least one of each required character type
  const password = [
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    numberChars[Math.floor(Math.random() * numberChars.length)],
  ];
  
  // Fill the rest of the password (to make it 8 chars)
  const allChars = uppercaseChars + lowercaseChars + numberChars;
  while (password.length < 8) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the password characters
  return password.sort(() => Math.random() - 0.5).join("");
}

// Parse first and last name from full name
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "" };
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");
  
  return { firstName, lastName };
}

// Send invitation email
async function sendInvitationEmail(emailData: {
  email: string;
  name: string;
  companyName: string;
  isNewUser: boolean;
  password?: string;
  origin: string;
}, authHeader: string) {
  try {
    console.log("[CREATE-TEAM-MEMBER] Sending invitation email to:", emailData.email);
    
    const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'apikey': Deno.env.get("SUPABASE_ANON_KEY") || "",
      },
      body: JSON.stringify(emailData)
    });
    
    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("[CREATE-TEAM-MEMBER] Email sending failed:", errorData);
      throw new Error(`Failed to send invitation email: ${emailResponse.status}`);
    }
    
    const emailResult = await emailResponse.json();
    console.log("[CREATE-TEAM-MEMBER] Invitation email sent successfully:", emailResult);
    return emailResult;
  } catch (error) {
    console.error("[CREATE-TEAM-MEMBER] Error sending invitation email:", error);
    throw error;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { name, email, department, companyId, role = "member", invitedBy, origin } = await req.json();
    
    // Validate required inputs
    if (!name || !email || !companyId || !invitedBy) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: name, email, companyId, and invitedBy are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[CREATE-TEAM-MEMBER] Starting with data:", { name, email, companyId, role, origin });

    // Get the original authorization header to pass it along
    const authHeader = req.headers.get("Authorization");
    
    // Initialize Supabase admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Get company info and check current team member count
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('subscription_status, stripe_subscription_id, name')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error("[CREATE-TEAM-MEMBER] Error fetching company:", companyError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch company information" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current team member count (non-admin members)
    const { data: currentMembers, error: membersError } = await supabaseAdmin
      .rpc('get_used_team_slots', { company_id: companyId });

    if (membersError) {
      console.error("[CREATE-TEAM-MEMBER] Error getting current team members:", membersError);
      return new Response(
        JSON.stringify({ error: "Failed to check current team members" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentMemberCount = currentMembers || 0;
    const isFirstMember = currentMemberCount === 0;

    console.log("[CREATE-TEAM-MEMBER] Team member check:", {
      currentMemberCount,
      isFirstMember,
      hasSubscription: !!company.stripe_subscription_id
    });

    // If this is the first member and no subscription exists, create one
    if (isFirstMember && !company.stripe_subscription_id) {
      console.log("[CREATE-TEAM-MEMBER] First team member - creating subscription");
      
      if (authHeader) {
        try {
          // Store member data for creation after payment
          const memberData = { name, email, department, companyId, role, invitedBy };
          
          const checkoutResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/create-subscription-checkout`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
              'apikey': Deno.env.get("SUPABASE_ANON_KEY") || "",
            },
            body: JSON.stringify({ 
              companyId,
              teamSlots: 1, // Start with 1 for usage-based billing
              memberData,
              origin
            })
          });
          
          if (checkoutResponse.ok) {
            const checkoutData = await checkoutResponse.json();
            console.log("[CREATE-TEAM-MEMBER] Subscription checkout URL created:", checkoutData?.url);
            
            return new Response(
              JSON.stringify({
                needsBillingSetup: true,
                checkoutUrl: checkoutData?.url,
                message: "Setting up your subscription for the first team member"
              }),
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } else {
            throw new Error("Failed to create subscription checkout session");
          }
        } catch (checkoutErr) {
          console.error("[CREATE-TEAM-MEMBER] Failed to create subscription checkout:", checkoutErr);
          return new Response(
            JSON.stringify({ 
              error: "Failed to setup subscription. Please try again.",
              needsBillingSetup: true 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }
    
    // Continue with normal member creation (slots are available)
    
    // Check if user already exists
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("[CREATE-TEAM-MEMBER] Error checking existing users:", userCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to check if user already exists" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const userExists = existingUsers.users.some((user) => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    let userId: string;
    let isNewUser = false;
    let password: string | undefined;
    
    if (userExists) {
      // Find the existing user's ID
      const existingUser = existingUsers.users.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (!existingUser?.id) {
        return new Response(
          JSON.stringify({ error: "Found existing user but couldn't get ID" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      userId = existingUser.id;
      console.log("[CREATE-TEAM-MEMBER] User already exists with ID:", userId);
    } else {
      // Generate password for new user
      password = generateSecurePassword();
      console.log("[CREATE-TEAM-MEMBER] Generated secure password for new user");
      isNewUser = true;
      
      // Parse name into first and last name components
      const { firstName, lastName } = parseFullName(name);
      
      // Create user with admin API
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          firstName,
          lastName,
        },
      });
      
      if (createUserError || !newUser?.user) {
        console.error("[CREATE-TEAM-MEMBER] Error creating user:", createUserError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      userId = newUser.user.id;
      console.log("[CREATE-TEAM-MEMBER] Created new user with ID:", userId);
    }
    
    // Check if user is already a member of this company
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from("company_members")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .maybeSingle();
    
    if (membershipCheckError) {
      console.error("[CREATE-TEAM-MEMBER] Error checking existing membership:", membershipCheckError);
    }
    
    if (existingMembership) {
      console.log("[CREATE-TEAM-MEMBER] User is already a member of this company");
      return new Response(
        JSON.stringify({
          message: "User is already a member of this company",
          userId,
          alreadyMember: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Add user as a NON-ADMIN member of the company with 100 initial points
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: userId,
        is_admin: false,
        role: role.toLowerCase(),
        department: department || null,
        points: 100, // Give new team members 100 initial points
      })
      .select()
      .single();
    
    if (membershipError) {
      console.error("[CREATE-TEAM-MEMBER] Error adding user to company:", membershipError);
      return new Response(
        JSON.stringify({ error: "Failed to add user to company" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("[CREATE-TEAM-MEMBER] Added user to company successfully");

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    
    if (authHeader && origin) {
      try {
        await sendInvitationEmail({
          email,
          name,
          companyName: company.name,
          isNewUser,
          password: isNewUser ? password : undefined,
          origin
        }, authHeader);
        emailSent = true;
        console.log("[CREATE-TEAM-MEMBER] Invitation email sent successfully");
      } catch (error) {
        console.error("[CREATE-TEAM-MEMBER] Failed to send invitation email:", error);
        emailError = error.message;
        // Don't fail the entire operation if email fails
      }
    }
    
    // Get updated member count
    const { data: newMemberCount } = await supabaseAdmin
      .rpc('get_used_team_slots', { company_id: companyId });

    const finalMemberCount = newMemberCount || (currentMemberCount + 1);
    
    // Return success response
    const response = {
      message: "Team member added successfully",
      userId,
      membership,
      isNewUser,
      memberCount: finalMemberCount,
      needsBillingSetup: false,
      emailSent,
      emailError,
      // Don't include password in response since it's sent via email
    };

    console.log("[CREATE-TEAM-MEMBER] Final response:", {
      ...response,
      password: password ? "[SENT_VIA_EMAIL]" : undefined
    });
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("[CREATE-TEAM-MEMBER] Error in create-team-member function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
