import { corsHeaders } from '../_shared/cors.ts';

const GIPHY_API_KEY = Deno.env.get('GIPHY_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, limit = 20, offset = 0 } = await req.json();

    let giphyUrl: string;

    if (action === 'search' && query) {
      giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=pg`;
    } else {
      // Default: trending
      giphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=pg`;
    }

    const response = await fetch(giphyUrl);
    const data = await response.json();

    // Simplify the response
    const gifs = (data.data || []).map((gif: any) => ({
      id: gif.id,
      url: gif.images.original.url,
      previewUrl: gif.images.fixed_height_small.url,
      width: parseInt(gif.images.fixed_height_small.width),
      height: parseInt(gif.images.fixed_height_small.height),
      title: gif.title,
    }));

    return new Response(
      JSON.stringify({ gifs, pagination: data.pagination }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GIPHY-SEARCH] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch GIFs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
