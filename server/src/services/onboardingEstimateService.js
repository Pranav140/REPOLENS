function buildReason(folder) {
  if (folder.complexity > 20) return 'High complexity area';
  if (folder.docScore < 20) return 'Low documentation';
  if (folder.fileCount > 20) return 'Large surface area';
  return 'Standard complexity';
}

function estimateOnboardingTime(metrics, files) {
  // STEP 1 — Base time from file count
  let baseDays = 0;
  if (metrics.totalFiles < 50) baseDays = 1;
  else if (metrics.totalFiles < 150) baseDays = 3;
  else if (metrics.totalFiles < 300) baseDays = 5;
  else baseDays = 8;

  // STEP 2 — Complexity adjustment
  if (metrics.averageComplexity > 20) baseDays *= 1.5;
  else if (metrics.averageComplexity > 10) baseDays *= 1.2;

  // STEP 3 — Documentation adjustment (inverse — less docs = more time)
  if (metrics.documentationScore < 20) baseDays *= 1.4;
  else if (metrics.documentationScore < 50) baseDays *= 1.15;

  // STEP 4 — Circular dependency penalty (confusing to trace)
  baseDays += Math.min(metrics.circularDependencies * 0.3, 2);

  const totalDays = Math.round(baseDays * 10) / 10;

  // STEP 5 — Break down by folder/area
  const folderStats = {};
  for (const file of files) {
    const parts = file.path.split('/');
    if (parts.length > 1) {
      const folder = parts[0];
      if (!folderStats[folder]) {
        folderStats[folder] = { files: [], complexitySum: 0, docSum: 0 };
      }
      folderStats[folder].files.push(file);
      folderStats[folder].complexitySum += (file.complexityScore || 0);
      folderStats[folder].docSum += ((file.content || '').includes('/**') ? 1 : 0);
    }
  }
  
  const breakdown = [];
  for (const [folder, stats] of Object.entries(folderStats)) {
    const fileCount = stats.files.length;
    if (fileCount >= 2) {
      const folderComplexity = stats.complexitySum / fileCount;
      const folderDocScore = (stats.docSum / fileCount) * 100;
      
      let folderDays = (fileCount / metrics.totalFiles) * totalDays;
      
      if (folderComplexity > metrics.averageComplexity * 1.5) folderDays *= 1.2;
      if (folderComplexity < metrics.averageComplexity * 0.5) folderDays *= 0.8;
      
      // Round to nearest 0.5 day, minimum 0.5
      folderDays = Math.max(0.5, Math.round(folderDays * 2) / 2);
      
      breakdown.push({
        folder,
        days: folderDays,
        complexity: folderComplexity,
        docScore: folderDocScore,
        fileCount
      });
    }
  }

  breakdown.sort((a, b) => b.days - a.days);
  const top6 = breakdown.slice(0, 6).map(b => ({
    folder: b.folder,
    days: b.days,
    complexity: b.complexity,
    reason: buildReason(b)
  }));

  return {
    totalDays,
    level: 'mid-level developer',
    breakdown: top6
  };
}

module.exports = { estimateOnboardingTime };
