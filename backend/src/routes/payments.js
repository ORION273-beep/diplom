const express = require('express');
const { Order } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');

const router = express.Router();

// webhook оплаты — симуляция, pending -> completed
router.post('/webhook', async (req, res) => {
  try {
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    const secret = typeof req.body?.secret === 'string' ? req.body.secret : '';
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'dev-webhook-secret';

    if (!orderId) {
      return sendError(res, 400, 'VALIDATION', 'orderId обязателен');
    }
    if (secret !== webhookSecret) {
      return sendError(res, 403, 'FORBIDDEN', 'Неверный секрет webhook');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Заказ не найден');
    }
    if (order.status === 'completed') {
      return sendSuccess(res, 200, { orderId, status: 'completed', message: 'Уже оплачен' });
    }
    if (order.status === 'failed' || order.status === 'refunded') {
      return sendError(res, 400, 'INVALID_STATUS', `Заказ в статусе ${order.status}`);
    }

    const now = new Date();
    if (order.status === 'pending') {
      order.statusHistory.push(
        { status: 'processing', changedAt: now, changedBy: 'payment-webhook' },
        {
          status: 'completed',
          changedAt: new Date(now.getTime() + 1),
          changedBy: 'payment-webhook',
        },
      );
      order.status = 'completed';
      order.updatedAt = new Date(now.getTime() + 1);
    } else {
      order.statusHistory.push({
        status: 'completed',
        changedAt: now,
        changedBy: 'payment-webhook',
      });
      order.status = 'completed';
      order.updatedAt = now;
    }
    await order.save();

    return sendSuccess(res, 200, { orderId, status: 'completed' });
  } catch (error) {
    console.error('POST /api/payments/webhook error:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка обработки webhook');
  }
});

module.exports = router;
