const express = require('express');
const { z } = require('zod');
const { CartItem, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// upsert по userId + productId
const cartItemSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  oldPrice: z.number().nonnegative().nullable().optional(),
  image: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  gameSlug: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
});

function serializeCartItem(item) {
  return {
    id: item.productId,
    title: item.title,
    price: item.price,
    oldPrice: item.oldPrice ?? undefined,
    image: item.image,
    quantity: item.quantity,
    gameSlug: item.gameSlug ?? undefined,
    category: item.category ?? undefined,
    platform: item.platform ?? undefined,
  };
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.id }).sort({ updatedAt: -1 }).lean();
    return sendSuccess(res, 200, { items: items.map((i) => serializeCartItem(toPlain(i))) });
  } catch (error) {
    console.error('[cart]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить корзину');
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = cartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные товара');
    }
    const data = parsed.data;
    const productId = String(data.productId);
    const quantity = data.quantity ?? 1;
    const payload = {
      title: data.title,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      image: data.image,
      quantity,
      gameSlug: data.gameSlug ?? null,
      category: data.category ?? null,
      platform: data.platform ?? null,
    };

    const item = toPlain(
      await CartItem.findOneAndUpdate(
        { userId: req.user.id, productId },
        { $set: { userId: req.user.id, productId, ...payload } },
        { upsert: true, new: true },
      ).lean(),
    );
    return sendSuccess(res, 201, { item: serializeCartItem(item) });
  } catch (error) {
    console.error('[cart]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось добавить в корзину');
  }
});

const mergeSchema = z.object({
  items: z.array(cartItemSchema),
});

router.post('/merge', async (req, res) => {
  try {
    const parsed = mergeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные корзины');
    }
    const userId = req.user.id;

    // по одному — так проще читать
    for (const raw of parsed.data.items) {
      const productId = String(raw.productId);
      const quantity = raw.quantity ?? 1;
      const existing = toPlain(await CartItem.findOne({ userId, productId }).lean());
      if (existing) {
        await CartItem.findByIdAndUpdate(existing.id, {
          $set: {
            quantity: existing.quantity + quantity,
            title: raw.title,
            price: raw.price,
            oldPrice: raw.oldPrice ?? null,
            image: raw.image,
          },
        });
      } else {
        await CartItem.create({
          userId,
          productId,
          title: raw.title,
          price: raw.price,
          oldPrice: raw.oldPrice ?? null,
          image: raw.image,
          quantity,
          gameSlug: raw.gameSlug ?? null,
          category: raw.category ?? null,
          platform: raw.platform ?? null,
        });
      }
    }

    const items = await CartItem.find({ userId }).sort({ updatedAt: -1 }).lean();
    return sendSuccess(res, 200, { items: items.map((i) => serializeCartItem(toPlain(i))) });
  } catch (error) {
    console.error('[cart/merge]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось синхронизировать корзину');
  }
});

router.patch('/:productId', async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return sendError(res, 400, 'BAD_REQUEST', 'Некорректное количество');
    }
    const existing = toPlain(await CartItem.findOne({ userId: req.user.id, productId }).lean());
    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Товар не найден в корзине');
    }
    const item = toPlain(
      await CartItem.findByIdAndUpdate(existing.id, { $set: { quantity } }, { new: true }).lean(),
    );
    return sendSuccess(res, 200, { item: serializeCartItem(item) });
  } catch (error) {
    console.error('[cart]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось обновить количество');
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const productId = String(req.params.productId);
    await CartItem.deleteMany({ userId: req.user.id, productId });
    return sendSuccess(res, 200, { removed: true });
  } catch (error) {
    console.error('[cart]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось удалить из корзины');
  }
});

router.delete('/', async (req, res) => {
  try {
    await CartItem.deleteMany({ userId: req.user.id });
    return sendSuccess(res, 200, { cleared: true });
  } catch (error) {
    console.error('[cart]', error);
    return sendError(res, 500, 'SERVER', 'Не удалось очистить корзину');
  }
});

module.exports = router;
