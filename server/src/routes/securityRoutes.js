const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const { scanRepository } = require('../services/securityService');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/security/:owner/:name
 * Returns all security/quality issues found in the repository
 * along with a severity summary.
 */
router.get('/:owner/:name', async (req, res, next) => {
  try {
    const { owner, name } = req.params;

    const repo = await Repository.findOne({ owner, name, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Not Found', message: 'Repository not found' });
    }

    const issues = await scanRepository(repo._id);

    const summary = {
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
      total: issues.length,
    };

    return res.status(200).json({ issues, summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
