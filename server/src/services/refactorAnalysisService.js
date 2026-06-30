const RepositoryFile = require('../models/RepositoryFile');
const RepositoryEdge = require('../models/RepositoryEdge');

async function analyzeStructure(repositoryId) {
  const files = await RepositoryFile.find({ repositoryId });
  const edges = await RepositoryEdge.find({ repositoryId });

  const forwardAdj = {};
  const reverseAdj = {};
  
  for (const edge of edges) {
    if (!forwardAdj[edge.source]) forwardAdj[edge.source] = [];
    forwardAdj[edge.source].push(edge.target);
    
    if (!reverseAdj[edge.target]) reverseAdj[edge.target] = [];
    reverseAdj[edge.target].push(edge.source);
  }

  // Helper to get top-level folder
  const getFolder = (filePath) => {
    const parts = filePath.split('/');
    return parts.length > 1 ? parts[0] : '';
  };

  // FINDING 1 — God Files
  const godFilesCandidates = [];
  for (const file of files) {
    const inDegree = (reverseAdj[file.path] || []).length;
    const outDegree = (forwardAdj[file.path] || []).length;
    
    if (inDegree >= 5 && outDegree >= 5) {
      godFilesCandidates.push({
        path: file.path,
        inDegree,
        outDegree,
        totalDegree: inDegree + outDegree
      });
    }
  }
  const godFiles = godFilesCandidates
    .sort((a, b) => b.totalDegree - a.totalDegree)
    .slice(0, 5);

  // FINDING 2 — Feature Envy
  const featureEnvyCandidates = [];
  for (const file of files) {
    const imports = forwardAdj[file.path] || [];
    if (imports.length >= 3) {
      const folderCounts = {};
      let totalCount = 0;
      for (const imp of imports) {
        const impFolder = getFolder(imp);
        if (impFolder) {
          folderCounts[impFolder] = (folderCounts[impFolder] || 0) + 1;
          totalCount++;
        }
      }
      
      if (totalCount > 0) {
        let maxCount = 0;
        let dominantFolder = '';
        for (const [folder, count] of Object.entries(folderCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantFolder = folder;
          }
        }
        
        const nativeFolder = getFolder(file.path);
        const enviousPercent = Math.round((maxCount / imports.length) * 100);
        
        if (nativeFolder !== dominantFolder && enviousPercent >= 60) {
          featureEnvyCandidates.push({
            path: file.path,
            nativeFolder: nativeFolder || 'root',
            dominantFolder,
            enviousPercent
          });
        }
      }
    }
  }
  const featureEnvy = featureEnvyCandidates
    .sort((a, b) => b.enviousPercent - a.enviousPercent)
    .slice(0, 5);

  // FINDING 3 — Orphaned Clusters
  const undirectedAdj = {};
  for (const file of files) {
    undirectedAdj[file.path] = new Set();
  }
  for (const edge of edges) {
    if (undirectedAdj[edge.source]) undirectedAdj[edge.source].add(edge.target);
    if (undirectedAdj[edge.target]) undirectedAdj[edge.target].add(edge.source);
  }

  const findConnectedComponents = (filesList, adj) => {
    const visited = new Set();
    const components = [];
    for (const file of filesList) {
      if (visited.has(file.path)) continue;
      const component = [];
      const queue = [file.path];
      visited.add(file.path);
      
      while (queue.length) {
        const node = queue.shift();
        component.push(node);
        for (const neighbor of (adj[node] || [])) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(component);
    }
    return components;
  };

  const allComponents = findConnectedComponents(files, undirectedAdj);
  
  const orphanedCandidates = [];
  for (const component of allComponents) {
    if (component.length >= 2 && component.length <= 8) {
      let externalConnections = 0;
      const componentSet = new Set(component);
      
      for (const node of component) {
        // Look at forward connections to non-component nodes
        for (const outEdge of (forwardAdj[node] || [])) {
          if (!componentSet.has(outEdge)) externalConnections++;
        }
        // Look at reverse connections from non-component nodes
        for (const inEdge of (reverseAdj[node] || [])) {
          if (!componentSet.has(inEdge)) externalConnections++;
        }
      }
      
      if (externalConnections <= 2) {
        orphanedCandidates.push({
          files: component,
          externalConnections,
          size: component.length
        });
      }
    }
  }
  
  const orphanedClusters = orphanedCandidates
    .sort((a, b) => a.size - b.size)
    .slice(0, 3)
    .map(c => ({ files: c.files, externalConnections: c.externalConnections }));

  return {
    godFiles,
    featureEnvy,
    orphanedClusters
  };
}

module.exports = { analyzeStructure };
