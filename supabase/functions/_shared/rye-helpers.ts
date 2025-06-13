
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to make GraphQL requests to Rye
export async function makeRyeRequest(query: string, variables: any = {}, headers: any) {
  console.log('=== RYE API REQUEST ===');
  console.log('Query:', query);
  console.log('Variables:', JSON.stringify(variables, null, 2));
  console.log('Headers (sanitized):', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers.Authorization ? '[PRESENT]' : '[MISSING]',
    'Rye-Shopper-IP': headers['Rye-Shopper-IP'] || '[MISSING]'
  });

  try {
    const response = await fetch('https://staging.graphql.api.rye.com/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.Authorization,
        'Rye-Shopper-IP': headers['Rye-Shopper-IP']
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log('=== RYE API RESPONSE STATUS ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('HTTP Error Response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error Response Body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('=== RYE API RESPONSE BODY ===');
    console.log('Full Response:', JSON.stringify(result, null, 2));
    
    if (result.errors && result.errors.length > 0) {
      console.error('=== RYE API GRAPHQL ERRORS ===');
      result.errors.forEach((error: any, index: number) => {
        console.error(`Error ${index + 1}:`, JSON.stringify(error, null, 2));
      });
      throw new Error(`Rye API error: ${result.errors[0].message}`);
    }
    
    console.log('=== RYE API SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== RYE API REQUEST FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export function getRyeHeaders() {
  const stagingHeadersJson = Deno.env.get('Staging_RYE_API_Key_Headers');
  if (!stagingHeadersJson) {
    throw new Error('Staging RYE API headers not configured');
  }
  
  let ryeHeaders;
  try {
    ryeHeaders = JSON.parse(stagingHeadersJson);
  } catch (parseError) {
    console.error('Error parsing staging headers JSON:', parseError);
    throw new Error('Invalid staging headers configuration');
  }
  
  if (!ryeHeaders.Authorization || !ryeHeaders['Rye-Shopper-IP']) {
    throw new Error('Missing required headers in staging configuration');
  }
  
  return ryeHeaders;
}
