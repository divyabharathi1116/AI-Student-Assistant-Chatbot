// Cloudflare Worker entrypoint for "wrangler deploy"
// Routes /api/* requests to serverless edge handlers and falls back to static assets

import { onRequestPost as handleChatPost, onRequestOptions as handleChatOptions } from './functions/api/chat.js';
import { onRequestGet as handleHealthGet, onRequestOptions as handleHealthOptions } from './functions/api/health.js';
import { onRequest as handleCatchall } from './functions/api/[[catchall]].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route /api/chat
    if (url.pathname === '/api/chat') {
      if (request.method === 'OPTIONS') {
        return handleChatOptions();
      }
      if (request.method === 'POST') {
        return handleChatPost({ request, env, ctx });
      }
      return new Response(JSON.stringify({ error: `Method ${request.method} Not Allowed on /api/chat` }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Route /api/health
    if (url.pathname === '/api/health') {
      if (request.method === 'OPTIONS') {
        return handleHealthOptions();
      }
      return handleHealthGet({ request, env, ctx });
    }

    // Route all other /api/* endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleCatchall({ request, env, ctx });
    }

    // Fall back to static assets (Vite dist)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

