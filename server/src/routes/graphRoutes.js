const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');
const {
  traceImportChain,
  getFileDependencies,
  getHotspots,
} = require('../services/graphService');

const router = express.Router();

router.use(authenticate);

/** Shared helper — find repo or respond 404. */
async function findRepo(owner, name, userId, res) {
  const repo = await Repository.findOne({ owner, name, userId });
  if (!repo) {
    res.status(404).json({ error: 'Not Found', message: 'Repository not found' });
    return null;
  }
  return repo;
}

// ─── GET /api/graph/:owner/:name ─────────────────────────────────────────────
// Full graph payload: nodes (files) + edges

router.get('/:owner/:name', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const [nodes, edges] = await Promise.all([
      RepositoryFile.find({ repositoryId: repo._id }).select(
        'path name language complexityScore isDead isEntry importCount'
      ),
      RepositoryEdge.find({ repositoryId: repo._id }).limit(500),
    ]);

    return res.status(200).json({ nodes, edges });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/graph/:owner/:name/trace ───────────────────────────────────────
// BFS shortest import chain between two files

router.get('/:owner/:name/trace', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query params "from" and "to" are required',
      });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const result = await traceImportChain(repo._id, from, to);

    return res.status(200).json({ path: result, found: result !== null });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/graph/:owner/:name/file ────────────────────────────────────────
// Direct imports + reverse imports for a single file

router.get('/:owner/:name/file', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query param "path" is required',
      });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const deps = await getFileDependencies(repo._id, filePath);

    return res.status(200).json(deps);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/graph/:owner/:name/hotspots ────────────────────────────────────
// Top-10 most-imported files

router.get('/:owner/:name/hotspots', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const hotspots = await getHotspots(repo._id);

    return res.status(200).json({ hotspots });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
