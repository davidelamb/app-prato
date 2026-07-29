const CONTENT_KEY = 'main';
const MAX_CONTENT_BYTES = 1_800_000;
const MAX_IMAGE_BYTES = 5_000_000;
const DEFAULT_MEDIA_STORAGE_LIMIT_BYTES = 1_000_000_000;
const DEFAULT_MONTHLY_UPLOAD_LIMIT = 1_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const encoder = new TextEncoder();

type StoredDocument = {
  payload: string;
  version: number;
  updated_at: string;
};

type ImageUpload = {
  dataUrl?: unknown;
  prefix?: unknown;
};

type MediaStorageUsage = {
  total_bytes: number;
};

type MediaMonthlyUsage = {
  upload_count: number;
};

type PushSubscriptionInput = {
  token?: unknown;
  platform?: unknown;
  deviceId?: unknown;
};

type PushSubscriptionRow = {
  expo_push_token: string;
};

type PushNotice = {
  title: string;
  body: string;
  data: { tab: 'news' | 'live' };
};

function corsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin');
  const allowed = origin && (
    origin === 'https://app-prato.david3-a.workers.dev'
    || /^http:\/\/localhost:\d+$/.test(origin)
    || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, If-Match',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
  if (allowed && origin) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  corsHeaders(request).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(request: Request, value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return withCors(request, new Response(JSON.stringify(value), { ...init, headers }));
}

function unauthorized(request: Request): Response {
  return json(request, { error: 'Accesso amministratore non autorizzato.' }, { status: 401 });
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function isAdminRequest(request: Request, env: Env): Promise<boolean> {
  const expected = env.ADMIN_TOKEN;
  const authorization = request.headers.get('Authorization');
  if (!expected || !authorization?.startsWith('Bearer ')) return false;
  const actual = authorization.slice(7);
  const [expectedBytes, actualBytes] = await Promise.all([digest(expected), digest(actual)]);
  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= expectedBytes[index] ^ actualBytes[index];
  }
  return difference === 0;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function arrayValue(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(objectValue).filter((item): item is Record<string, unknown> => !!item) : [];
}

function contentPushNotice(previousPayload: string | undefined, next: Record<string, unknown>): PushNotice | null {
  if (!previousPayload) return null;
  let previous: Record<string, unknown>;
  try {
    previous = objectValue(JSON.parse(previousPayload)) ?? {};
  } catch {
    return null;
  }

  const previousFixtures = new Map(arrayValue(previous.fixtures).map((fixture) => [String(fixture.id ?? ''), fixture]));
  for (const fixture of arrayValue(next.fixtures)) {
    const fixtureId = String(fixture.id ?? '');
    const before = previousFixtures.get(fixtureId);
    if (!before) continue;

    const oldEvents = new Set(arrayValue(before.liveEvents).map((event) => String(event.id ?? '')));
    const newEvents = arrayValue(fixture.liveEvents).filter((event) => !oldEvents.has(String(event.id ?? '')));
    const goal = newEvents.find((event) => event.type === 'goal');
    if (goal) {
      const scorer = typeof goal.scorer === 'string' ? goal.scorer : '';
      const score = typeof goal.score === 'string' ? goal.score : '';
      return {
        title: score ? `Gol! ${score}` : 'Gol!',
        body: scorer || String(goal.label ?? 'La partita si è sbloccata.'),
        data: { tab: 'live' },
      };
    }
    if (before.status !== 'live' && fixture.status === 'live') {
      return {
        title: 'La partita è iniziata',
        body: `${String(fixture.home ?? '')} - ${String(fixture.away ?? '')}`,
        data: { tab: 'live' },
      };
    }
    if (before.status !== 'final' && fixture.status === 'final') {
      return {
        title: 'Risultato finale',
        body: `${String(fixture.home ?? '')} ${String(fixture.homeScore ?? 0)}-${String(fixture.awayScore ?? 0)} ${String(fixture.away ?? '')}`,
        data: { tab: 'live' },
      };
    }
  }

  const previousNewsIds = new Set(arrayValue(previous.news).map((article) => String(article.id ?? '')));
  const newArticle = arrayValue(next.news).find((article) => !previousNewsIds.has(String(article.id ?? '')));
  if (newArticle) {
    return {
      title: 'Nuova news APPrato',
      body: String(newArticle.title ?? 'È disponibile un nuovo aggiornamento.'),
      data: { tab: 'news' },
    };
  }
  return null;
}

async function sendPushNotice(env: Env, notice: PushNotice): Promise<void> {
  const result = await env.CONTENT_DB
    .prepare('SELECT expo_push_token FROM push_subscriptions WHERE enabled = 1 ORDER BY updated_at DESC')
    .all<PushSubscriptionRow>();
  const tokens = result.results.map((row) => row.expo_push_token);
  for (let offset = 0; offset < tokens.length; offset += 100) {
    const messages = tokens.slice(offset, offset + 100).map((to) => ({
      to,
      sound: 'default',
      channelId: 'app-prato',
      title: notice.title,
      body: notice.body,
      data: notice.data,
    }));
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!response.ok) console.error(JSON.stringify({ event: 'push_send_failed', status: response.status }));
  }
}

async function subscribePush(request: Request, env: Env): Promise<Response> {
  let input: PushSubscriptionInput;
  try {
    input = await request.json<PushSubscriptionInput>();
  } catch {
    return json(request, { error: 'Richiesta notifiche non valida.' }, { status: 400 });
  }
  const token = typeof input.token === 'string' ? input.token.trim() : '';
  const platform = input.platform === 'android' || input.platform === 'ios' ? input.platform : '';
  const deviceId = typeof input.deviceId === 'string' ? input.deviceId.trim().slice(0, 120) : '';
  if (!/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token) || !platform || !deviceId) {
    return json(request, { error: 'Dati notifiche non validi.' }, { status: 400 });
  }
  const now = new Date().toISOString();
  await env.CONTENT_DB
    .prepare(`INSERT INTO push_subscriptions (expo_push_token, platform, device_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(expo_push_token) DO UPDATE SET
        platform = excluded.platform,
        device_id = excluded.device_id,
        enabled = 1,
        updated_at = excluded.updated_at`)
    .bind(token, platform, deviceId, now, now)
    .run();
  return json(request, { ok: true }, { status: 201 });
}


function isContentPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const content = value as Record<string, unknown>;
  return ['fixtures', 'standings', 'players', 'news', 'media'].every((key) => Array.isArray(content[key]))
    && typeof content.updatedAt === 'string';
}

function safePrefix(value: unknown): string {
  if (typeof value !== 'string') return 'uploads';
  const normalized = value.toLowerCase().replace(/[^a-z0-9/_-]+/g, '-').replace(/^\/+|\/+$/g, '');
  return normalized || 'uploads';
}

function decodeDataUrl(value: unknown): { bytes: Uint8Array; contentType: string } | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) return null;
  try {
    const binary = atob(match[2].replace(/\s/g, ''));
    if (binary.length === 0 || binary.length > MAX_IMAGE_BYTES) return null;
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { bytes, contentType: match[1] };
  } catch {
    return null;
  }
}

function extensionFor(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

async function getContent(request: Request, env: Env): Promise<Response> {
  const row = await env.CONTENT_DB
    .prepare('SELECT payload, version, updated_at FROM content_documents WHERE document_key = ?')
    .bind(CONTENT_KEY)
    .first<StoredDocument>();
  if (!row) return withCors(request, new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));
  return json(request, JSON.parse(row.payload), {
    headers: {
      'Cache-Control': 'public, max-age=15, must-revalidate',
      ETag: `"content-${row.version}"`,
      'Last-Modified': new Date(row.updated_at).toUTCString(),
      'X-Content-Version': String(row.version),
    },
  });
}

async function putContent(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!await isAdminRequest(request, env)) return unauthorized(request);
  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > MAX_CONTENT_BYTES) return json(request, { error: 'Contenuto troppo grande.' }, { status: 413 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: 'JSON non valido.' }, { status: 400 });
  }
  if (!isContentPayload(payload)) return json(request, { error: 'Struttura contenuti non valida.' }, { status: 400 });

  const serialized = JSON.stringify(payload);
  if (encoder.encode(serialized).byteLength > MAX_CONTENT_BYTES) {
    return json(request, { error: 'Contenuto troppo grande.' }, { status: 413 });
  }

  const current = await env.CONTENT_DB
    .prepare('SELECT payload, version, updated_at FROM content_documents WHERE document_key = ?')
    .bind(CONTENT_KEY)
    .first<StoredDocument>();
  const version = (current?.version ?? 0) + 1;
  const updatedAt = new Date().toISOString();
  const statements = [];
  if (current) {
    statements.push(
      env.CONTENT_DB
        .prepare('INSERT INTO content_revisions (document_key, payload, version, created_at) VALUES (?, ?, ?, ?)')
        .bind(CONTENT_KEY, current.payload, current.version, current.updated_at),
    );
  }
  statements.push(
    env.CONTENT_DB
      .prepare(`INSERT INTO content_documents (document_key, payload, version, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(document_key) DO UPDATE SET payload = excluded.payload, version = excluded.version, updated_at = excluded.updated_at`)
      .bind(CONTENT_KEY, serialized, version, updatedAt),
  );
  await env.CONTENT_DB.batch(statements);
  await env.CONTENT_DB
    .prepare(`DELETE FROM content_revisions
      WHERE document_key = ? AND id NOT IN (
        SELECT id FROM content_revisions WHERE document_key = ? ORDER BY version DESC LIMIT 100
      )`)
    .bind(CONTENT_KEY, CONTENT_KEY)
    .run();
  const notice = contentPushNotice(current?.payload, payload);
  if (notice) ctx.waitUntil(sendPushNotice(env, notice));

  return json(request, payload, {
    headers: { ETag: `"content-${version}"`, 'X-Content-Version': String(version) },
  });
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  if (!await isAdminRequest(request, env)) return unauthorized(request);
  if (env.MEDIA_UPLOADS_ENABLED !== 'true') {
    return json(request, { error: 'Caricamento immagini temporaneamente disattivato.' }, { status: 503 });
  }
  let upload: ImageUpload;
  try {
    upload = await request.json<ImageUpload>();
  } catch {
    return json(request, { error: 'Richiesta immagine non valida.' }, { status: 400 });
  }
  const decoded = decodeDataUrl(upload.dataUrl);
  if (!decoded) return json(request, { error: 'Immagine non valida o superiore a 5 MB.' }, { status: 400 });

  const storageLimit = positiveInteger(env.MEDIA_STORAGE_LIMIT_BYTES, DEFAULT_MEDIA_STORAGE_LIMIT_BYTES);
  const monthlyUploadLimit = positiveInteger(env.MEDIA_MONTHLY_UPLOAD_LIMIT, DEFAULT_MONTHLY_UPLOAD_LIMIT);
  const period = currentPeriod();
  const [storageUsage, monthlyUsage] = await Promise.all([
    env.CONTENT_DB
      .prepare('SELECT total_bytes FROM media_storage_usage WHERE id = 1')
      .first<MediaStorageUsage>(),
    env.CONTENT_DB
      .prepare('SELECT upload_count FROM media_upload_usage WHERE period = ?')
      .bind(period)
      .first<MediaMonthlyUsage>(),
  ]);
  if ((monthlyUsage?.upload_count ?? 0) >= monthlyUploadLimit) {
    return json(request, { error: 'Limite mensile di caricamenti raggiunto.' }, { status: 429 });
  }
  if ((storageUsage?.total_bytes ?? 0) + decoded.bytes.byteLength > storageLimit) {
    return json(request, { error: 'Spazio immagini disponibile esaurito.' }, { status: 507 });
  }

  const key = `${safePrefix(upload.prefix)}/${crypto.randomUUID()}.${extensionFor(decoded.contentType)}`;
  const uploadedAt = new Date().toISOString();
  try {
    await env.MEDIA_BUCKET.put(key, decoded.bytes, {
      httpMetadata: { contentType: decoded.contentType, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { uploadedAt },
    });
    await env.CONTENT_DB.batch([
      env.CONTENT_DB
        .prepare('UPDATE media_storage_usage SET total_bytes = total_bytes + ?, updated_at = ? WHERE id = 1')
        .bind(decoded.bytes.byteLength, uploadedAt),
      env.CONTENT_DB
        .prepare(`INSERT INTO media_upload_usage (period, upload_count, uploaded_bytes, updated_at)
          VALUES (?, 1, ?, ?)
          ON CONFLICT(period) DO UPDATE SET
            upload_count = upload_count + 1,
            uploaded_bytes = uploaded_bytes + excluded.uploaded_bytes,
            updated_at = excluded.updated_at`)
        .bind(period, decoded.bytes.byteLength, uploadedAt),
    ]);
  } catch (error) {
    await env.MEDIA_BUCKET.delete(key);
    throw error;
  }
  const url = new URL(request.url);
  return json(request, { url: `${url.origin}/api/images/${key}` }, { status: 201 });
}

async function serveImage(request: Request, env: Env, ctx: ExecutionContext, key: string): Promise<Response> {
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  const response = new Response(object.body, { headers });
  ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}

async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }));
  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json(request, { ok: true, storage: 'd1-r2' });
  }
  if (url.pathname === '/api/content' && request.method === 'GET') return getContent(request, env);
  if (url.pathname === '/api/content' && request.method === 'PUT') return putContent(request, env, ctx);
  if (url.pathname === '/api/admin/check' && request.method === 'GET') {
    return await isAdminRequest(request, env) ? json(request, { ok: true }) : unauthorized(request);
  }
  if (url.pathname === '/api/push/subscribe' && request.method === 'POST') return subscribePush(request, env);
  if (url.pathname === '/api/images' && request.method === 'POST') return uploadImage(request, env);
  if (url.pathname.startsWith('/api/images/') && request.method === 'GET') {
    return serveImage(request, env, ctx, decodeURIComponent(url.pathname.slice('/api/images/'.length)));
  }
  return json(request, { error: 'Endpoint non trovato.' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, ctx);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({ event: 'request_error', message: error instanceof Error ? error.message : String(error) }));
      return json(request, { error: 'Errore temporaneo del servizio.' }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
