const repositoryService = require("../services/repositoryService");
const githubService = require("../services/githubService");
const projectContextService = require("../services/projectContextService");
const repositoryModel = require("../models/repositoryModel");

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

async function getRepositoryTree(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const tree = await repositoryService.getRepositoryTree(req.params.id, req.query.branch);
    res.status(200).json(tree);
  } catch (err) {
    next(err);
  }
}

async function getRepositoryFile(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { path, branch } = req.query;
    if (!path) {
      return res.status(400).json({ success: false, message: "path query parameter is required" });
    }

    const fileContent = await repositoryService.getRepositoryFile(req.params.id, path, branch);
    res.status(200).send(fileContent);
  } catch (err) {
    next(err);
  }
}

async function createPullRequest(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { filePath, newContent, files, title, body, branch, customBranchName, reviewId } = req.body;
    
    // Validate that either files array or filePath/newContent is provided
    if ((!Array.isArray(files) || files.length === 0) && (!filePath || newContent == null)) {
      return res.status(400).json({ success: false, message: "files array or (filePath and newContent) are required" });
    }

    const prResult = await githubService.createPullRequest({
      userId: req.user.id,
      repoName: repo.repository_name,
      baseBranch: branch || repo.default_branch || "main",
      filePath,
      newContent,
      files,
      title,
      body,
      customBranchName
    });

    try {
      const reviewModel = require("../models/reviewModel");
      const pool = require("../config/db");
      const affectedFiles = prResult.files || (filePath ? [filePath] : []);
      
      if (reviewId) {
        await reviewModel.updateReviewStatus(reviewId, "PR_CREATED", prResult.prUrl, prResult.prNumber);
      }

      for (const fPath of affectedFiles) {
        const activeParent = await reviewModel.findActiveParentReview(req.params.id, fPath);
        if (activeParent) {
          await reviewModel.updateReviewStatus(activeParent.id, "PR_CREATED", prResult.prUrl, prResult.prNumber);
        }
        
        // Also update any reviews for this repository & file
        await pool.execute(
          `UPDATE reviews SET review_status = 'PR_CREATED', pr_url = ?, pr_number = ? WHERE repository_id = ? AND file_path = ?`,
          [prResult.prUrl, prResult.prNumber, req.params.id, fPath]
        );
      }
    } catch (e) {
      console.error("Failed to update parent review PR status", e);
    }

    res.status(201).json({ success: true, pullRequest: prResult });
  } catch (err) {
    console.error("PR Creation Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create PR" });
  }
}

async function detectContext(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { branch } = req.body;
    const context = await projectContextService.detectProjectContext(req.params.id, branch);
    
    if (context) {
      await repositoryModel.updateProjectContext(req.params.id, context);
      return res.status(200).json({ success: true, context });
    } else {
      return res.status(500).json({ success: false, message: "Failed to detect project context" });
    }
  } catch (err) {
    next(err);
  }
}

async function deleteRepository(req, res, next) {
  try {
    const repo = await repositoryService.getRepository(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }
    if (repo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await repositoryService.deleteRepository(req.params.id);
    res.status(200).json({ success: true, message: "Repository disconnected successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRepository,
  getRepositories,
  getRepository,
  getRepositoryTree,
  getRepositoryFile,
  createPullRequest,
  detectContext,
  deleteRepository,
};
