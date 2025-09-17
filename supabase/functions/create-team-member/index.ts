
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
    
    // Debug email sending conditions
    console.log("[CREATE-TEAM-MEMBER] Email sending debug:", {
      hasAuthHeader: !!authHeader,
      hasOrigin: !!origin,
      authHeaderValue: authHeader ? `${authHeader.substring(0, 20)}...` : 'null',
      originValue: origin || 'null'
    });
    
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
    
    // Get company info
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('subscription_status, stripe_subscription_id, stripe_customer_id, name')
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

    // Count current active users in the company (excluding this invitation)
    const { data: activeUsers, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (countError) {
      console.error("[CREATE-TEAM-MEMBER] Error counting active users:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to check company status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentActiveUserCount = activeUsers?.length || 0;
    const hasActiveSubscription = company.subscription_status === 'active' && company.stripe_subscription_id;

    console.log("[CREATE-TEAM-MEMBER] Company check:", {
      subscriptionStatus: company.subscription_status,
      hasActiveSubscription,
      stripeCustomerId: company.stripe_customer_id,
      stripeSubscriptionId: company.stripe_subscription_id,
      currentActiveUserCount
    });

    // If this will be the 2nd user (first team member besides admin) and no subscription exists, start checkout
    if (!hasActiveSubscription && currentActiveUserCount >= 1) {
      console.log("[CREATE-TEAM-MEMBER] Adding first team member - subscription required");
      
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
              teamSlots: 1, // Start with 1 slot for the admin
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
                message: "Setting up your subscription to add team members"
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
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error("[CREATE-TEAM-MEMBER] Error checking existing profile:", profileCheckError);
    }
    
    if (existingProfile) {
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
    
    // Parse name into first and last name for profile
    const { firstName, lastName } = parseFullName(name);
    
    // Handle department - either find existing or create new
    let departmentId = null;
    if (department && department.trim()) {
      // First try to find existing department
      const { data: existingDept } = await supabaseAdmin
        .from("departments")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", department.trim())
        .eq("is_active", true)
        .maybeSingle();
      
      if (existingDept) {
        departmentId = existingDept.id;
      } else {
        // Create new department
        const { data: newDept, error: deptError } = await supabaseAdmin
          .from("departments")
          .insert({
            name: department.trim(),
            company_id: companyId,
          })
          .select("id")
          .single();
        
        if (!deptError && newDept) {
          departmentId = newDept.id;
        }
      }
    }
    
    // Add user profile or update existing profile to add to company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        company_id: companyId,
        is_admin: false,
        role: role.toLowerCase(),
        department_id: departmentId,
        department: department || null, // Keep legacy field for backward compatibility
        points: 0, // New team members start with 0 points, get monthly allocation on first login
        monthly_points: 100, // Give initial monthly points
        invitation_status: 'invited', // Set initial status as invited
        temporary_password: password, // Store the generated password for resending invites
        is_active: true,
      })
      .select()
      .single();
    
    if (profileError) {
      console.error("[CREATE-TEAM-MEMBER] Error adding user profile:", profileError);
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
    
    console.log("[CREATE-TEAM-MEMBER] Checking email sending conditions:", {
      hasAuthHeader: !!authHeader,
      hasOrigin: !!origin,
      willSendEmail: !!(authHeader && origin)
    });
    
    if (authHeader && origin) {
      console.log("[CREATE-TEAM-MEMBER] Attempting to send invitation email...");
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
        emailError = error instanceof Error ? error.message : String(error);
        // Don't fail the entire operation if email fails
      }
    } else {
      console.log("[CREATE-TEAM-MEMBER] Email not sent - missing requirements:", {
        missingAuthHeader: !authHeader,
        missingOrigin: !origin
      });
      emailError = `Missing requirements: ${!authHeader ? 'authorization header' : ''} ${!origin ? 'origin' : ''}`.trim();
    }
    
    // Get updated member count using direct query
    const { count: memberCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    const finalMemberCount = memberCount || 0;
    
    // Return success response
    const response = {
      message: "Team member added successfully",
      userId,
      profile,
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
