const repositoryModel = require("../models/repositoryModel");
const githubAccountModel = require("../models/githubAccountModel");
const encryption = require("../utils/encryption");

async function createRepository({ userId, repositoryUrl, defaultBranch }) {
  // Derive repository name from URL or use the URL as fallback
  let repositoryName = repositoryUrl;

  try {
    // accept owner/repo or full URL
    const trimmed = repositoryUrl.trim();
    const match = trimmed.match(/(?:github\.com\/(.+?\/.+?))(?:$|\/|\?|#)/i);
    if (match && match[1]) {
      repositoryName = match[1];
    } else if (trimmed.includes("/")) {
      const parts = trimmed.split("/").filter(Boolean);
      repositoryName = parts.slice(-2).join("/");
    }
  } catch (err) {
    repositoryName = repositoryUrl;
  }

  const repo = await repositoryModel.create({
    userId,
    repositoryName,
    repositoryUrl,
    defaultBranch: defaultBranch || "main",
  });

  return repo;
}

async function getRepository(id) {
  return repositoryModel.findById(id);
}

async function getUserRepositories(userId) {
  return repositoryModel.findByUser(userId);
}

async function getRepositoryTree(repoId, branch) {
  const repo = await repositoryModel.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  const repoName = repo.repository_name; 
  const targetBranch = branch || repo.default_branch || "main";
  
  const headers = {};
  const githubAccount = await githubAccountModel.findByUserId(repo.user_id);
  
  if (githubAccount && githubAccount.encrypted_access_token) {
    const token = encryption.decryptToken(githubAccount.encrypted_access_token);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } else if (process.env.GITHUB_TOKEN) {
    // Fallback to global token if user hasn't linked github
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repoName}/git/trees/${targetBranch}?recursive=1`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API Error: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

async function getRepositoryFile(repoId, path, branch) {
  const repo = await repositoryModel.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  const repoName = repo.repository_name;
  const targetBranch = branch || repo.default_branch || "main";
  
  const headers = {};
  const githubAccount = await githubAccountModel.findByUserId(repo.user_id);
  
  if (githubAccount && githubAccount.encrypted_access_token) {
    const token = encryption.decryptToken(githubAccount.encrypted_access_token);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } else if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const rawUrl = `https://raw.githubusercontent.com/${repoName}/${targetBranch}/${path}`;
  const res = await fetch(rawUrl, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API Error: ${res.statusText} (${res.status})`);
  }

  return res.text();
}

module.exports = {
  createRepository,
  getRepository,
  getUserRepositories,
  getRepositoryTree,
  getRepositoryFile,
};
