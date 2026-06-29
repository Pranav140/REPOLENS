const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const { searchRepository } = require('../services/searchService');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/search/:owner/:name
 * Query params:
 *   q    — search query (min 2 chars)
 *   type — 'file' | 'function' | 'class' | 'all' (default: 'all')
 */
router.get('/:owner/:name', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { q, type } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "q" must be at least 2 characters',
      });
    }

    const repo = await Repository.findOne({ owner, name, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Not Found', message: 'Repository not found' });
    }

    const results = await searchRepository(repo._id, q, type || 'all');

    return res.status(200).json({ results, count: results.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
