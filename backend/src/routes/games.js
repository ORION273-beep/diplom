const express = require('express');
const { Game, toPlain } = require('../db/models');
const { sendError, sendSuccess } = require('../utils/errors');

const router = express.Router();

function toGame(g) {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    cover: g.cover,
    genres: Array.isArray(g.genres) ? g.genres : [],
    platforms: Array.isArray(g.platforms) ? g.platforms : [],
    description: g.description ?? '',
    popular: g.popular,
  };
}

router.get('/', async (_req, res) => {
  try {
    const games = await Game.find().sort({ _id: 1 }).lean();
    return sendSuccess(res, 200, { games: games.map((g) => toGame(toPlain(g))) });
  } catch (error) {
    console.error('games:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить игры');
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const game = toPlain(await Game.findOne({ slug: req.params.slug }).lean());
    if (!game) {
      return sendError(res, 404, 'NOT_FOUND', 'Игра не найдена');
    }
    return sendSuccess(res, 200, { game: toGame(game) });
  } catch (error) {
    console.error('game:', error);
    return sendError(res, 500, 'SERVER', 'Не удалось загрузить игру');
  }
});

module.exports = router;
