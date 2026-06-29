const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Core wrapper — calls Gemini and returns text.
 * Falls back to a safe message on any error.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini error:', err.message);
    return 'Analysis unavailable at this time.';
  }
}

// ─── 1. File Explanation ─────────────────────────────────────────────────────

/**
 * Explain what a file does, its role in the codebase, and improvements.
 * @param {object} file - RepositoryFile document
 * @param {{ imports: string[], importedBy: string[] }} dependencies
 * @returns {Promise<string>}
 */
async function explainFile(file, dependencies) {
  const prompt = `You are a senior software engineer analyzing a codebase.

File: ${file.path}
Language: ${file.language}
Lines: ${file.lineCount}
Complexity Score: ${file.complexityScore}
Is Entry Point: ${file.isEntry}
Is Dead Code: ${file.isDead}
Functions: ${file.functions?.join(', ') || 'none'}
Classes: ${file.classes?.join(', ') || 'none'}

Imports: ${dependencies.imports.join(', ') || 'nothing'}
Imported by: ${dependencies.importedBy.join(', ') || 'nothing'}

File content (first 2000 chars):
${file.content?.substring(0, 2000) || 'Not available'}

Explain in 3-4 paragraphs:
1. What this file does and its role
2. Why it matters based on dependents
3. Potential concerns (complexity, dead code, coupling)
4. One actionable improvement suggestion

Be specific and technical.`;

  return callGemini(prompt);
}

// ─── 2. Onboarding Guide ─────────────────────────────────────────────────────

/**
 * Generate a structured Markdown onboarding guide for the repository.
 * @param {object} repo - Repository document
 * @param {object} metrics - RepositoryMetrics document
 * @param {object[]} topFiles - RepositoryFile documents sorted by complexity desc
 * @returns {Promise<string>}
 */
async function generateOnboardingGuide(repo, metrics, topFiles) {
  const langStr = metrics.languages
    ? JSON.stringify(Object.fromEntries(metrics.languages))
    : '{}';

  const prompt = `You are a senior engineer writing an onboarding guide.

Repository: ${repo.fullName}
Description: ${repo.description || 'No description'}
Tech Stack: ${metrics.techStack?.join(', ') || 'Unknown'}
Total Files: ${metrics.totalFiles}
Languages: ${langStr}
Health Score: ${metrics.healthScore}/100

Entry Points:
${topFiles.filter((f) => f.isEntry).map((f) => f.path).join('\n') || 'None'}

Most Important Files:
${topFiles
  .slice(0, 10)
  .map((f) => `${f.path} (complexity: ${f.complexityScore})`)
  .join('\n')}

Write a structured Markdown onboarding guide with sections:
# Onboarding Guide: ${repo.name}
## What This Codebase Does
## Tech Stack Overview  
## How The Code Is Organized
## Where To Start Reading (ordered list)
## Key Files To Understand
## Data Flow Overview
## Things To Be Aware Of

Be specific. No generic advice.`;

  return callGemini(prompt);
}

// ─── 3. Architecture Analysis ─────────────────────────────────────────────────

/**
 * Analyse the high-level architecture based on metrics and hotspots.
 * @param {object} metrics - RepositoryMetrics document
 * @param {object[]} hotspots - Top files by incoming edge count
 * @param {string[]} techStack
 * @returns {Promise<string>}
 */
async function analyzeArchitecture(metrics, hotspots, techStack) {
  const langStr = metrics.languages
    ? JSON.stringify(Object.fromEntries(metrics.languages))
    : '{}';

  const prompt = `Analyze this repository architecture.

Tech Stack: ${techStack?.join(', ') || 'Unknown'}
Health Score: ${metrics.healthScore}/100
Files: ${metrics.totalFiles}
Circular Deps: ${metrics.circularDependencies}
Dead Files: ${metrics.deadFiles}
Avg Complexity: ${metrics.averageComplexity}
Doc Score: ${metrics.documentationScore}%
Languages: ${langStr}

Top Hotspots:
${hotspots.map((h) => `${h.path}: imported by ${h.importedByCount} files`).join('\n')}

Write architecture assessment (3-5 paragraphs):
1. Architecture pattern detected
2. Strengths
3. Risk areas
4. Top 3 specific recommendations

Be direct and specific.`;

  return callGemini(prompt);
}

// ─── 4. PR Analysis ──────────────────────────────────────────────────────────

/**
 * Analyse a pull request including its dependency blast radius.
 * @param {object} pr - GitHub PR object
 * @param {string[]} changedFiles - filenames changed in the PR
 * @param {string[]} affected - files transitively affected via dependency graph
 * @returns {Promise<string>}
 */
async function analyzePR(pr, changedFiles, affected) {
  const prompt = `Analyze this pull request.

PR: ${pr.title}
Description: ${pr.body || 'None'}
Lines Added: ${pr.additions}
Lines Deleted: ${pr.deletions}

Changed Files:
${changedFiles.join('\n')}

Affected via dependency graph:
${affected.join('\n') || 'None'}

Write analysis covering:
1. What this PR does
2. Impact based on changed + affected files
3. Risk level: Low/Medium/High with reasoning
4. What reviewers should focus on

Under 200 words. Be direct.`;

  return callGemini(prompt);
}

// ─── 5. README Scorer ────────────────────────────────────────────────────────

/**
 * Score a README and return structured JSON with breakdown and suggestions.
 * @param {string} content - raw README markdown
 * @param {string} repoName
 * @returns {Promise<object>}
 */
async function scoreReadme(content, repoName) {
  const prompt = `Analyze this README. Return ONLY valid JSON, no markdown, no explanation.

README for: ${repoName}
Content: ${content.substring(0, 3000)}

Return exactly:
{
  "score": <0-100>,
  "breakdown": {
    "hasInstallation": <bool>,
    "hasUsageExamples": <bool>,
    "hasArchitectureExplanation": <bool>,
    "hasContributingGuide": <bool>,
    "hasLicense": <bool>,
    "hasScreenshots": <bool>,
    "adequateLength": <bool>
  },
  "suggestions": ["tip1","tip2","tip3"]
}`;

  const res = await callGemini(prompt);

  try {
    // Strip possible markdown code fences Gemini sometimes adds
    const clean = res.replace(/```(?:json)?\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      score: 30,
      breakdown: {
        hasInstallation: false,
        hasUsageExamples: false,
        hasArchitectureExplanation: false,
        hasContributingGuide: false,
        hasLicense: false,
        hasScreenshots: false,
        adequateLength: false,
      },
      suggestions: ['Could not analyze. Try again.'],
    };
  }
}

// ─── 6. Dependency Risk Summary ───────────────────────────────────────────────

/**
 * Summarise dependency health and highlight urgent updates.
 * @param {object[]} dependencies - array with { name, currentVersion, latestVersion,
 *   riskLevel, cveCount, weeklyDownloads, versionGap }
 * @returns {Promise<string>}
 */
async function summarizeDependencyRisks(dependencies) {
  const high = dependencies.filter((d) => d.riskLevel === 'high');
  const withCVEs = dependencies.filter((d) => d.cveCount > 0);
  const major = dependencies.filter((d) => d.versionGap?.type === 'major');

  const prompt = `You are reviewing npm dependencies.

Total analyzed: ${dependencies.length}
High risk: ${high.length}
With CVEs: ${withCVEs.length}
Need major update: ${major.length}

High Risk Packages:
${high
  .slice(0, 10)
  .map(
    (d) =>
      `- ${d.name}: ${d.currentVersion} → ${d.latestVersion} | CVEs: ${d.cveCount} | Downloads: ${d.weeklyDownloads}/week`
  )
  .join('\n')}

CVE Packages:
${withCVEs.map((d) => `- ${d.name} (${d.cveCount} vulns)`).join('\n') || 'None'}

Write dependency health summary (3-4 paragraphs):
1. Overall health assessment
2. Most urgent packages to update
3. Security concerns from CVEs
4. General team recommendation

Name specific packages. Be direct.`;

  return callGemini(prompt);
}

module.exports = {
  explainFile,
  generateOnboardingGuide,
  analyzeArchitecture,
  analyzePR,
  scoreReadme,
  summarizeDependencyRisks,
};
