const express = require('express');
const { randomUUID } = require('crypto');
const { z } = require('zod');
const { Order, Product, User, CartItem, toPlain } = require('../db/models');
const { sendError, sendSuccess, AppError } = require('../utils/errors');
const { serializeOrder } = require('../utils/serializers');
const { requireAuth } = require('../middleware/auth');
const { generateStringId } = require('../utils/ids');

const router = express.Router();

async function createUniqueOrderId() {
  for (let i = 0; i < 20; i += 1) {
    const id = generateStringId(8);
    const exists = await Order.findById(id).lean();
    if (!exists) return id;
  }
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function normalizeOrder(doc) {
  const order = toPlain(doc);
  if (!order) return null;
  order.items = (order.items || []).map((it) => {
    const item = { ...it };
    if (item._id != null && item.id == null) item.id = String(item._id);
    delete item._id;
    return item;
  });
  order.statusHistory = (order.statusHistory || [])
    .map((h) => {
      const entry = { ...h };
      if (entry._id != null && entry.id == null) entry.id = String(entry._id);
      delete entry._id;
      return entry;
    })
    .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
  return order;
}

// костыль: имитация оплаты через setImmediate
async function simulatePaymentCompletion(orderId) {
  const now = new Date();
  const order = await Order.findById(orderId);
  if (!order || order.status !== 'pending') return;
  const completedAt = new Date(now.getTime() + 1);
  order.statusHistory.push(
    { status: 'processing', changedAt: now, changedBy: 'payment-sim' },
    { status: 'completed', changedAt: completedAt, changedBy: 'payment-sim' },
  );
  order.status = 'completed';
  order.updatedAt = completedAt;
  await order.save();
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = { userId: req.user.id };
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, {
      orders: orders.map((o) => serializeOrder(normalizeOrder(o))),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера при загрузке заказов');
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = normalizeOrder(
      await Order.findOne({ _id: req.params.id, userId: req.user.id }).lean(),
    );
    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Заказ не найден');
    }
    return sendSuccess(res, 200, { order: serializeOrder(order) });
  } catch (error) {
    console.error('GET /api/orders/:id error:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера при загрузке заказа');
  }
});

const orderItemsSchema = z.array(
  z.object({
    productId: z.union([z.string(), z.number()]),
    quantity: z.number().int().positive().optional(),
  }),
);

const createOrderSchema = z.object({
  items: orderItemsSchema,
  paymentMethod: z.enum(['card', 'sbp', 'balance']).optional(),
  idempotencyKey: z.string().min(1).max(64).optional(),
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.items.length === 0) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные заказа');
    }
    const userId = req.user.id;
    const paymentMethod = parsed.data.paymentMethod ?? 'card';
    const idempotencyKey = parsed.data.idempotencyKey?.trim() || null;

    if (idempotencyKey) {
      const existing = normalizeOrder(await Order.findOne({ idempotencyKey }).lean());
      if (existing && existing.userId === userId) {
        return sendSuccess(res, 200, { order: serializeOrder(existing) });
      }
    }

    // без replica set транзакции не юзаем — просто по шагам
    const lines = [];
    for (const item of parsed.data.items) {
      const productId = String(item.productId);
      const quantity = item.quantity ?? 1;
      if (!productId || quantity <= 0) {
        throw new AppError(400, 'VALIDATION', 'Некорректные товары в заказе');
      }
      const product = toPlain(await Product.findById(productId).lean());
      if (!product) {
        throw new AppError(404, 'NOT_FOUND', `Товар ${productId} не найден`);
      }
      if (product.inStock === false || product.stock < quantity) {
        throw new AppError(
          400,
          'OUT_OF_STOCK',
          `Товар «${product.title}» временно недоступен (осталось: ${product.stock})`,
        );
      }
      const newStock = product.stock - quantity;
      await Product.findByIdAndUpdate(product.id, {
        $set: { stock: newStock, inStock: newStock > 0 },
      });
      lines.push({
        productId: product.id,
        title: product.title,
        image: product.image,
        quantity,
        priceAtPurchase: product.price,
      });
    }
    const totalAmount = lines.reduce((s, l) => s + l.priceAtPurchase * l.quantity, 0);

    if (paymentMethod === 'balance') {
      const user = toPlain(await User.findById(userId).lean());
      if (!user || user.balance < totalAmount) {
        throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Недостаточно средств на балансе OneSec');
      }
      await User.findByIdAndUpdate(userId, { $set: { balance: user.balance - totalAmount } });
    }

    const now = new Date();
    const orderId = await createUniqueOrderId();
    const created = await Order.create({
      _id: orderId,
      userId,
      status: 'pending',
      totalAmount,
      paymentMethod,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      createdAt: now,
      updatedAt: now,
      items: lines,
      statusHistory: [{ status: 'pending', changedAt: now, changedBy: 'system' }],
    });
    await CartItem.deleteMany({ userId });
    const createdOrder = normalizeOrder(created.toObject());

    setImmediate(() => {
      simulatePaymentCompletion(createdOrder.id).catch((err) => {
        console.error('Payment simulation error:', err);
      });
    });

    return sendSuccess(res, 201, { order: serializeOrder(createdOrder) });
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    console.error('POST /api/orders error:', error);
    return sendError(res, 500, 'SERVER', 'Ошибка сервера при создании заказа');
  }
});

module.exports = router;
