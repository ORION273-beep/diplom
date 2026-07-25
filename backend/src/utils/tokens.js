const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { RefreshToken } = require('../db/models');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_MS = 14 * 24 * 60 * 60 * 1000; // refresh на 14 дней, так проще
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

function setAuthCookies(res, _user, refreshToken, maxAgeMs) {
  // на всякий случай чистим старый path cookie
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(maxAgeMs));
}

function clearAuthCookies(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_TTL,
  });
}

function signRefreshToken(userId, jti) {
  return jwt.sign({ sub: userId, jti, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: '14d',
  });
}

async function issueRefreshSession(userId) {
  const jti = randomUUID();
  const token = signRefreshToken(userId, jti);
  const decoded = jwt.decode(token);
  const expiresAt = new Date((decoded.exp || 0) * 1000);
  await RefreshToken.create({ jti, userId, expiresAt });
  return { token, maxAge: REFRESH_TTL_MS };
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    balance: user.balance ?? 0,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

module.exports = {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  signAccessToken,
  issueRefreshSession,
  serializeUser,
};
