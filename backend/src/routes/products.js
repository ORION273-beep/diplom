const express = require('express');
const { Product, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');
const { serializeProduct } = require('../utils/serializers');
const { isSameId } = require('../utils/ids');

const router = express.Router();

const CURRENCY_CATEGORIES = [
  'pubg-mobile',
  'genshin-impact',
  'free-fire',
  'brawl-stars',
  'minecraft',
  'roblox',
];

// фильтры из query string
function buildProductFilter(query) {
  const filter = {};

  if (typeof query.gameSlug === 'string' && query.gameSlug) {
    filter.gameSlug = query.gameSlug;
  }
  if (typeof query.category === 'string' && query.category) {
    filter.category = query.category;
  }
  if (typeof query.platform === 'string' && query.platform) {
    filter.platform = query.platform;
  }
  if (query.inStock === '1') {
    filter.inStock = true;
  }
  if (query.popular === '1' || query.sort === 'popular') {
    filter.popular = true;
  }

  const min = query.min != null ? Number(query.min) : null;
  const max = query.max != null ? Number(query.max) : null;
  if ((min != null && !Number.isNaN(min)) || (max != null && !Number.isNaN(max))) {
    filter.price = {};
    if (min != null && !Number.isNaN(min)) filter.price.$gte = min;
    if (max != null && !Number.isNaN(max)) filter.price.$lte = max;
  }

  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  if (query.discount === '1') {
    filter.oldPrice = { $ne: null };
  }

  if (query.currency === '1') {
    filter.$or = [
      { category: { $in: CURRENCY_CATEGORIES } },
      { gameSlug: { $in: CURRENCY_CATEGORIES } },
    ];
  }

  return filter;
}

function buildProductSort(sort) {
  if (sort === 'price_asc') return { price: 1 };
  if (sort === 'price_desc') return { price: -1 };
  return { _id: 1 };
}

router.get('/', async (req, res) => {
  try {
    const filter = buildProductFilter(req.query);
    const sort = typeof req.query.sort === 'string' ? req.query.sort : '';
    const onlyDiscount = req.query.discount === '1';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    let products = await Product.find(filter).sort(buildProductSort(sort)).lean();
    products = products.map(toPlain);

    // скидку в mongo не фильтруем — oldPrice > price в js
    if (onlyDiscount) {
      products = products.filter((p) => p.oldPrice != null && p.oldPrice > p.price);
    }

    const total = products.length;
    const paged = products.slice(skip, skip + limit);

    return sendSuccess(res, 200, {
      products: paged.map(serializeProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('products:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить товары');
  }
});

router.get('/:id', async (req, res) => {
  try {
    let product = toPlain(await Product.findById(req.params.id).lean());
    if (!product) {
      // костыль: иногда id приходит числом строкой
      const products = await Product.find().lean();
      product = products.map(toPlain).find((p) => isSameId(p.id, req.params.id)) ?? null;
    }
    if (!product) {
      return sendError(res, 404, 'NOT_FOUND', 'Товар не найден');
    }
    return sendSuccess(res, 200, { product: serializeProduct(product) });
  } catch (error) {
    console.error('product:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить товар');
  }
});

module.exports = router;
