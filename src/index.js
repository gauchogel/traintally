import { GameStorage } from './game-storage.js';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export { GameStorage };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }
    
    // Serve static assets
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
    } catch (e) {
      // If asset not found, return 404
      return new Response('Not found', { status: 404 });
    }
  }
};

async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    let response;
    switch (path) {
      case 'games':
        response = await handleGamesRequest(request, env);
        break;
      case 'players':
        response = await handlePlayersRequest(request, env);
        break;
      case 'scores':
        response = await handleScoresRequest(request, env);
        break;
      case 'websocket':
        response = await handleWebSocketRequest(request, env);
        break;
      default:
        response = new Response('Not found', { status: 404 });
    }
    // Add CORS headers to all API responses
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGamesRequest(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  
  if (request.method === 'POST') {
    // For creating a game, we need the gameId from the request body
    const body = await request.json();
    const newGameId = body.gameId;
    
    if (!newGameId) {
      return new Response(JSON.stringify({ error: 'Game ID required in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const gameStorageId = env.GAME_STORAGE.idFromName(newGameId);
    const gameStorage = env.GAME_STORAGE.get(gameStorageId);
    
    return gameStorage.fetch(new Request(`${url.origin}/create-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
  } else if (request.method === 'GET') {
    // For getting a game, we need the gameId from query params
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const gameStorageId = env.GAME_STORAGE.idFromName(gameId);
    const gameStorage = env.GAME_STORAGE.get(gameStorageId);
    
    return gameStorage.fetch(new Request(`${url.origin}/get-game`));
  }
  
  return new Response('Method not allowed', { status: 405 });
}

async function handlePlayersRequest(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  
  if (!gameId) {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const gameStorageId = env.GAME_STORAGE.idFromName(gameId);
  const gameStorage = env.GAME_STORAGE.get(gameStorageId);
  
  if (request.method === 'POST') {
    const body = await request.json();
    return gameStorage.fetch(new Request(`${url.origin}/add-player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
  }
  
  return new Response('Method not allowed', { status: 405 });
}

async function handleScoresRequest(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  
  if (!gameId) {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const gameStorageId = env.GAME_STORAGE.idFromName(gameId);
  const gameStorage = env.GAME_STORAGE.get(gameStorageId);
  
  if (request.method === 'POST') {
    const body = await request.json();
    return gameStorage.fetch(new Request(`${url.origin}/submit-scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
  }
  
  return new Response('Method not allowed', { status: 405 });
} 

async function handleWebSocketRequest(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  
  if (!gameId) {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const gameStorageId = env.GAME_STORAGE.idFromName(gameId);
  const gameStorage = env.GAME_STORAGE.get(gameStorageId);
  
  // Create a new request with the WebSocket headers
  const wsRequest = new Request(`${url.origin}/websocket`, {
    headers: request.headers
  });
  
  return gameStorage.fetch(wsRequest);
} 