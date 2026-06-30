const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');
const githubService = require('./githubService');

async function computeBlastRadius(repositoryId, owner, repoName, token) {
  // STEP 1 — Build full adjacency list (reverse direction)
  const edges = await RepositoryEdge.find({ repositoryId });
  const reverseAdj = {};
  for (const edge of edges) {
    if (!reverseAdj[edge.target]) {
      reverseAdj[edge.target] = [];
    }
    reverseAdj[edge.target].push(edge.source);
  }

  // STEP 2 — Transitive downstream count
  function getTransitiveDependents(filePath) {
    const visited = new Set();
    const queue = [filePath];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const dependent of (reverseAdj[current] || [])) {
        if (!visited.has(dependent)) {
          visited.add(dependent);
          queue.push(dependent);
        }
      }
    }
    return Array.from(visited);
  }

  // STEP 3 — Load all RepositoryFiles for this repo
  const files = await RepositoryFile.find({ repositoryId });
  const entryPoints = new Set(files.filter(f => f.isEntry).map(f => f.path));
  
  // Create a map for quick complexity lookup
  const complexityMap = {};
  for (const f of files) {
    complexityMap[f.path] = f.complexityScore || 0;
  }

  const results = [];

  // STEP 4 — Compute for each file
  for (const file of files) {
    const transitiveDependents = getTransitiveDependents(file.path);
    const dependentCount = transitiveDependents.length;
    const entryPointsAffected = transitiveDependents.filter(d => entryPoints.has(d)).length;
    
    let totalComplexity = 0;
    for (const d of transitiveDependents) {
      totalComplexity += (complexityMap[d] || 0);
    }
    const avgDependentComplexity = dependentCount > 0 ? totalComplexity / dependentCount : 0;

    results.push({
      path: file.path,
      name: file.name,
      dependentCount,
      entryPointsAffected,
      avgDependentComplexity,
      commitFrequency: 0, // Default, will update for top 15
      score: 0,
      reason: '',
      riskLevel: 'low',
    });
  }

  // Sort by dependentCount descending
  results.sort((a, b) => b.dependentCount - a.dependentCount);

  // STEP 5 — Identify top 15 candidates
  const top15 = results.slice(0, 15);
  
  for (const file of top15) {
    file.commitFrequency = await githubService.getFileCommitFrequency(
      owner, repoName, file.path, token
    );
  }

  // STEP 6 — Compute blast radius score
  function computeScore(file) {
    let score = 0;
    score += Math.min(file.dependentCount * 4, 40);
    score += Math.min(file.entryPointsAffected * 10, 25);
    score += Math.min(file.avgDependentComplexity * 0.5, 15);
    score += Math.min(file.commitFrequency * 1.5, 20);
    return Math.min(Math.round(score), 100);
  }

  // STEP 7 — Build human-readable reason
  function buildReason(file) {
    const parts = [];
    if (file.dependentCount > 0) {
      parts.push(`${file.dependentCount} files depend on this transitively`);
    }
    if (file.entryPointsAffected > 0) {
      parts.push(`including ${file.entryPointsAffected} entry point${file.entryPointsAffected > 1 ? 's' : ''}`);
    }
    if (file.commitFrequency > 5) {
      parts.push(`changed ${file.commitFrequency}+ times recently`);
    }
    return parts.join(', ') || 'Low impact file';
  }

  for (const file of top15) {
    file.score = computeScore(file);
    file.reason = buildReason(file);
    file.riskLevel = file.score >= 60 ? 'high' : file.score >= 30 ? 'medium' : 'low';
  }
  
  // Re-sort the top 15 by score descending
  top15.sort((a, b) => b.score - a.score);

  // STEP 8 — Return top 15
  return top15.map(f => ({
    path: f.path,
    name: f.name,
    dependentCount: f.dependentCount,
    entryPointsAffected: f.entryPointsAffected,
    commitFrequency: f.commitFrequency,
    score: f.score,
    reason: f.reason,
    riskLevel: f.riskLevel
  }));
}

module.exports = { computeBlastRadius };
