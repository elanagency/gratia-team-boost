import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDepartmentRequest {
  name: string;
  companyId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { name, companyId }: CreateDepartmentRequest = await req.json();

    if (!name || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Name and company ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user is admin of the company
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, company_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin || profile.company_id !== companyId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Must be company admin' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the department
    const { data: department, error: createError } = await supabase
      .from('departments')
      .insert({
        name: name.trim(),
        company_id: companyId,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'A department with this name already exists' }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('Error creating department:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create department' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        department 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});