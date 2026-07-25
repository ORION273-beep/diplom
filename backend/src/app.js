const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { isMongoReady } = require('./db/ensureMongo');
const { sendError } = require('./utils/errors');

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const reviewsRoutes = require('./routes/reviews');
const faqRoutes = require('./routes/faq');
const cartRoutes = require('./routes/cart');
const paymentsRoutes = require('./routes/payments');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', async (_req, res) => {
    if (isMongoReady()) {
      return res.json({ ok: true, status: 'ok', db: 'connected' });
    }
    return res.status(503).json({ ok: false, status: 'degraded', db: 'disconnected' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/games', gamesRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/faq', faqRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/payments', paymentsRoutes);

  app.use((_req, res) => {
    return sendError(res, 404, 'NOT_FOUND', 'Маршрут не найден');
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    return sendError(res, 500, 'INTERNAL', 'Внутренняя ошибка сервера');
  });

  return app;
}

module.exports = { createApp };
