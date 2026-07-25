const express = require('express');
const { z } = require('zod');
const {
  User,
  Product,
  Game,
  Order,
  FaqItem,
  Review,
  toPlain,
} = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');
const { serializeOrder, serializeProduct, serializeGame } = require('../utils/serializers');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { isSameId, nextNumericId } = require('../utils/ids');

const router = express.Router();
const ORDER_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'];

router.use(requireAuth, requireAdmin);

// общий хелпер для 500 в админке
function fail(res, tag, error, message = 'Не удалось выполнить операцию') {
  console.error(`[admin/${tag}]`, error);
  return sendError(res, 500, 'SERVER', message);
}

async function findProductLoose(id) {
  let existing = toPlain(await Product.findById(id).lean());
  if (!existing) {
    const products = await Product.find().lean();
    existing = products.map(toPlain).find((p) => isSameId(p.id, id)) ?? null;
  }
  return existing;
}

function prepareOrder(order, userEmail) {
  const plain = toPlain(order);
  if (!plain) return null;
  if (Array.isArray(plain.statusHistory)) {
    plain.statusHistory = [...plain.statusHistory].sort(
      (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
    );
  }
  if (userEmail != null) {
    plain.user = { email: userEmail };
  }
  return plain;
}

async function loadOrderForSerialize(order, { includeUser = false } = {}) {
  let userEmail = null;
  if (includeUser && order?.userId) {
    const user = await User.findById(order.userId).select('email').lean();
    userEmail = user?.email ?? null;
  }
  return prepareOrder(order, includeUser ? userEmail : undefined);
}

router.get('/orders', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const statusRaw = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const filter =
      statusRaw && ORDER_STATUSES.includes(statusRaw) ? { status: statusRaw } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('email').lean()
      : [];
    const emailById = Object.fromEntries(users.map((u) => [String(u._id), u.email]));
    return sendSuccess(res, 200, {
      orders: orders.map((o) =>
        serializeOrder(prepareOrder(o, emailById[String(o.userId)] ?? null))
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return fail(res, 'orders', error, 'Не удалось загрузить заказы');
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Заказ не найден');
    }
    return sendSuccess(res, 200, {
      order: serializeOrder(await loadOrderForSerialize(order)),
    });
  } catch (error) {
    return fail(res, 'orders', error, 'Не удалось загрузить заказ');
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!ORDER_STATUSES.includes(status)) {
      return sendError(res, 400, 'VALIDATION', 'Некорректный статус');
    }
    const changedAt = new Date();
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status, updatedAt: changedAt },
        $push: {
          statusHistory: {
            status,
            changedAt,
            changedBy: req.user.id,
          },
        },
      },
      { new: true }
    ).lean();
    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Заказ не найден');
    }
    return sendSuccess(res, 200, {
      order: serializeOrder(await loadOrderForSerialize(order)),
    });
  } catch (error) {
    return fail(res, 'orders', error, 'Не удалось обновить статус заказа');
  }
});

router.get('/products', async (_req, res) => {
  try {
    const products = await Product.find().sort({ _id: 1 }).lean();
    return sendSuccess(res, 200, {
      products: products.map((p) => serializeProduct(toPlain(p))),
    });
  } catch (error) {
    return fail(res, 'products', error, 'Не удалось загрузить товары');
  }
});

const productSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  platform: z.string().min(1),
  price: z.number().positive(),
  oldPrice: z.number().positive().nullable().optional(),
  image: z.string().min(1),
  description: z.string().optional(),
  popular: z.boolean().optional(),
  inStock: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
  gameSlug: z.string().nullable().optional(),
});

router.post('/products', async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные товара');
    }
    const data = parsed.data;
    const products = await Product.find().select('_id').lean();
    const nextId = nextNumericId(products);
    const stock = data.stock ?? 100;
    const product = await Product.create({
      _id: nextId,
      title: data.title,
      category: data.category,
      platform: data.platform,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      image: data.image,
      description: data.description ?? null,
      popular: data.popular ?? false,
      inStock: data.inStock ?? stock > 0,
      stock,
      gameSlug: data.gameSlug ?? null,
    });
    return sendSuccess(res, 201, { product: serializeProduct(toPlain(product)) });
  } catch (error) {
    return fail(res, 'products', error, 'Не удалось создать товар');
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные товара');
    }
    const existing = await findProductLoose(req.params.id);
    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Товар не найден');
    }
    const data = parsed.data;
    const stock = data.stock ?? existing.stock;
    const product = await Product.findByIdAndUpdate(
      existing.id,
      {
        $set: {
          ...data,
          stock,
          inStock: data.inStock ?? stock > 0,
        },
      },
      { new: true }
    );
    return sendSuccess(res, 200, { product: serializeProduct(toPlain(product)) });
  } catch (error) {
    return fail(res, 'products', error, 'Не удалось обновить товар');
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const existing = await findProductLoose(req.params.id);
    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Товар не найден');
    }
    await Product.findByIdAndDelete(existing.id);
    return sendSuccess(res, 200, {});
  } catch (error) {
    return fail(res, 'products', error, 'Не удалось удалить товар');
  }
});

router.get('/stats', async (_req, res) => {
  try {
    // счётчики для главной админки
    const [orderCount, productCount, userCount, revenueAgg, statusGroups, topProducts] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments(),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.title', quantity: { $sum: '$items.quantity' } } },
          { $sort: { quantity: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const ordersByStatus = Object.fromEntries(statusGroups.map((g) => [g._id, g.count]));

    return sendSuccess(res, 200, {
      stats: {
        orderCount,
        productCount,
        userCount,
        revenue: revenueAgg[0]?.total ?? 0,
        ordersByStatus,
        topProducts: topProducts.map((p) => ({
          title: p._id,
          quantity: p.quantity ?? 0,
        })),
      },
    });
  } catch (error) {
    return fail(res, 'stats', error, 'Не удалось загрузить статистику');
  }
});

router.get('/games', async (_req, res) => {
  try {
    const games = await Game.find().sort({ popular: -1, name: 1 }).lean();
    return sendSuccess(res, 200, {
      games: games.map((g) => serializeGame(toPlain(g))),
      count: games.length,
    });
  } catch (error) {
    return fail(res, 'games', error, 'Не удалось загрузить игры');
  }
});

const gameSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  cover: z.string().min(1),
  genres: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  popular: z.boolean().optional(),
});

router.post('/games', async (req, res) => {
  try {
    const parsed = gameSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Нужны slug, name и cover');
    }
    const data = parsed.data;
    const existing = await Game.findOne({ slug: data.slug }).lean();
    if (existing) {
      return sendError(res, 409, 'CONFLICT', 'Такой slug уже есть');
    }
    const games = await Game.find().select('_id').lean();
    const nextId = nextNumericId(games);
    const game = await Game.create({
      _id: nextId,
      slug: data.slug,
      name: data.name,
      cover: data.cover,
      genres: data.genres ?? [],
      platforms: data.platforms ?? [],
      description: data.description ?? null,
      popular: data.popular ?? false,
    });
    return sendSuccess(res, 201, { game: serializeGame(toPlain(game)) });
  } catch (error) {
    return fail(res, 'games', error, 'Не удалось добавить игру');
  }
});

router.patch('/games/:id', async (req, res) => {
  try {
    const game = toPlain(await Game.findById(req.params.id).lean());
    if (!game) {
      return sendError(res, 404, 'NOT_FOUND', 'Игра не найдена');
    }
    const parsed = gameSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные');
    }
    if (parsed.data.slug && parsed.data.slug !== game.slug) {
      const slugTaken = await Game.findOne({ slug: parsed.data.slug }).lean();
      if (slugTaken) {
        return sendError(res, 409, 'CONFLICT', 'Slug занят');
      }
    }
    const updated = await Game.findByIdAndUpdate(
      game.id,
      { $set: parsed.data },
      { new: true }
    );
    return sendSuccess(res, 200, { game: serializeGame(toPlain(updated)) });
  } catch (error) {
    console.error('games patch:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось обновить игру');
  }
});

router.delete('/games/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return sendError(res, 404, 'NOT_FOUND', 'Игра не найдена');
    }
    return sendSuccess(res, 200, {});
  } catch (error) {
    return fail(res, 'games', error, 'Не удалось удалить игру');
  }
});

router.get('/faq', async (_req, res) => {
  try {
    const items = await FaqItem.find().sort({ sort: 1, _id: 1 }).lean();
    return sendSuccess(res, 200, {
      items: items.map((row) => {
        const plain = toPlain(row);
        return {
          question: plain.question,
          answer: plain.answer,
          id: plain.id,
          sort: plain.sort ?? 0,
        };
      }),
    });
  } catch (error) {
    return fail(res, 'faq', error, 'Не удалось загрузить FAQ');
  }
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sort: z.number().int().optional(),
});

router.post('/faq', async (req, res) => {
  try {
    const parsed = faqSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Пустой вопрос/ответ');
    }
    const items = await FaqItem.find().select('_id').lean();
    const nextId = nextNumericId(items);
    const item = await FaqItem.create({
      _id: nextId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      sort: parsed.data.sort ?? 0,
    });
    const plain = toPlain(item);
    return sendSuccess(res, 201, {
      ok: true,
      item: { id: plain.id, question: plain.question, answer: plain.answer, sort: plain.sort },
    });
  } catch (error) {
    return fail(res, 'faq', error, 'Не удалось создать вопрос FAQ');
  }
});

router.patch('/faq/:id', async (req, res) => {
  try {
    const parsed = faqSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Пустой вопрос/ответ');
    }
    const item = await FaqItem.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true }
    );
    if (!item) {
      return sendError(res, 404, 'NOT_FOUND', 'Вопрос FAQ не найден');
    }
    const plain = toPlain(item);
    return sendSuccess(res, 200, {
      item: { id: plain.id, question: plain.question, answer: plain.answer, sort: plain.sort },
    });
  } catch (error) {
    return fail(res, 'faq', error, 'Не удалось обновить FAQ');
  }
});

router.delete('/faq/:id', async (req, res) => {
  try {
    const item = await FaqItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return sendError(res, 404, 'NOT_FOUND', 'Вопрос FAQ не найден');
    }
    return sendSuccess(res, 200, { deleted: true });
  } catch (error) {
    return fail(res, 'faq', error, 'Не удалось удалить FAQ');
  }
});

router.get('/reviews', async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, { reviews: reviews.map(toPlain) });
  } catch (error) {
    console.error('[admin]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить отзывы');
  }
});

router.patch('/reviews/:id', async (req, res) => {
  try {
    const published = req.body?.published === true || req.body?.published === 'true';
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { published } },
      { new: true }
    );
    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Отзыв не найден');
    }
    return sendSuccess(res, 200, { review: toPlain(review) });
  } catch (error) {
    console.error('[admin]', error);
    return sendError(res, 404, 'NOT_FOUND', 'Отзыв не найден');
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Отзыв не найден');
    }
    return sendSuccess(res, 200, {});
  } catch (error) {
    console.error('[admin]', error);
    return sendError(res, 404, 'NOT_FOUND', 'Отзыв не найден');
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find()
        .select('email role balance blocked createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);
    const userIds = users.map((u) => String(u._id));
    const orderCounts =
      userIds.length === 0
        ? []
        : await Order.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
          ]);
    const countByUser = Object.fromEntries(orderCounts.map((c) => [c._id, c.count]));
    return sendSuccess(res, 200, {
      users: users.map((u) => {
        const plain = toPlain(u);
        return {
          id: plain.id,
          email: plain.email,
          role: String(plain.role).toLowerCase(),
          balance: plain.balance,
          blocked: plain.blocked,
          createdAt: new Date(plain.createdAt).toISOString(),
          orderCount: countByUser[plain.id] ?? 0,
        };
      }),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('[admin]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить пользователей');
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const data = {};
    if (typeof req.body?.role === 'string') {
      const role = req.body.role.toUpperCase();
      if (!['USER', 'ADMIN'].includes(role)) {
        return sendError(res, 400, 'VALIDATION', 'Некорректная роль');
      }
      data.role = role;
    }
    if (typeof req.body?.blocked === 'boolean') {
      data.blocked = req.body.blocked;
    }
    if (typeof req.body?.balance === 'number' && req.body.balance >= 0) {
      data.balance = req.body.balance;
    }
    if (Object.keys(data).length === 0) {
      return sendError(res, 400, 'VALIDATION', 'Нет данных для обновления');
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true }
    )
      .select('email role balance blocked')
      .lean();
    if (!user) {
      return sendError(res, 404, 'NOT_FOUND', 'Пользователь не найден');
    }
    const plain = toPlain(user);
    return sendSuccess(res, 200, {
      user: {
        id: plain.id,
        email: plain.email,
        role: String(plain.role).toLowerCase(),
        balance: plain.balance,
        blocked: plain.blocked,
      },
    });
  } catch (error) {
    console.error('[admin]', error);
    return sendError(res, 404, 'NOT_FOUND', 'Пользователь не найден');
  }
});

module.exports = router;
