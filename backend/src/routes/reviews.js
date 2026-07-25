const express = require('express');
const { z } = require('zod');
const { Review, Order, User, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const reviews = await Review.find({ published: true }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, { reviews: reviews.map(toPlain) });
  } catch (error) {
    console.error('reviews:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить отзывы');
  }
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION', 'Некорректные данные отзыва');
    }

    const completedOrder = await Order.findOne({ userId: req.user.id, status: 'completed' }).lean();
    if (!completedOrder) {
      return sendError(res, 403, 'FORBIDDEN', 'Отзыв можно оставить только после завершённого заказа');
    }

    const user = toPlain(await User.findById(req.user.id).lean());
    const author = user?.email?.split('@')[0] || 'Покупатель';

    const review = toPlain(
      (
        await Review.create({
          author,
          rating: parsed.data.rating,
          text: parsed.data.text.trim(),
          userId: req.user.id,
          published: false,
        })
      ).toObject(),
    );

    return sendSuccess(res, 201, {
      review,
      message: 'Отзыв отправлен на модерацию',
    });
  } catch (error) {
    console.error('review:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось сохранить отзыв');
  }
});

module.exports = router;
