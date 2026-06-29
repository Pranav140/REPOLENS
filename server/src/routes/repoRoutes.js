const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const githubService = require('../services/githubService');
const analysisService = require('../services/analysisService');

const router = express.Router();

// All repo routes require a valid JWT
router.use(authenticate);

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Find a repo owned by the authenticated user or return 404.
 */
async function findRepo(owner, name, userId, res) {
  const repo = await Repository.findOne({ owner, name, userId });
  if (!repo) {
    res.status(404).json({ error: 'Not Found', message: 'Repository not found' });
    return null;
  }
  return repo;
}

// ─── POST /api/repos/import ──────────────────────────────────────────────────

router.post('/import', async (req, res, next) => {
  try {
    const { owner, name } = req.body;
    const userId = req.user._id;

    if (!owner || !name) {
      return res
        .status(400)
        .json({ error: 'Bad Request', message: 'owner and name are required' });
    }

    // Return existing repo if already imported
    const existing = await Repository.findOne({ owner, name, userId });
    if (existing) {
      return res.status(200).json({
        repository: existing,
        message: 'Repository already imported',
      });
    }

    // Validate that the repo exists on GitHub
    let ghRepo;
    try {
      ghRepo = await githubService.getRepository(owner, name, req.user.accessToken);
    } catch {
      return res
        .status(404)
        .json({ error: 'Not Found', message: 'Repository not found on GitHub' });
    }

    const repo = await Repository.create({
      owner,
      name,
      fullName: `${owner}/${name}`,
      description: ghRepo.description || '',
      language: ghRepo.language || '',
      stars: ghRepo.stargazers_count || 0,
      forks: ghRepo.forks_count || 0,
      isPrivate: ghRepo.private || false,
      userId,
      status: 'pending',
    });

    // Fire-and-forget analysis
    analysisService
      .analyzeRepository(repo._id.toString(), userId.toString())
      .catch(console.error);

    return res.status(201).json({
      repository: repo,
      message: 'Analysis started',
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos ──────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const repos = await Repository.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(repos);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name ─────────────────────────────────────────────

router.get('/:owner/:name', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const metrics = await RepositoryMetrics.findOne({ repositoryId: repo._id });

    return res.status(200).json({ repository: repo, metrics });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/files ───────────────────────────────────────

router.get('/:owner/:name/files', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    let query = { repositoryId: repo._id };
    if (req.query.dead === 'true') {
      query.isDead = true;
    }

    const files = await RepositoryFile.find(query).select('-content');
    return res.status(200).json(files);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/edges ───────────────────────────────────────

router.get('/:owner/:name/edges', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const edges = await RepositoryEdge.find({ repositoryId: repo._id }).limit(500);
    return res.status(200).json(edges);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/metrics ─────────────────────────────────────

router.get('/:owner/:name/metrics', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const metrics = await RepositoryMetrics.findOne({ repositoryId: repo._id });
    return res.status(200).json(metrics);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/status ──────────────────────────────────────

router.get('/:owner/:name/status', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    return res.status(200).json({
      status: repo.status,
      analyzedAt: repo.analyzedAt,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/repos/:owner/:name ──────────────────────────────────────────

router.delete('/:owner/:name', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const repoId = repo._id;

    await Promise.all([
      Repository.findByIdAndDelete(repoId),
      RepositoryFile.deleteMany({ repositoryId: repoId }),
      RepositoryEdge.deleteMany({ repositoryId: repoId }),
      RepositoryMetrics.deleteMany({ repositoryId: repoId }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/repos/:owner/:name/reanalyze ──────────────────────────────────

router.post('/:owner/:name/reanalyze', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const repoId = repo._id;

    // Reset status
    repo.status = 'pending';
    await repo.save();

    // Purge previous analysis data
    await Promise.all([
      RepositoryFile.deleteMany({ repositoryId: repoId }),
      RepositoryEdge.deleteMany({ repositoryId: repoId }),
      RepositoryMetrics.deleteMany({ repositoryId: repoId }),
    ]);

    // Fire-and-forget
    analysisService
      .analyzeRepository(repoId.toString(), req.user._id.toString())
      .catch(console.error);

    return res.status(200).json({ message: 'Reanalysis started' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
