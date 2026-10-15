// Deploy as a separate Cloudflare Worker. OAuth credentials belong in Secrets.
const VIDEO_ID = /^[\w-]{11}$/;
const CHANNEL_ID = /^UC[\w-]{22}$/;
const CACHE_SECONDS = 120;
const DEFAULT_ORIGINS = ['https://apostleschurchdubai.org', 'https://www.apostleschurchdubai.org'];

export function createLiveWorker({ fetcher = (...args) => fetch(...args), now = () => Date.now(), cache = null } = {}) {
  let token = null, tokenIdentity = '', tokenPromise = null;
  const pending = new Map();
  const failures = new Map();
  async function google(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetcher(url, { ...options, signal: controller.signal });
      if (!response.ok) { const error = new Error('Provider unavailable'); error.status = response.status; throw error; }
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function accessToken(env) {
    const identity = env.YOUTUBE_CLIENT_ID + ':' + env.YOUTUBE_REFRESH_TOKEN;
    if (identity !== tokenIdentity) { token = null; tokenPromise = null; tokenIdentity = identity; }
    if (token && token.expires > now() + 60000) return token.value;
    if (!tokenPromise) tokenPromise = google('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.YOUTUBE_CLIENT_ID, client_secret: env.YOUTUBE_CLIENT_SECRET, refresh_token: env.YOUTUBE_REFRESH_TOKEN, grant_type: 'refresh_token' })
    }).then(data => {
      if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in) || data.expires_in <= 60) throw new Error('Authorization unavailable');
      token = { value: data.access_token, expires: now() + data.expires_in * 1000 };
      return token.value;
    }).finally(() => { tokenPromise = null; });
    return tokenPromise;
  }
  async function readLive(env) {
    let bearer = await accessToken(env), pageToken = '', external = null;
    for (let page = 0; page < 3; page++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/liveBroadcasts');
      url.search = new URLSearchParams({ part: 'id,snippet,status,contentDetails', broadcastStatus: 'active', broadcastType: 'all', maxResults: '50', ...(pageToken ? { pageToken } : {}) });
      let data;
      try { data = await google(url.href, { headers: { Authorization: 'Bearer ' + bearer } }); }
      catch (error) {
        if (error.status !== 401) throw error;
        token = null; bearer = await accessToken(env);
        data = await google(url.href, { headers: { Authorization: 'Bearer ' + bearer } });
      }
      if (!Array.isArray(data.items)) throw new Error('Invalid provider response');
      for (const video of data.items) {
        // Never expose private/unlisted broadcasts or another channel's videos.
        if (!VIDEO_ID.test(video.id || '') || video.snippet?.channelId !== env.YOUTUBE_CHANNEL_ID || video.status?.privacyStatus !== 'public' || video.status?.lifeCycleStatus !== 'live') continue;
        const item = { videoId: video.id, title: String(video.snippet.title || 'Church live broadcast').slice(0, 250), watchUrl: 'https://www.youtube.com/watch?v=' + video.id };
        if (video.contentDetails?.enableEmbed === true) return { state: 'live', ...item };
        external ||= { state: 'external', ...item };
      }
      pageToken = data.nextPageToken || '';
      if (!pageToken) return external || { state: 'offline' };
    }
    throw new Error('Incomplete provider results');
  }
  function json(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': status === 200 ? 'public, max-age=30' : 'no-store' } });
  }
  return {
    async fetch(request, env, ctx = { waitUntil() {} }) {
      const url = new URL(request.url);
      if (url.pathname !== '/api/live') return json({ error: 'Not found' }, 404);
      const origin = request.headers.get('Origin');
      const origins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_ORIGINS;
      if (origin && !origins.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
      const cors = response => {
        const headers = new Headers(response.headers); headers.set('Vary', 'Origin');
        if (origin) headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
      };
      if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
      if (!['GET', 'HEAD'].includes(request.method)) return cors(json({ error: 'Method not allowed' }, 405));
      if (!CHANNEL_ID.test(env.YOUTUBE_CHANNEL_ID || '') || !env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REFRESH_TOKEN) return cors(json({ state: 'unavailable', nextCheckSeconds: 120 }, 503));
      const edgeCache = cache || globalThis.caches?.default;
      // Ignore visitor query parameters: they cannot bypass the provider cache.
      const key = new Request('https://church-live.internal/channel/' + env.YOUTUBE_CHANNEL_ID);
      const hit = await edgeCache?.match(key);
      if (hit) return cors(hit);
      if ((failures.get(env.YOUTUBE_CHANNEL_ID) || 0) > now()) return cors(json({ state: 'unavailable', nextCheckSeconds: 120 }, 503));
      if (!pending.has(env.YOUTUBE_CHANNEL_ID)) pending.set(env.YOUTUBE_CHANNEL_ID, (async () => {
        try {
          const data = { ...await readLive(env), checkedAt: new Date(now()).toISOString(), nextCheckSeconds: 60 };
          const response = json(data);
          if (edgeCache) {
            const stored = response.clone(); stored.headers.set('Cache-Control', 'public, max-age=' + CACHE_SECONDS);
            // Await the write so concurrent/new visitors reuse this result.
            await edgeCache.put(key, stored);
          }
          return response;
        } catch {
          failures.set(env.YOUTUBE_CHANNEL_ID, now() + 30000);
          // No provider response, token, account information or secret reaches clients.
          return json({ state: 'unavailable', nextCheckSeconds: 120 }, 503);
        } finally { pending.delete(env.YOUTUBE_CHANNEL_ID); }
      })());
      return cors((await pending.get(env.YOUTUBE_CHANNEL_ID)).clone());
    }
  };
}
export default createLiveWorker();
