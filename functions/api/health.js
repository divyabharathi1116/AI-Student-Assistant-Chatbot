// Cloudflare Pages Function for /api/health

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-id',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  return new Response(
    JSON.stringify({
      status: 'online',
      appName: 'AI Student Assistant',
      platform: 'Cloudflare Pages Edge',
      geminiKeyConfigured: !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0),
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

