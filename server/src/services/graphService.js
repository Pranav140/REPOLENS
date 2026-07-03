const RepositoryEdge = require('../models/RepositoryEdge');
const RepositoryFile = require('../models/RepositoryFile');

/**
 * Build an adjacency list (source → [targets]) from the stored edges.
 * @param {string} repositoryId
 * @returns {Object.<string, string[]>}
 */
async function buildAdjacencyList(repositoryId) {
  const edges = await RepositoryEdge.find({ repositoryId });
  const list = {};
  edges.forEach((e) => {
    if (!list[e.source]) list[e.source] = [];
    list[e.source].push(e.target);
  });
  return list;
}

/**
 * BFS shortest-path trace between two files in the import graph.
 * Stops searching paths longer than 10 hops.
 * @param {string} repositoryId
 * @param {string} from - source file path
 * @param {string} to   - target file path
 * @returns {string[]|null} ordered path, or null if unreachable
 */
async function traceImportChain(repositoryId, from, to) {
  const adj = await buildAdjacencyList(repositoryId);
  const queue = [[from]];
  const visited = new Set([from]);

  // Try to find the exact target node path, or fuzzy match if they typed a basename
  const edges = await RepositoryEdge.find({ repositoryId });
  const allNodes = new Set();
  edges.forEach(e => { allNodes.add(e.source); allNodes.add(e.target); });
  
  let targetPath = to;
  if (!allNodes.has(to)) {
    const matched = [...allNodes].find(p => p.endsWith('/' + to) || p === to);
    if (matched) targetPath = matched;
  }

  while (queue.length) {
    const current = queue.shift();
    const node = current[current.length - 1];

    if (node === targetPath) return current;
    if (current.length > 10) continue;

    for (const neighbor of adj[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...current, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Return all direct imports and reverse-imports for a single file.
 * @param {string} repositoryId
 * @param {string} filePath
 * @returns {{ imports: string[], importedBy: string[] }}
 */
async function getFileDependencies(repositoryId, filePath) {
  const edges = await RepositoryEdge.find({ repositoryId });
  return {
    imports: edges.filter((e) => e.source === filePath).map((e) => e.target),
    importedBy: edges.filter((e) => e.target === filePath).map((e) => e.source),
  };
}

/**
 * Return the top-10 most-imported files (hotspots) sorted by incoming edge count,
 * enriched with complexity score.
 * @param {string} repositoryId
 * @returns {Array<{ path, name, importedByCount, complexityScore }>}
 */
async function getHotspots(repositoryId) {
  const edges = await RepositoryEdge.find({ repositoryId });
  const count = {};
  edges.forEach((e) => {
    count[e.target] = (count[e.target] || 0) + 1;
  });

  const files = await RepositoryFile.find({ repositoryId });
  return files
    .map((f) => ({
      path: f.path,
      name: f.name,
      importedByCount: count[f.path] || 0,
      complexityScore: f.complexityScore,
    }))
    .sort((a, b) => b.importedByCount - a.importedByCount)
    .slice(0, 10);
}

module.exports = {
  buildAdjacencyList,
  traceImportChain,
  getFileDependencies,
  getHotspots,
};
