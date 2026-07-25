const express = require('express');
const { FaqItem, toPlain } = require('../db/models');
const { sendSuccess } = require('../utils/errors');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const items = await FaqItem.find().sort({ sort: 1 }).lean();
    return sendSuccess(res, 200, { items: items.map(toPlain) });
  } catch (error) {
    console.error('faq', error);
    return res.status(500).json({ message: 'FAQ не загрузился' });
  }
});

module.exports = router;
