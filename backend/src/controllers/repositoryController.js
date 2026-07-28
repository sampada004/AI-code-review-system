const repositoryService = require("../services/repositoryService");

async function createRepository(req, res, next) {
  try {
    const { repository_url: repositoryUrl, default_branch: defaultBranch } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({ success: false, message: "repository_url is required" });
    }

    const repo = await repositoryService.createRepository({
      userId: req.user.id,
      repositoryUrl,
      defaultBranch,
    });

    res.status(201).json({ success: true, message: "Repository added", repository: repo });
  } catch (err) {
    next(err);
  }
}

async function getRepositories(req, res, next) {
  try {
    const repos = await repositoryService.getUserRepositories(req.user.id);
    res.status(200).json({ success: true, repositories: repos });
  } catch (err) {
    next(err);
  }
}

async function getRepository(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    // ensure the requesting user owns the repo
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.status(200).json({ success: true, repository: repo });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRepository,
  getRepositories,
  getRepository,
};
