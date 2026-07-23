const crypto = require('crypto');

const COOKIE_NAME = 'kios_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET belum diatur di Environment Variables');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').filter(Boolean).map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx).trim(), decodeURIComponent(p.slice(idx + 1))];
    })
  );
}

function isAuthed(req) {
  const cookies = parseCookies(req);
  return !!verify(cookies[COOKIE_NAME]);
}

function createSessionCookie() {
  const token = sign({ exp: Date.now() + SESSION_TTL_MS });
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

module.exports = { isAuthed, createSessionCookie, clearSessionCookie };
