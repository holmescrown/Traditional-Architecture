import { SCENE_CONFIG } from './scene-data.js';

const CONFIG_CACHE = 'public, max-age=300, s-maxage=300';

function resolveOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  // 未配置白名单时不做来源限制（公开只读接口）
  if (allowed.length === 0) return origin;
  return allowed.includes('*') || allowed.includes(origin) ? origin : false;
}

function buildHeaders(request, env, extra = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    Vary: 'Origin',
    ...extra
  };

  const origin = resolveOrigin(request, env);
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(data, status, request, env, extra = {}) {
  const origin = resolveOrigin(request, env);
  if (origin === false) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: buildHeaders(request, env, { 'Cache-Control': 'no-store' })
    });
  }

  return new Response(JSON.stringify(data), {
    status,
    headers: buildHeaders(request, env, extra)
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const origin = resolveOrigin(request, env);
      if (origin === false) {
        return new Response(null, { status: 403, headers: buildHeaders(request, env) });
      }
      return new Response(null, {
        status: 204,
        headers: buildHeaders(request, env, {
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        })
      });
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method Not Allowed' }, 405, request, env, {
        Allow: 'GET, OPTIONS',
        'Cache-Control': 'no-store'
      });
    }

    if (url.pathname === '/api/config') {
      return json(SCENE_CONFIG, 200, request, env, { 'Cache-Control': CONFIG_CACHE });
    }

    if (url.pathname === '/api/health') {
      return json(
        { status: 'ok', version: SCENE_CONFIG.version },
        200,
        request,
        env,
        { 'Cache-Control': 'no-store' }
      );
    }

    return json({ error: 'Not Found' }, 404, request, env, {
      'Cache-Control': 'no-store'
    });
  }
};
