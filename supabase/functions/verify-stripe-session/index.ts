
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-STRIPE-SESSION] ${step}${detailsStr}`);
};

// Generate a secure random password with specific requirements
function generateSecurePassword() {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  
  const password = [
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    numberChars[Math.floor(Math.random() * numberChars.length)],
  ];
  
  const allChars = uppercaseChars + lowercaseChars + numberChars;
  while (password.length < 8) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Processing session", { sessionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logStep("Retrieved session", { 
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Get pending member data from metadata
    const pendingMemberDataStr = session.metadata?.pending_member_data;
    if (!pendingMemberDataStr) {
      throw new Error("No pending member data found in session");
    }

    const memberData = JSON.parse(pendingMemberDataStr);
    logStep("Extracted member data", { email: memberData.email, name: memberData.name });

    // Initialize Supabase admin client
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

    // Check if user already exists
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      logStep("Error checking existing users", userCheckError);
      throw new Error("Failed to check if user already exists");
    }
    
    const userExists = existingUsers.users.some((user) => 
      user.email?.toLowerCase() === memberData.email.toLowerCase()
    );
    
    let userId: string;
    let isNewUser = false;
    let password: string | undefined;
    
    if (userExists) {
      const existingUser = existingUsers.users.find(
        (user) => user.email?.toLowerCase() === memberData.email.toLowerCase()
      );
      
      if (!existingUser?.id) {
        throw new Error("Found existing user but couldn't get ID");
      }
      
      userId = existingUser.id;
      logStep("User already exists", { userId });
    } else {
      // Generate password for new user
      password = generateSecurePassword();
      isNewUser = true;
      
      // Parse name into first and last name components
      const { firstName, lastName } = parseFullName(memberData.name);
      
      // Create user with admin API
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: memberData.email,
        password,
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
        },
      });
      
      if (createUserError || !newUser?.user) {
        logStep("Error creating user", createUserError);
        throw new Error("Failed to create user account");
      }
      
      userId = newUser.user.id;
      logStep("Created new user", { userId });
    }

    // Check if user is already a member of this company
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from("company_members")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", memberData.companyId)
      .maybeSingle();
    
    if (membershipCheckError) {
      logStep("Error checking existing membership", membershipCheckError);
    }
    
    if (existingMembership) {
      logStep("User is already a member of this company");
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
        company_id: memberData.companyId,
        user_id: userId,
        is_admin: false,
        role: memberData.role?.toLowerCase() || 'member',
      })
      .select()
      .single();
    
    if (membershipError) {
      logStep("Error adding user to company", membershipError);
      throw new Error("Failed to add user to company");
    }
    
    logStep("Added user to company successfully");

    // Update company subscription status if we have a subscription ID
    if (session.subscription) {
      const { error: updateError } = await supabaseAdmin
        .from('companies')
        .update({ 
          stripe_subscription_id: session.subscription,
          subscription_status: 'active'
        })
        .eq('id', memberData.companyId);
      
      if (updateError) {
        logStep("Error updating company subscription", updateError);
        // Don't throw here, member was created successfully
      } else {
        logStep("Updated company subscription status");
      }
    }

    // Record subscription event for billing history
    const amountPaid = session.amount_total || 0; // Amount in cents
    const currentMemberCount = 1; // This is for adding 1 member
    
    const { error: subscriptionEventError } = await supabaseAdmin
      .from('subscription_events')
      .insert({
        company_id: memberData.companyId,
        event_type: 'member_added',
        previous_quantity: 0, // We don't track previous count in this context
        new_quantity: currentMemberCount,
        amount_charged: amountPaid,
        stripe_invoice_id: sessionId, // Use session ID as reference
        metadata: {
          session_id: sessionId,
          member_email: memberData.email,
          member_name: memberData.name,
          member_role: memberData.role || 'member',
          payment_method: 'stripe_checkout'
        }
      });

    if (subscriptionEventError) {
      logStep("Error creating subscription event", subscriptionEventError);
      // Don't throw here, member was created successfully
    } else {
      logStep("Created subscription event for billing history", { 
        amount: amountPaid, 
        memberCount: currentMemberCount 
      });
    }

    const response = {
      message: "Team member created successfully after payment verification",
      userId,
      membership,
      isNewUser,
      sessionId,
      ...(isNewUser && password ? { password } : {}),
    };

    logStep("Verification completed successfully", {
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
    logStep("Error in verify-stripe-session function", { error: error.message });
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to verify session and create member" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
