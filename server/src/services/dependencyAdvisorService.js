const axios = require('axios');

// ── NPM registry ─────────────────────────────────────────────────────────────

async function fetchNpmData(packageName, currentVersion) {
  try {
    const res = await axios.get(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      { timeout: 5000 }
    );
    const data = res.data;
    const latest = data['dist-tags']?.latest || 'unknown';

    let weeklyDownloads = 0;
    try {
      const dl = await axios.get(
        `https://api.npmjs.org/downloads/point/last-week/${packageName}`,
        { timeout: 3000 }
      );
      weeklyDownloads = dl.data.downloads || 0;
    } catch { weeklyDownloads = 0; }

    return {
      name: packageName,
      currentVersion: currentVersion.replace(/[\^~>=<]/g, ''),
      latestVersion: latest,
      weeklyDownloads,
      lastPublished: data.time?.modified || null,
      description: data.description || '',
      npmLink: `https://www.npmjs.com/package/${packageName}`,
    };
  } catch {
    return {
      name: packageName,
      currentVersion: currentVersion.replace(/[\^~>=<]/g, ''),
      latestVersion: 'unknown',
      weeklyDownloads: 0,
      lastPublished: null,
      description: '',
      npmLink: `https://www.npmjs.com/package/${packageName}`,
    };
  }
}

// ── OSV CVE check ─────────────────────────────────────────────────────────────

async function checkCVEs(packageName) {
  try {
    const res = await axios.post(
      'https://api.osv.dev/v1/query',
      { package: { name: packageName, ecosystem: 'npm' } },
      { timeout: 5000 }
    );
    return (res.data.vulns || []).length;
  } catch { return 0; }
}

// ── Version analysis ──────────────────────────────────────────────────────────

function computeVersionGap(current, latest) {
  if (current === 'unknown' || latest === 'unknown') return null;
  const clean = v => v.replace(/[^0-9.]/g, '');
  const [cm, cn, cp] = clean(current).split('.').map(Number);
  const [lm, ln, lp] = clean(latest).split('.').map(Number);
  if (lm > cm) return { type: 'major', gap: lm - cm };
  if (ln > cn) return { type: 'minor', gap: ln - cn };
  if ((lp || 0) > (cp || 0)) return { type: 'patch', gap: (lp || 0) - (cp || 0) };
  return { type: 'current', gap: 0 };
}

function computeRiskScore(pkg, cveCount, versionGap) {
  let score = cveCount * 30;
  if (versionGap?.type === 'major') score += 20;
  else if (versionGap?.type === 'minor') score += 10;
  else if (versionGap?.type === 'patch') score += 3;

  if (pkg.weeklyDownloads < 100) score += 30;
  else if (pkg.weeklyDownloads < 1000) score += 15;

  if (pkg.lastPublished) {
    const months = (Date.now() - new Date(pkg.lastPublished)) / (1000 * 60 * 60 * 24 * 30);
    if (months > 24) score += 20;
    else if (months > 12) score += 10;
  }
  return Math.min(score, 100);
}

function getRiskLevel(score) {
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

// ── Main entry ────────────────────────────────────────────────────────────────

async function analyzeDependencies(repositoryId) {
  // Lazy-require to avoid circular deps at module load time
  const RepositoryFile = require('../models/RepositoryFile');

  const pkgFile = await RepositoryFile.findOne({ repositoryId, name: 'package.json' });
  if (!pkgFile) throw new Error('No package.json found in this repository');

  let pkg;
  try { pkg = JSON.parse(pkgFile.content); }
  catch { throw new Error('Could not parse package.json'); }

  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const entries = Object.entries(deps).slice(0, 50);
  if (entries.length === 0) return [];

  // Fetch npm registry data in batches of 10
  const npmResults = [];
  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(([name, ver]) => fetchNpmData(name, ver))
    );
    npmResults.push(...results);
  }

  // Check CVEs in batches of 10
  const cveMap = {};
  for (let i = 0; i < npmResults.length; i += 10) {
    const batch = npmResults.slice(i, i + 10);
    const counts = await Promise.all(batch.map(p => checkCVEs(p.name)));
    batch.forEach((p, idx) => { cveMap[p.name] = counts[idx]; });
  }

  const analyzed = npmResults.map(p => {
    const cveCount   = cveMap[p.name] || 0;
    const versionGap = computeVersionGap(p.currentVersion, p.latestVersion);
    const riskScore  = computeRiskScore(p, cveCount, versionGap);
    return {
      ...p,
      cveCount,
      versionGap,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      isOutdated: versionGap?.type !== 'current' && versionGap !== null,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  return analyzed;
}

module.exports = { analyzeDependencies };
