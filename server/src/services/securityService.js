const RepositoryFile = require('../models/RepositoryFile');

const PATTERNS = [
  {
    regex: /password\s*=\s*['"][^'"]{3,}['"]/gi,
    severity: 'high',
    type: 'Hardcoded Password',
    description: 'Hardcoded password in source code',
  },
  {
    regex: /api_key\s*=\s*['"][^'"]{3,}['"]/gi,
    severity: 'high',
    type: 'Hardcoded API Key',
    description: 'Hardcoded API key detected',
  },
  {
    regex: /secret\s*=\s*['"][^'"]{3,}['"]/gi,
    severity: 'high',
    type: 'Hardcoded Secret',
    description: 'Hardcoded secret value detected',
  },
  {
    regex: /eval\s*\(/g,
    severity: 'high',
    type: 'Eval Usage',
    description: 'eval() risks code injection',
  },
  {
    regex: /dangerouslySetInnerHTML/g,
    severity: 'medium',
    type: 'XSS Risk',
    description: 'dangerouslySetInnerHTML XSS risk',
  },
  {
    regex: /innerHTML\s*=/g,
    severity: 'medium',
    type: 'XSS Risk',
    description: 'Direct innerHTML assignment',
  },
  {
    regex: /console\.log/g,
    severity: 'low',
    type: 'Debug Code',
    description: 'console.log in production code',
  },
  {
    regex: /TODO|FIXME|HACK/g,
    severity: 'low',
    type: 'Tech Debt',
    description: 'Unresolved tech debt marker',
  },
];

/**
 * Scan all files in a repository for security/quality issues.
 * Each pattern is tested per-line with lastIndex reset to avoid
 * stateful regex bugs across iterations.
 * @param {string} repositoryId
 * @returns {Array<{ filePath, line, severity, type, description, snippet }>}
 */
async function scanRepository(repositoryId) {
  const files = await RepositoryFile.find({
    repositoryId,
    content: { $exists: true, $ne: '' },
  });

  const issues = [];

  for (const file of files) {
    const lines = (file.content || '').split('\n');

    for (const pattern of PATTERNS) {
      lines.forEach((line, idx) => {
        pattern.regex.lastIndex = 0; // reset stateful regex
        if (pattern.regex.test(line)) {
          issues.push({
            filePath: file.path,
            line: idx + 1,
            severity: pattern.severity,
            type: pattern.type,
            description: pattern.description,
            snippet: line.trim().substring(0, 100),
          });
        }
      });
    }
  }

  return issues;
}

module.exports = { scanRepository };
