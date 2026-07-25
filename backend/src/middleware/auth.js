const jwt = require('jsonwebtoken');
const { User, toPlain } = require('../db/models');
const { sendError } = require('../utils/errors');
const { JWT_ACCESS_SECRET } = require('../utils/tokens');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Требуется авторизация');
  }
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    if (!payload.sub) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Неверный токен');
    }
    const user = toPlain(await User.findById(String(payload.sub)).lean());
    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Пользователь не найден');
    }
    if (user.blocked) {
      return sendError(res, 403, 'BLOCKED', 'Аккаунт заблокирован');
    }
    req.user = { id: user.id, role: user.role.toLowerCase() };
    next();
  } catch {
    return sendError(res, 401, 'UNAUTHORIZED', 'Неверный или истёкший токен');
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Недостаточно прав');
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
