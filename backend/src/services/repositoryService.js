const repositoryModel = require("../models/repositoryModel");

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

module.exports = {
  createRepository,
  getRepository,
  getUserRepositories,
};
