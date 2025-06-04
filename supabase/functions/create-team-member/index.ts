
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
    const { name, email, companyId, role = "member", invitedBy } = await req.json();
    
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
      console.error("Error getting current member count:", countError);
    }

    const memberCountBeforeAdd = currentMembers?.length || 0;
    console.log("Current NON-ADMIN member count before adding:", memberCountBeforeAdd);
    
    // Check if user already exists
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("Error checking existing users:", userCheckError);
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
      console.log("User already exists with ID:", userId);
    } else {
      // Generate password for new user
      password = generateSecurePassword();
      console.log("Generated secure password");
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
        console.error("Error creating user:", createUserError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      userId = newUser.user.id;
      console.log("Created new user with ID:", userId);
    }
    
    // Check if user is already a member of this company
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from("company_members")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .maybeSingle();
    
    if (membershipCheckError) {
      console.error("Error checking existing membership:", membershipCheckError);
      // Continue anyway, as this might just be the first membership
    }
    
    if (existingMembership) {
      console.log("User is already a member of this company");
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
      console.error("Error adding user to company:", membershipError);
      return new Response(
        JSON.stringify({ error: "Failed to add user to company" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Added user to company successfully");
    
    // Get updated NON-ADMIN member count
    const { data: newMembers, error: newCountError } = await supabaseAdmin
      .from('company_members')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_admin', false);

    if (newCountError) {
      console.error("Error getting new member count:", newCountError);
    }

    const memberCountAfterAdd = newMembers?.length || 1; // Default to 1 if we can't count
    console.log("NON-ADMIN member count after adding:", memberCountAfterAdd);

    // Check if company has active subscription
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', companyId)
      .single();

    const hasActiveSubscription = company?.stripe_subscription_id && 
                                 company?.subscription_status === 'active';

    console.log("Company subscription status:", { 
      hasSubscription: !!company?.stripe_subscription_id,
      status: company?.subscription_status,
      hasActiveSubscription 
    });

    // If this is the first member and no active subscription, create checkout URL
    const needsBillingSetup = memberCountBeforeAdd === 0 && !hasActiveSubscription;
    let checkoutUrl = null;
    
    if (needsBillingSetup) {
      console.log("Creating checkout session for billing setup");
      try {
        const { data: checkoutData, error: checkoutError } = await supabaseAdmin.functions.invoke('create-subscription-checkout', {
          body: { 
            companyId,
            employeeCount: memberCountAfterAdd
          }
        });
        
        if (checkoutError) {
          console.error("Error creating checkout session:", checkoutError);
        } else {
          checkoutUrl = checkoutData?.url;
          console.log("Checkout URL created:", checkoutUrl);
        }
      } catch (checkoutErr) {
        console.error("Failed to create checkout session:", checkoutErr);
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        message: "Team member added successfully",
        userId,
        membership,
        isNewUser,
        memberCount: memberCountAfterAdd,
        needsBillingSetup,
        checkoutUrl,
        ...(isNewUser && password ? { password } : {}),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Error in create-team-member function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
      status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
