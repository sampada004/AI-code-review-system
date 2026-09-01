const express = require("express");
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
// keep static/test routes before parameterized routes to avoid accidental matching
router.get("/test", (req, res) => {
  res.json({ message: "Review route working" });
});

router.post("/", authMiddleware, reviewController.submitReview);
router.post("/analyze", authMiddleware, reviewController.analyzeCode);

router.get("/latest", authMiddleware, reviewController.getLatestReviewForFile);
router.get("/", authMiddleware, reviewController.getUserReviews);

router.get("/:id", authMiddleware, reviewController.getReview);

module.exports = router;