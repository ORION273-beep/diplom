const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { User, RefreshToken, PasswordResetToken, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');
const { nextNumericId } = require('../utils/ids');
const { sendPasswordResetEmail } = require('../utils/email');
const {
  REFRESH_COOKIE,
  signAccessToken,
  issueRefreshSession,
  serializeUser,
  JWT_REFRESH_SECRET,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/tokens');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleRegister(req, res) {
  try {
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!emailRaw || password.length < 6) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные');
    }
    if (!isValidEmail(emailRaw)) {
      return sendError(res, 400, 'VALIDATION', 'Некорректный формат email');
    }
    const existing = await User.findOne({ email: emailRaw }).lean();
    if (existing) {
      return sendError(res, 409, 'CONFLICT', 'Пользователь с таким email уже существует');
    }
    const users = await User.find({}, { _id: 1 }).lean();
    const nextId = nextNumericId(users);
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      _id: nextId,
      email: emailRaw,
      password: hashedPassword,
      role: 'USER',
    });
    return sendSuccess(res, 201, { message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Регистрация сейчас не проходит');
  }
}

router.post('/register', handleRegister);
router.post('/signup', handleRegister);

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION', 'Email и пароль обязательны');
    }
    const user = toPlain(await User.findOne({ email }).lean());
    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
    }
    if (user.blocked) {
      return sendError(res, 403, 'BLOCKED', 'Аккаунт заблокирован');
    }
    // костыль: старые пароли без bcrypt просто не пускаем
    const stored = String(user.password || '');
    const hasBcrypt = stored.startsWith('$2a$') || stored.startsWith('$2b$');
    if (!hasBcrypt) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
    }
    const ok = await bcrypt.compare(password, stored);
    if (!ok) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
    }
    const accessToken = signAccessToken({ id: user.id, role: user.role.toLowerCase() });
    const { token: refreshToken, maxAge } = await issueRefreshSession(user.id);
    setAuthCookies(res, user, refreshToken, maxAge);
    return sendSuccess(res, 200, {
      user: serializeUser(user),
      accessToken,
    });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      return sendError(res, 401, 'NO_REFRESH', 'Нет refresh-сессии');
    }
    // refresh без ротации — для диплома хватает
    let payload;
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      clearAuthCookies(res);
      return sendError(res, 401, 'INVALID_REFRESH', 'Неверный refresh');
    }
    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      return sendError(res, 401, 'INVALID_REFRESH', 'Неверный refresh');
    }
    const row = toPlain(await RefreshToken.findOne({ jti: payload.jti }).lean());
    if (!row || new Date(row.expiresAt) < new Date()) {
      clearAuthCookies(res);
      return sendError(res, 401, 'INVALID_REFRESH', 'Сессия истекла');
    }
    const user = toPlain(await User.findById(String(payload.sub)).lean());
    if (!user) {
      clearAuthCookies(res);
      return sendError(res, 401, 'USER_MISSING', 'Пользователь не найден');
    }
    if (user.blocked) {
      clearAuthCookies(res);
      return sendError(res, 403, 'BLOCKED', 'Аккаунт заблокирован');
    }
    const accessToken = signAccessToken({ id: user.id, role: user.role.toLowerCase() });
    const maxAge = new Date(row.expiresAt).getTime() - Date.now();
    setAuthCookies(res, user, token, Math.max(maxAge, 0));
    return sendSuccess(res, 200, {
      user: serializeUser(user),
      accessToken,
    });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET);
        if (payload.jti) {
          await RefreshToken.deleteMany({ jti: payload.jti });
        }
      } catch {
        /* ignore */
      }
    }
    clearAuthCookies(res);
    return sendSuccess(res, 200, {});
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return sendError(res, 400, 'VALIDATION', 'Укажите email');
    }
    if (!isValidEmail(email)) {
      return sendError(res, 400, 'VALIDATION', 'Некорректный формат email');
    }
    const user = toPlain(await User.findOne({ email }).lean());
    if (user) {
      await PasswordResetToken.deleteMany({ userId: user.id });
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await PasswordResetToken.create({ userId: user.id, token, expiresAt });
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail({ email, resetUrl });
    }
    return sendSuccess(res, 200, {
      message: 'Если email зарегистрирован, инструкция по восстановлению отправлена',
    });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!token || password.length < 6) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные');
    }
    const row = toPlain(await PasswordResetToken.findOne({ token }).lean());
    if (!row || new Date(row.expiresAt) < new Date()) {
      return sendError(res, 400, 'INVALID_TOKEN', 'Ссылка недействительна или истекла');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(row.userId, { $set: { password: hashedPassword } });
    await PasswordResetToken.deleteOne({ _id: row.id });
    await RefreshToken.deleteMany({ userId: row.userId });
    return sendSuccess(res, 200, { message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.patch('/password', requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || newPassword.length < 6) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные');
    }
    const user = toPlain(await User.findById(req.user.id).lean());
    if (!user) {
      return sendError(res, 404, 'NOT_FOUND', 'Пользователь не найден');
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Неверный текущий пароль');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.id, { $set: { password: hashedPassword } });
    return sendSuccess(res, 200, { message: 'Пароль обновлён' });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = toPlain(
      await User.findById(req.user.id).select('_id email role balance createdAt').lean(),
    );
    if (!user) {
      return sendError(res, 404, 'NOT_FOUND', 'Пользователь не найден');
    }
    return sendSuccess(res, 200, { user: serializeUser(user) });
  } catch (error) {
    console.error('auth:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера');
  }
});

module.exports = router;
