
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Get the authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: {
      headers: { Authorization: authHeader },
    },
  });
  
  try {
    // Get the current user to verify they're a platform admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if current user is platform admin
    const { data: currentUserProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile?.is_platform_admin) {
      return new Response(JSON.stringify({ error: "Not authorized to add platform admins" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Get email from request
    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Use the supabase-js admin client to find user by email
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    // Find user with the specified email
    const targetUser = users.users.find(u => u.email === email);
    
    if (!targetUser) {
      return new Response(JSON.stringify({ error: "User with this email does not exist" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check if user is already a platform admin
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', targetUser.id)
      .single();

    if (checkError) {
      console.error('Error checking existing profile:', checkError);
      return new Response(JSON.stringify({ error: "Failed to check user profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (existingProfile?.is_platform_admin) {
      return new Response(JSON.stringify({ error: "User is already a platform admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Update the user's profile to make them a platform admin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_platform_admin: true })
      .eq('id', targetUser.id);

    if (updateError) {
      console.error('Error updating platform admin status:', updateError);
      throw updateError;
    }
    
    return new Response(JSON.stringify({ 
      message: "Platform admin added successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in add-platform-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
