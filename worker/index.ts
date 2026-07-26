const CONTENT_KEY = 'main';
const MAX_CONTENT_BYTES = 1_800_000;
const MAX_IMAGE_BYTES = 5_000_000;
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

async function putContent(request: Request, env: Env): Promise<Response> {
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

  return json(request, payload, {
    headers: { ETag: `"content-${version}"`, 'X-Content-Version': String(version) },
  });
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  if (!await isAdminRequest(request, env)) return unauthorized(request);
  let upload: ImageUpload;
  try {
    upload = await request.json<ImageUpload>();
  } catch {
    return json(request, { error: 'Richiesta immagine non valida.' }, { status: 400 });
  }
  const decoded = decodeDataUrl(upload.dataUrl);
  if (!decoded) return json(request, { error: 'Immagine non valida o superiore a 5 MB.' }, { status: 400 });

  const key = `${safePrefix(upload.prefix)}/${crypto.randomUUID()}.${extensionFor(decoded.contentType)}`;
  await env.MEDIA_BUCKET.put(key, decoded.bytes, {
    httpMetadata: { contentType: decoded.contentType, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });
  const url = new URL(request.url);
  return json(request, { url: `${url.origin}/api/images/${key}` }, { status: 201 });
}

async function serveImage(request: Request, env: Env, key: string): Promise<Response> {
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }));
  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json(request, { ok: true, storage: 'd1-r2' });
  }
  if (url.pathname === '/api/content' && request.method === 'GET') return getContent(request, env);
  if (url.pathname === '/api/content' && request.method === 'PUT') return putContent(request, env);
  if (url.pathname === '/api/admin/check' && request.method === 'GET') {
    return await isAdminRequest(request, env) ? json(request, { ok: true }) : unauthorized(request);
  }
  if (url.pathname === '/api/images' && request.method === 'POST') return uploadImage(request, env);
  if (url.pathname.startsWith('/api/images/') && request.method === 'GET') {
    return serveImage(request, env, decodeURIComponent(url.pathname.slice('/api/images/'.length)));
  }
  return json(request, { error: 'Endpoint non trovato.' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({ event: 'request_error', message: error instanceof Error ? error.message : String(error) }));
      return json(request, { error: 'Errore temporaneo del servizio.' }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
