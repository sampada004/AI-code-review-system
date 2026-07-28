const express = require("express");
const repositoryController = require("../controllers/repositoryController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, repositoryController.createRepository);
router.get("/", authMiddleware, repositoryController.getRepositories);
router.get("/:id", authMiddleware, repositoryController.getRepository);

module.exports = router;
