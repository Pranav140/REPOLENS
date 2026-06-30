const RepositoryFile = require('../models/RepositoryFile');
const githubService = require('./githubService');

function extractFunctionSignatures(content) {
  const signatures = [];
  
  const patterns = [
    /export\s+function\s+(\w+)\s*\(([^)]*)\)/g,
    /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)/g,
    /function\s+(\w+)\s*\(([^)]*)\)/g
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      signatures.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(Boolean)
      });
    }
  }
  
  return signatures;
}

async function detectBreakingChanges(repositoryId, owner, repoName, prNumber, changedFiles, token) {
  const results = [];

  for (const changedFile of changedFiles) {
    if (changedFile.status !== 'modified') continue;
    
    const currentFile = await RepositoryFile.findOne({
      repositoryId, path: changedFile.filename
    });
    if (!currentFile) continue;
    
    const newSignatures = extractFunctionSignatures(currentFile.content || '');
    
    // To get the base ref, we need the PR object
    const pr = await githubService.getPullRequest(owner, repoName, prNumber, token);
    if (!pr || !pr.base || !pr.base.sha) continue;
    
    const beforeContent = await githubService.getFileContentAtRef(
      owner, repoName, changedFile.filename, pr.base.sha, token
    );
    
    if (!beforeContent) continue;
    
    const oldSignatures = extractFunctionSignatures(beforeContent);
    
    for (const oldSig of oldSignatures) {
      const newSig = newSignatures.find(s => s.name === oldSig.name);
      if (!newSig) continue; 
      
      const paramsChanged = JSON.stringify(oldSig.params) !== JSON.stringify(newSig.params);
      
      if (paramsChanged) {
        const allFiles = await RepositoryFile.find({ repositoryId });
        const callers = allFiles.filter(f => 
          f.path !== changedFile.filename &&
          (f.content || '').includes(`${oldSig.name}(`)
        ).map(f => f.path);
        
        const callersModifiedInPR = callers.filter(c => 
          changedFiles.some(cf => cf.filename === c)
        );
        
        let risk = 'low';
        if (callers.length > 0) {
          if (callers.length - callersModifiedInPR.length > 0) {
            risk = 'high';
          } else {
            risk = 'medium';
          }
        }
        
        results.push({
          functionName: oldSig.name,
          file: changedFile.filename,
          oldParams: oldSig.params,
          newParams: newSig.params,
          callerFiles: callers,
          callersModifiedInPR,
          risk
        });
      }
    }
  }

  return results;
}

module.exports = { detectBreakingChanges, extractFunctionSignatures };
