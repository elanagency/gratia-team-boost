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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { name, email, companyId, role = "member", invitedBy, origin } = await req.json();
    
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
    
    // Get current NON-ADMIN member count before adding new member
    const { data: currentMembers, error: countError } = await supabaseAdmin
      .from('company_members')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_admin', false);

    if (countError) {
      console.error("[CREATE-TEAM-MEMBER] Error getting current member count:", countError);
    }

    const memberCountBeforeAdd = currentMembers?.length || 0;
    console.log("[CREATE-TEAM-MEMBER] Current NON-ADMIN member count before adding:", memberCountBeforeAdd);
    
    // Check if company has active subscription
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', companyId)
      .single();

    const hasActiveSubscription = company?.stripe_subscription_id && 
                                 company?.subscription_status === 'active';

    console.log("[CREATE-TEAM-MEMBER] Company subscription status:", { 
      hasSubscription: !!company?.stripe_subscription_id,
      status: company?.subscription_status,
      hasActiveSubscription 
    });

    // If this is the first member and no active subscription, return checkout URL without creating member
    const needsBillingSetup = memberCountBeforeAdd === 0 && !hasActiveSubscription;
    
    console.log("[CREATE-TEAM-MEMBER] Billing setup decision:", {
      memberCountBeforeAdd,
      hasActiveSubscription,
      needsBillingSetup
    });
    
    if (needsBillingSetup && authHeader) {
      console.log("[CREATE-TEAM-MEMBER] First member requires billing setup - creating checkout session");
      try {
        // Store member data temporarily in session storage via metadata
        const memberData = {
          name,
          email,
          companyId,
          role,
          invitedBy
        };
        
        // Make a direct HTTP request to the checkout function with proper auth headers
        const checkoutResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/create-subscription-checkout`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get("SUPABASE_ANON_KEY") || "",
          },
          body: JSON.stringify({ 
            companyId,
            employeeCount: 1,
            memberData, // Pass member data to be stored in checkout metadata
            origin // Pass the origin for proper redirect URLs
          })
        });
        
        if (checkoutResponse.ok) {
          const checkoutData = await checkoutResponse.json();
          console.log("[CREATE-TEAM-MEMBER] Checkout URL created successfully:", checkoutData?.url);
          
          return new Response(
            JSON.stringify({
              needsBillingSetup: true,
              checkoutUrl: checkoutData?.url,
              message: "Billing setup required before adding team member"
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          const errorText = await checkoutResponse.text();
          console.error("[CREATE-TEAM-MEMBER] Error creating checkout session:", errorText);
          throw new Error("Failed to create billing setup");
        }
      } catch (checkoutErr) {
        console.error("[CREATE-TEAM-MEMBER] Failed to create checkout session:", checkoutErr);
        throw new Error("Failed to create billing setup");
      }
    }
    
    // Continue with normal member creation (either not first member or has active subscription)
    
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
      // Continue anyway, as this might just be the first membership
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
    
    // Add user as a NON-ADMIN member of the company
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: userId,
        is_admin: false, // Explicitly set as non-admin
        role: role.toLowerCase(),
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
    
    // Get updated NON-ADMIN member count
    const { data: newMembers, error: newCountError } = await supabaseAdmin
      .from('company_members')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_admin', false);

    if (newCountError) {
      console.error("[CREATE-TEAM-MEMBER] Error getting new member count:", newCountError);
    }

    const memberCountAfterAdd = newMembers?.length || 1; // Default to 1 if we can't count
    console.log("[CREATE-TEAM-MEMBER] NON-ADMIN member count after adding:", memberCountAfterAdd);
    
    // Return success response
    const response = {
      message: "Team member added successfully",
      userId,
      membership,
      isNewUser,
      memberCount: memberCountAfterAdd,
      needsBillingSetup: false,
      ...(isNewUser && password ? { password } : {}),
    };

    console.log("[CREATE-TEAM-MEMBER] Final response:", {
      ...response,
      password: password ? "[REDACTED]" : undefined
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
