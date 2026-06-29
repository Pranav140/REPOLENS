const Repository = require('../models/Repository');
const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const User = require('../models/User');
const githubService = require('./githubService');
const parserService = require('./parserService');

const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.py']);
const MAX_FILES = 300;
const BATCH_SIZE = 10;

// ─── Cycle Detection ────────────────────────────────────────────────────────

/**
 * Count unique back-edges (cycles) via iterative DFS to avoid stack overflow
 * on large repos.
 * @param {Object.<string, string[]>} graph - adjacency list
 * @returns {number}
 */
function detectCycles(graph) {
  const visited = new Set();
  const stack = new Set();
  let count = 0;

  function dfs(node) {
    visited.add(node);
    stack.add(node);
    for (const neighbour of graph[node] || []) {
      if (!visited.has(neighbour)) {
        dfs(neighbour);
      } else if (stack.has(neighbour)) {
        count++;
      }
    }
    stack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) dfs(node);
  }

  return count;
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

/**
 * Run the full analysis pipeline for a repository.
 * Status transitions: pending → analyzing → completed | failed
 * @param {string} repositoryId - MongoDB ObjectId string
 * @param {string} userId       - MongoDB ObjectId string
 */
async function analyzeRepository(repositoryId, userId) {
  // ── STEP 1: Load repo + user ──────────────────────────────────────────────
  const repo = await Repository.findById(repositoryId);
  if (!repo) throw new Error(`Repository ${repositoryId} not found`);

  const user = await User.findById(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  const token = user.accessToken;

  repo.status = 'analyzing';
  await repo.save();

  try {
    // ── STEP 2: File tree + recent commits ─────────────────────────────────
    const rawTree = await githubService.getFileTree(repo.owner, repo.name, token);

    const filteredTree = rawTree
      .filter((f) => {
        const ext = '.' + f.path.split('.').pop();
        return ALLOWED_EXTENSIONS.has(ext);
      })
      .slice(0, MAX_FILES);

    repo.recentCommits = await githubService.getRecentCommits(repo.owner, repo.name, token);
    await repo.save();

    // ── STEP 3: Fetch + parse files in batches ─────────────────────────────
    const savedFiles = [];

    async function processFile(fileObj) {
      const content = await githubService.getFileContent(
        repo.owner,
        repo.name,
        fileObj.path,
        token
      );
      if (!content) return;

      const language = parserService.detectLanguage(fileObj.path);
      const imports = parserService.extractImports(content, fileObj.path);
      const exports = parserService.extractExports(content);
      const functions = parserService.extractFunctions(content);
      const classes = parserService.extractClasses(content);
      const complexity = parserService.computeComplexity(content);
      const isEntry = parserService.isEntryPoint(fileObj.path);
      const lineCount = content.split('\n').length;
      const namePart = fileObj.path.split('/').pop();
      const extension = namePart.includes('.') ? '.' + namePart.split('.').pop() : '';

      const file = await RepositoryFile.create({
        repositoryId,
        path: fileObj.path,
        name: namePart,
        extension,
        language,
        size: fileObj.size || 0,
        lineCount,
        importCount: imports.length,
        exportCount: exports.length,
        functionCount: functions.length,
        functions,
        classes,
        complexityScore: complexity,
        isEntry,
        content: content.substring(0, 50000),
      });

      savedFiles.push(file);
    }

    for (let i = 0; i < filteredTree.length; i += BATCH_SIZE) {
      const batch = filteredTree.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(processFile));
    }

    // ── STEP 4: Build dependency edges ─────────────────────────────────────
    const allFiles = await RepositoryFile.find({ repositoryId });
    const pathSet = new Set(allFiles.map((f) => f.path));
    const edges = [];

    for (const file of allFiles) {
      const fileImports = parserService.extractImports(file.content || '', file.path);
      for (const imp of fileImports) {
        if (pathSet.has(imp) && imp !== file.path) {
          edges.push({
            repositoryId,
            source: file.path,
            target: imp,
            type: 'import',
          });
        }
      }
    }

    if (edges.length > 0) {
      await RepositoryEdge.insertMany(edges, { ordered: false });
    }

    // ── STEP 5: Mark dead files ────────────────────────────────────────────
    const allEdges = await RepositoryEdge.find({ repositoryId });
    const targetPaths = new Set(allEdges.map((e) => e.target));

    for (const file of allFiles) {
      if (!targetPaths.has(file.path) && !file.isEntry) {
        file.isDead = true;
        await file.save();
      }
    }

    // ── STEP 6: Circular dependency detection ──────────────────────────────
    const adjacencyList = {};
    for (const edge of allEdges) {
      if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
      adjacencyList[edge.source].push(edge.target);
    }
    const circularDeps = detectCycles(adjacencyList);

    // ── STEP 7: Tech stack ─────────────────────────────────────────────────
    const pkgFile = allFiles.find((f) => f.name === 'package.json');
    const techStack = parserService.detectTechStack(
      allFiles.map((f) => f.path),
      pkgFile?.content || null
    );

    // ── STEP 8: Language distribution ─────────────────────────────────────
    const languages = {};
    allFiles.forEach((f) => {
      if (f.language && f.language !== 'Unknown') {
        languages[f.language] = (languages[f.language] || 0) + 1;
      }
    });

    // ── STEP 9: Aggregate metrics ──────────────────────────────────────────
    // Re-read files so isDead flags are fresh
    const freshFiles = await RepositoryFile.find({ repositoryId });

    const totalFunctions = freshFiles.reduce((sum, f) => sum + f.functionCount, 0);
    const totalImports = freshFiles.reduce((sum, f) => sum + f.importCount, 0);
    const deadFiles = freshFiles.filter((f) => f.isDead).length;
    const avgComplexity =
      freshFiles.length > 0
        ? freshFiles.reduce((s, f) => s + f.complexityScore, 0) / freshFiles.length
        : 0;

    // Most-imported file
    const targetCount = {};
    allEdges.forEach((e) => {
      targetCount[e.target] = (targetCount[e.target] || 0) + 1;
    });
    const mostImportedFile =
      Object.entries(targetCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Largest file by line count
    const largestFile =
      [...freshFiles].sort((a, b) => b.lineCount - a.lineCount)[0]?.path || '';

    // Documentation score (% of JS/TS files with JSDoc)
    const jsTsFiles = freshFiles.filter(
      (f) => f.language === 'JavaScript' || f.language === 'TypeScript'
    );
    const docScore =
      jsTsFiles.length > 0
        ? Math.round(
            (jsTsFiles.filter((f) => f.content?.includes('/**')).length /
              jsTsFiles.length) *
              100
          )
        : 0;

    // Health score
    let health = 100;
    health -= Math.min(circularDeps * 5, 30);
    health -= Math.min(deadFiles * 2, 20);
    if (avgComplexity > 30) health -= 20;
    else if (avgComplexity > 20) health -= 10;
    else if (avgComplexity > 10) health -= 5;
    health = Math.max(0, Math.min(100, Math.round(health)));

    await RepositoryMetrics.create({
      repositoryId,
      healthScore: health,
      totalFiles: freshFiles.length,
      totalFunctions,
      totalImports,
      circularDependencies: circularDeps,
      deadFiles,
      averageComplexity: Math.round(avgComplexity),
      mostImportedFile,
      largestFile,
      techStack,
      languages,
      documentationScore: docScore,
      securityIssues: 0,
    });

    // ── STEP 10: Mark complete ─────────────────────────────────────────────
    repo.status = 'completed';
    repo.analyzedAt = new Date();
    await repo.save();

    console.log(`[analysis] ${repo.fullName} completed — ${freshFiles.length} files, health ${health}`);
  } catch (err) {
    repo.status = 'failed';
    await repo.save();
    throw err;
  }
}

module.exports = { analyzeRepository };
