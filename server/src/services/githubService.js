const axios = require('axios');

const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'vendor',
  '__pycache__',
  '.cache',
];

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: { Accept: 'application/vnd.github.v3+json' },
});

/**
 * Returns Authorization header config for authenticated requests.
 * @param {string} token - GitHub personal access token
 */
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'RepoLens' },
});

/**
 * Fetch basic repository metadata.
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {{ name, description, language, stargazers_count, forks_count, private }}
 */
async function getRepository(owner, repo, token) {
  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}`, authHeader(token));
    return {
      name: data.name,
      description: data.description,
      language: data.language,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      private: data.private,
    };
  } catch (err) {
    throw new Error(`getRepository failed for ${owner}/${repo}: ${err.message}`);
  }
}

/**
 * Fetch the full recursive file tree, filtered to blobs only,
 * excluding common noise directories.
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {Array<{ path, type, size }>}
 */
async function getFileTree(owner, repo, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      authHeader(token)
    );

    return data.tree
      .filter((item) => {
        if (item.type !== 'blob') return false;
        return !EXCLUDED_PATHS.some((excluded) => item.path.includes(excluded));
      })
      .map(({ path, type, size }) => ({ path, type, size }));
  } catch (err) {
    throw new Error(`getFileTree failed for ${owner}/${repo}: ${err.message}`);
  }
}

/**
 * Fetch and decode a single file's content.
 * Returns null for files larger than 50 KB or on any error.
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath
 * @param {string} token
 * @returns {string|null}
 */
async function getFileContent(owner, repo, filePath, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/contents/${filePath}`,
      authHeader(token)
    );

    if (data.size > 50000) return null;

    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Fetch the 10 most recent commits.
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {Array<{ sha, message, author, date }>}
 */
async function getRecentCommits(owner, repo, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/commits?per_page=10`,
      authHeader(token)
    );

    return data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));
  } catch (err) {
    throw new Error(`getRecentCommits failed for ${owner}/${repo}: ${err.message}`);
  }
}

/**
 * Fetch a single pull request by number.
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} token
 * @returns {object} Full PR object from GitHub API
 */
async function getPullRequest(owner, repo, prNumber, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
      authHeader(token)
    );
    return data;
  } catch (err) {
    throw new Error(`getPullRequest failed for ${owner}/${repo}#${prNumber}: ${err.message}`);
  }
}

/**
 * Fetch the list of files changed in a pull request.
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} token
 * @returns {Array<{ filename, status, additions, deletions }>}
 */
async function getPRFiles(owner, repo, prNumber, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      authHeader(token)
    );

    return data.map(({ filename, status, additions, deletions }) => ({
      filename,
      status,
      additions,
      deletions,
    }));
  } catch (err) {
    throw new Error(`getPRFiles failed for ${owner}/${repo}#${prNumber}: ${err.message}`);
  }
}

/**
 * Fetch the number of commits that touched a specific file.
 */
async function getFileCommitFrequency(owner, repo, filePath, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=30`,
      authHeader(token)
    );
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch a file's content at a specific ref (branch, tag, or commit SHA).
 */
async function getFileContentAtRef(owner, repo, filePath, ref, token) {
  try {
    const { data } = await githubAPI.get(
      `/repos/${owner}/${repo}/contents/${filePath}`,
      { ...authHeader(token), params: { ref } }
    );
    if (data.size > 50000) return null;
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

module.exports = {
  getRepository,
  getFileTree,
  getFileContent,
  getRecentCommits,
  getPullRequest,
  getPRFiles,
  getFileCommitFrequency,
  getFileContentAtRef,
};
