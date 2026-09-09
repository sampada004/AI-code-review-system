const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

router.get("/github/login", authController.githubLogin);
router.get("/github/callback", authController.githubCallback);
router.post("/github/disconnect", authMiddleware, authController.disconnectGithub);

module.exports = router;
