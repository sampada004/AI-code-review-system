const express = require("express");
const repositoryController = require("../controllers/repositoryController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, repositoryController.createRepository);
router.get("/", authMiddleware, repositoryController.getRepositories);
router.get("/:id", authMiddleware, repositoryController.getRepository);
router.get("/:id/tree", authMiddleware, repositoryController.getRepositoryTree);
router.get("/:id/file", authMiddleware, repositoryController.getRepositoryFile);
router.post("/:id/detect-context", authMiddleware, repositoryController.detectContext);
router.post("/:id/pull-request", authMiddleware, repositoryController.createPullRequest);
module.exports = router;
