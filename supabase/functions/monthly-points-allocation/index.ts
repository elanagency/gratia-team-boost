import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting monthly points allocation process...');

    // Get all companies with active subscriptions
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, billing_cycle_anchor, stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      throw companiesError;
    }

    console.log(`Found ${companies?.length || 0} companies with subscriptions`);

    let totalAllocations = 0;
    const results = [];

    // Process each company
    for (const company of companies || []) {
      console.log(`Processing company: ${company.name} (ID: ${company.id})`);

      // Check if this company needs monthly allocation today
      const { data: shouldAllocate, error: checkError } = await supabase
        .rpc('should_allocate_monthly_points', { target_company_id: company.id });

      if (checkError) {
        console.error(`Error checking allocation for company ${company.id}:`, checkError);
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: 'error',
          error: checkError.message,
          allocations: 0
        });
        continue;
      }

      if (!shouldAllocate) {
        console.log(`Company ${company.name} does not need allocation today`);
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: 'skipped',
          reason: 'Not billing day or already allocated this month',
          allocations: 0
        });
        continue;
      }

      // Allocate monthly points
      const { data: allocations, error: allocationError } = await supabase
        .rpc('allocate_monthly_points', { target_company_id: company.id });

      if (allocationError) {
        console.error(`Error allocating points for company ${company.id}:`, allocationError);
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: 'error',
          error: allocationError.message,
          allocations: 0
        });
        continue;
      }

      console.log(`Successfully allocated points to ${allocations} members in company ${company.name}`);
      totalAllocations += allocations || 0;
      
      results.push({
        companyId: company.id,
        companyName: company.name,
        status: 'success',
        allocations: allocations || 0
      });
    }

    const response = {
      success: true,
      totalCompaniesProcessed: companies?.length || 0,
      totalAllocations,
      results,
      timestamp: new Date().toISOString()
    };

    console.log('Monthly allocation process completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in monthly-points-allocation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});