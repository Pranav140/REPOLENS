const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Repository = require('../models/Repository');
const RepositoryFile = require('../models/RepositoryFile');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const githubService = require('../services/githubService');
const graphService = require('../services/graphService');
const geminiService = require('../services/geminiService');
const breakingChangeService = require('../services/breakingChangeService');

const router = express.Router();

// ─── In-memory rate limiter: 10 req/min per user ─────────────────────────────

const rateLimitMap = {};

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId.toString();

  if (!rateLimitMap[key]) rateLimitMap[key] = [];

  // Evict timestamps older than 1 minute
  rateLimitMap[key] = rateLimitMap[key].filter((t) => now - t < 60000);

  if (rateLimitMap[key].length >= 10) return false;

  rateLimitMap[key].push(now);
  return true;
}

// ─── Middleware chain ─────────────────────────────────────────────────────────

const rateLimitMiddleware = (req, res, next) => {
  if (!checkRateLimit(req.user._id)) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Maximum 10 AI requests per minute. Please wait.',
    });
  }
  next();
};

// All AI routes: authenticated + rate-limited
router.use(authenticate, rateLimitMiddleware);

// ─── Shared helper ────────────────────────────────────────────────────────────

async function findRepo(owner, name, userId, res) {
  const repo = await Repository.findOne({ owner, name, userId });
  if (!repo) {
    res.status(404).json({ error: 'Not Found', message: 'Repository not found' });
    return null;
  }
  return repo;
}

// ─── POST /api/ai/:owner/:name/explain-file ───────────────────────────────────

router.post('/:owner/:name/explain-file', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Bad Request', message: 'filePath is required' });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const file = await RepositoryFile.findOne({ repositoryId: repo._id, path: filePath });
    if (!file) {
      return res.status(404).json({ error: 'Not Found', message: 'File not found in repository' });
    }

    const dependencies = await graphService.getFileDependencies(repo._id, filePath);
    const explanation = await geminiService.explainFile(file, dependencies);

    return res.status(200).json({ explanation });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/onboarding-guide ───────────────────────────────

router.post('/:owner/:name/onboarding-guide', async (req, res, next) => {
  try {
    const { owner, name } = req.params;

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const metrics = await RepositoryMetrics.findOne({ repositoryId: repo._id });
    if (!metrics) {
      return res.status(404).json({ error: 'Not Found', message: 'Metrics not ready — analysis may still be running' });
    }

    const topFiles = await RepositoryFile.find({ repositoryId: repo._id })
      .sort({ complexityScore: -1 })
      .limit(20)
      .select('path complexityScore isEntry language');

    const guide = await geminiService.generateOnboardingGuide(repo, metrics, topFiles);

    return res.status(200).json({ guide });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/architecture-summary ──────────────────────────

router.post('/:owner/:name/architecture-summary', async (req, res, next) => {
  try {
    const { owner, name } = req.params;

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const metrics = await RepositoryMetrics.findOne({ repositoryId: repo._id });
    if (!metrics) {
      return res.status(404).json({ error: 'Not Found', message: 'Metrics not ready' });
    }

    const hotspots = await graphService.getHotspots(repo._id);
    const summary = await geminiService.analyzeArchitecture(
      metrics,
      hotspots,
      metrics.techStack || []
    );

    return res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/analyze-pr ─────────────────────────────────────

router.post('/:owner/:name/analyze-pr', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { prNumber } = req.body;

    if (!prNumber) {
      return res.status(400).json({ error: 'Bad Request', message: 'prNumber is required' });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    // Fetch PR data from GitHub
    const [pr, prFiles] = await Promise.all([
      githubService.getPullRequest(owner, name, prNumber, req.user.accessToken),
      githubService.getPRFiles(owner, name, prNumber, req.user.accessToken),
    ]);

    const changedFiles = prFiles.map((f) => f.filename);

    // Find files affected via dependency graph (importedBy each changed file)
    const affectedSet = new Set();
    await Promise.all(
      changedFiles.map(async (fp) => {
        const deps = await graphService.getFileDependencies(repo._id, fp);
        deps.importedBy.forEach((p) => affectedSet.add(p));
      })
    );
    const affected = [...affectedSet].filter((p) => !changedFiles.includes(p));

    const analysis = await geminiService.analyzePR(pr, changedFiles, affected);

    return res.status(200).json({ analysis });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/score-readme ───────────────────────────────────

router.post('/:owner/:name/score-readme', async (req, res, next) => {
  try {
    const { owner, name } = req.params;

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const readmeFile = await RepositoryFile.findOne({
      repositoryId: repo._id,
      name: { $in: ['README.md', 'readme.md', 'Readme.md'] },
    });

    if (!readmeFile || !readmeFile.content) {
      return res.status(404).json({ error: 'Not Found', message: 'README.md not found in repository' });
    }

    const result = await geminiService.scoreReadme(readmeFile.content, repo.name);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/dependency-summary ─────────────────────────────

router.post('/:owner/:name/dependency-summary', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { dependencies } = req.body;

    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'dependencies must be a non-empty array',
      });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const summary = await geminiService.summarizeDependencyRisks(dependencies);

    return res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/explain-refactor ─────────────────────────────

router.post('/:owner/:name/explain-refactor', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { findings } = req.body;

    if (!findings) {
      return res.status(400).json({ error: 'Bad Request', message: 'findings is required' });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const explanation = await geminiService.explainRefactorFindings(findings, repo.name);

    return res.status(200).json({ explanation });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/narrate-onboarding ───────────────────────────

router.post('/:owner/:name/narrate-onboarding', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { estimate } = req.body;

    if (!estimate) {
      return res.status(400).json({ error: 'Bad Request', message: 'estimate is required' });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const narration = await geminiService.narrateOnboardingEstimate(estimate, repo.name);

    return res.status(200).json({ narration });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/:owner/:name/breaking-changes ─────────────────────────────

router.post('/:owner/:name/breaking-changes', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const { prNumber } = req.body;

    if (!prNumber) {
      return res.status(400).json({ error: 'Bad Request', message: 'prNumber is required' });
    }

    const repo = await findRepo(owner, name, req.user._id, res);
    if (!repo) return;

    const token = req.user.accessToken;

    const [pr, prFiles] = await Promise.all([
      githubService.getPullRequest(owner, name, prNumber, token),
      githubService.getPRFiles(owner, name, prNumber, token)
    ]);

    const changes = await breakingChangeService.detectBreakingChanges(
      repo._id, repo.owner, repo.name, prNumber, prFiles, token
    );

    const explanation = await geminiService.explainBreakingChanges(changes, pr.title);

    return res.status(200).json({ changes, explanation });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
