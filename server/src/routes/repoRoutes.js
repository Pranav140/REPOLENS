const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const githubService = require('../services/githubService');
const analysisService = require('../services/analysisService');
const dependencyAdvisorService = require('../services/dependencyAdvisorService');
const blastRadiusService = require('../services/blastRadiusService');
const refactorAnalysisService = require('../services/refactorAnalysisService');
const onboardingEstimateService = require('../services/onboardingEstimateService');

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
      const userWithToken = await require('../models/User').findById(req.user._id);
      ghRepo = await githubService.getRepository(owner, name, userWithToken.accessToken);
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

// ─── GET /api/repos/github-repos ───────────────────────────────────────────────

router.get('/github-repos', async (req, res, next) => {
  try {
    const userWithToken = await require('../models/User').findById(req.user._id);
    const { data } = await require('axios').get('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${userWithToken.accessToken}`,
        'User-Agent': 'RepoLens',
      },
    });
    // Filter out minimal details
    const repos = data.map(r => ({
      id: r.id,
      name: r.name,
      owner: r.owner.login,
      fullName: r.full_name,
      private: r.private,
      language: r.language,
    }));
    return res.status(200).json(repos);
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

// ─── GET /api/repos/:owner/:name/dependencies ────────────────────────────────

router.get('/:owner/:name/dependencies', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const result = await dependencyAdvisorService.analyzeDependencies(repo._id);

    const high     = result.filter(d => d.riskLevel === 'high').length;
    const medium   = result.filter(d => d.riskLevel === 'medium').length;
    const low      = result.filter(d => d.riskLevel === 'low').length;
    const withCVEs = result.filter(d => d.cveCount > 0).length;
    const outdated = result.filter(d => d.isOutdated).length;

    return res.status(200).json({
      dependencies: result,
      summary: { total: result.length, high, medium, low, withCVEs, outdated },
    });
  } catch (err) {
    // Surface user-friendly errors (no package.json etc.)
    if (err.message.includes('package.json')) {
      return res.status(404).json({ error: 'Not Found', message: err.message });
    }
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/blast-radius ────────────────────────────────

router.get('/:owner/:name/blast-radius', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const userWithToken = await require('../models/User').findById(req.user._id);
    const results = await blastRadiusService.computeBlastRadius(
      repo._id, repo.owner, repo.name, userWithToken.accessToken
    );

    return res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/refactor-analysis ───────────────────────────

router.get('/:owner/:name/refactor-analysis', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const findings = await refactorAnalysisService.analyzeStructure(repo._id);

    return res.status(200).json({ findings });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:owner/:name/onboarding-estimate ─────────────────────────

router.get('/:owner/:name/onboarding-estimate', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const metrics = await RepositoryMetrics.findOne({ repositoryId: repo._id });
    const files = await RepositoryFile.find({ repositoryId: repo._id });
    
    if (!metrics || files.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Metrics or files not found' });
    }

    const estimate = onboardingEstimateService.estimateOnboardingTime(metrics, files);

    return res.status(200).json({ estimate });
  } catch (err) {
    next(err);
  }
});

// GET /api/repos/:owner/:name/commits
// Fetch recent commits (up to 50)
router.get('/:owner/:name/commits', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const token = req.user.accessToken;
    const repo = await getDbRepo(owner, name);
    if (!repo) return;
    const commits = await githubService.getRecentCommits(owner, name, token, 50);
    return res.status(200).json({ commits });
  } catch (err) {
    next(err);
  }
});

// GET /api/repos/:owner/:name/commits/:sha
// Fetch detailed commit info and status
router.get('/:owner/:name/commits/:sha', async (req, res, next) => {
  try {
    const { owner, name, sha } = req.params;
    const token = req.user.accessToken;
    const repo = await getDbRepo(owner, name);
    if (!repo) return;
    
    const [commitInfo, statusInfo] = await Promise.all([
      githubService.getCommit(owner, name, sha, token),
      githubService.getCommitStatus(owner, name, sha, token)
    ]);
    
    return res.status(200).json({ commit: commitInfo, status: statusInfo });
  } catch (err) {
    next(err);
  }
});

// GET /api/repos/:owner/:name/file
// Fetch file content
router.get('/:owner/:name/file', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: 'Bad Request', message: 'Query param "path" is required' });
    }
    const token = req.user.accessToken;
    const repo = await getDbRepo(owner, name);
    if (!repo) return;
    
    const content = await githubService.getFileContent(owner, name, path, token);
    return res.status(200).json({ content });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
