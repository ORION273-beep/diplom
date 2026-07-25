const express = require('express');
const { Category, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find().sort({ _id: 1 }).lean();
    return sendSuccess(res, 200, {
      categories: categories.map((c) => {
        const row = toPlain(c);
        return {
          id: row.id,
          name: row.name,
          icon: row.icon ?? null,
          type: row.type ?? null,
        };
      }),
    });
  } catch (error) {
    console.error('categories:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить категории');
  }
});

module.exports = router;
