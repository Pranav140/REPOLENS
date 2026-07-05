const RepositoryFile = require('../models/RepositoryFile');

/**
 * Search repository files, functions, and classes by query string.
 * @param {string} repositoryId
 * @param {string} query - minimum 2 chars
 * @param {string} [type] - 'file' | 'function' | 'class' | 'all'
 * @returns {Array}
 */
async function searchRepository(repositoryId, query, type) {
  if (!query || query.length < 2) return [];

  const lower = query.toLowerCase();
  const allFiles = await RepositoryFile.find({ repositoryId });
  const results = [];

  for (const file of allFiles) {
    // Match filename
    if (file.name.toLowerCase().includes(lower)) {
      results.push({
        path: file.path,
        name: file.name,
        type: 'file',
        language: file.language,
        matchedOn: 'filename',
        isDead: file.isDead,
        isEntry: file.isEntry,
        complexityScore: file.complexityScore,
        lineCount: file.lineCount,
        functionCount: file.functions?.length || 0,
      });
    }

    // Match function names
    for (const fn of file.functions || []) {
      if (fn.toLowerCase().includes(lower)) {
        results.push({
          path: file.path,
          name: fn,
          type: 'function',
          language: file.language,
          matchedOn: 'function',
        });
      }
    }

    // Match class names
    for (const cls of file.classes || []) {
      if (cls.toLowerCase().includes(lower)) {
        results.push({
          path: file.path,
          name: cls,
          type: 'class',
          language: file.language,
          matchedOn: 'class',
        });
      }
    }
  }

  // Optional type filter
  const filtered =
    type && type !== 'all' ? results.filter((r) => r.type === type) : results;

  // Deduplicate by path+name
  const seen = new Set();
  return filtered
    .filter((r) => {
      const key = `${r.path}-${r.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

module.exports = { searchRepository };
