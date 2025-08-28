
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
    const { members, companyId, invitedBy } = await req.json();
    
    // Validate required inputs
    if (!members || !Array.isArray(members) || !companyId || !invitedBy) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: members (array), companyId, and invitedBy are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[BULK-CREATE-TEAM-MEMBERS] Starting with data:", { 
      memberCount: members.length, 
      companyId, 
      invitedBy 
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
    
    // Check company's team slots availability
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('team_slots')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error("[BULK-CREATE-TEAM-MEMBERS] Error fetching company:", companyError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch company information" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current used slots
    const { data: usedSlots, error: slotsError } = await supabaseAdmin
      .rpc('get_used_team_slots', { company_id: companyId });

    if (slotsError) {
      console.error("[BULK-CREATE-TEAM-MEMBERS] Error getting used slots:", slotsError);
      return new Response(
        JSON.stringify({ error: "Failed to check team slot availability" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentUsedSlots = usedSlots || 0;
    const availableSlots = company.team_slots || 0;
    const remainingSlots = availableSlots - currentUsedSlots;

    console.log("[BULK-CREATE-TEAM-MEMBERS] Slot check:", {
      availableSlots,
      currentUsedSlots,
      remainingSlots,
      requestedMembers: members.length
    });

    // Check if there are enough slots
    if (members.length > remainingSlots) {
      return new Response(
        JSON.stringify({
          error: `Not enough team slots. You have ${remainingSlots} slots available but trying to add ${members.length} members.`,
          availableSlots: remainingSlots,
          requestedSlots: members.length
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get existing users to check for duplicates
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("[BULK-CREATE-TEAM-MEMBERS] Error checking existing users:", userCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const existingEmails = new Set(existingUsers.users.map(user => user.email?.toLowerCase()));
    
    // Check existing company memberships
    const memberEmails = members.map(m => m.email.toLowerCase());
    const { data: existingMemberships, error: membershipError } = await supabaseAdmin
      .from("company_members")
      .select("user_id")
      .eq("company_id", companyId);
    
    if (membershipError) {
      console.error("[BULK-CREATE-TEAM-MEMBERS] Error checking memberships:", membershipError);
    }

    // Get user IDs for existing memberships to check emails
    const existingMemberUserIds = existingMemberships?.map(m => m.user_id) || [];
    const existingMemberEmails = new Set<string>();
    
    if (existingMemberUserIds.length > 0) {
      for (const userId of existingMemberUserIds) {
        const existingUser = existingUsers.users.find(u => u.id === userId);
        if (existingUser?.email) {
          existingMemberEmails.add(existingUser.email.toLowerCase());
        }
      }
    }
    
    // Process each member
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const member of members) {
      const { name, email, department, role = "member" } = member;
      const lowerEmail = email.toLowerCase();
      
      try {
        // Check if already a member of this company
        if (existingMemberEmails.has(lowerEmail)) {
          results.push({
            name,
            email,
            success: false,
            error: "User is already a member of this company"
          });
          failureCount++;
          continue;
        }
        
        let userId: string;
        let isNewUser = false;
        let password: string | undefined;
        
        if (existingEmails.has(lowerEmail)) {
          // Find the existing user's ID
          const existingUser = existingUsers.users.find(
            (user) => user.email?.toLowerCase() === lowerEmail
          );
          
          if (!existingUser?.id) {
            results.push({
              name,
              email,
              success: false,
              error: "Found existing user but couldn't get ID"
            });
            failureCount++;
            continue;
          }
          
          userId = existingUser.id;
          console.log("[BULK-CREATE-TEAM-MEMBERS] Using existing user:", userId);
        } else {
          // Generate password for new user
          password = generateSecurePassword();
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
            console.error("[BULK-CREATE-TEAM-MEMBERS] Error creating user:", createUserError);
            results.push({
              name,
              email,
              success: false,
              error: "Failed to create user account"
            });
            failureCount++;
            continue;
          }
          
          userId = newUser.user.id;
          console.log("[BULK-CREATE-TEAM-MEMBERS] Created new user:", userId);
        }
        
        // Add user as a NON-ADMIN member of the company
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from("company_members")
          .insert({
            company_id: companyId,
            user_id: userId,
            is_admin: false,
            role: role.toLowerCase(),
            department: department || null,
          })
          .select()
          .single();
        
        if (membershipError) {
          console.error("[BULK-CREATE-TEAM-MEMBERS] Error adding user to company:", membershipError);
          results.push({
            name,
            email,
            success: false,
            error: "Failed to add user to company"
          });
          failureCount++;
          continue;
        }
        
        results.push({
          name,
          email,
          success: true,
          isNewUser,
          userId,
          ...(isNewUser && password ? { password } : {}),
        });
        successCount++;
        
      } catch (error) {
        console.error("[BULK-CREATE-TEAM-MEMBERS] Error processing member:", error);
        results.push({
          name,
          email,
          success: false,
          error: "Internal error processing member"
        });
        failureCount++;
      }
    }
    
    console.log("[BULK-CREATE-TEAM-MEMBERS] Processing complete:", {
      total: members.length,
      successCount,
      failureCount
    });
    
    // Return results
    return new Response(
      JSON.stringify({
        successCount,
        failureCount,
        total: members.length,
        results,
        message: `Processed ${members.length} members: ${successCount} successful, ${failureCount} failed`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("[BULK-CREATE-TEAM-MEMBERS] Error in bulk-create-team-members function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
