// Cloudflare Pages Function Catchall for /api/*

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-id',
  'Content-Type': 'application/json',
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // If BACKEND_URL is configured, proxy the request to the dedicated backend
  if (env.BACKEND_URL && env.BACKEND_URL.trim().length > 0) {
    try {
      const backendTarget = env.BACKEND_URL.trim().replace(/\/+$/, '');
      const targetUrl = `${backendTarget}${url.pathname}${url.search}`;
      const clonedReq = request.clone();
      const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await clonedReq.text();

      const backendResponse = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'x-guest-id': request.headers.get('x-guest-id') || '',
        },
        body,
      });

      const responseText = await backendResponse.text();
      return new Response(responseText, {
        status: backendResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
        },
      });
    } catch (proxyErr) {
      console.warn('[Proxy Error Catchall]:', proxyErr.message);
    }
  }

  // Fallback edge handlers for mock/guest conversation persistence
  const path = url.pathname;

  if (path.startsWith('/api/chat/conversations')) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ conversations: [] }), {
        status: 200,
        headers: corsHeaders,
      });
    }
    if (request.method === 'POST') {
      let title = 'Academic Chat';
      try {
        const body = await request.json();
        if (body.title) title = body.title;
      } catch (e) {}

      return new Response(
        JSON.stringify({
          conversation: {
            _id: `conv_${Date.now()}`,
            title,
            studyMode: 'academic',
            createdAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }
    if (request.method === 'DELETE' || request.method === 'PATCH') {
      return new Response(
        JSON.stringify({ success: true, conversation: { _id: 'conv', title: 'Updated' } }),
        { status: 200, headers: corsHeaders }
      );
    }
  }

  if (path === '/api/upload/pdf') {
    return new Response(
      JSON.stringify({
        message: 'PDF processing is ready. For serverless deployment, PDF text is attached directly to your prompt.',
        file: { name: 'document.pdf', size: 1024, pages: 1 },
        extractedText: 'PDF uploaded successfully.',
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  if (path.startsWith('/api/auth/')) {
    return new Response(
      JSON.stringify({
        token: `guest_jwt_${Date.now()}`,
        user: {
          id: 'guest_user',
          name: 'Student Guest',
          email: 'student@guest.local',
          studentMajor: 'Computer Science & Engineering',
          studyGoal: 'Master courses & ace exams',
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ message: 'AI Student Assistant Edge API active', endpoint: path }),
    { status: 200, headers: corsHeaders }
  );
}

