const reviewService = require("../services/reviewService");
const aiService = require("../services/aiService");
const reviewModel = require("../models/reviewModel");
const findingModel = require("../models/findingModel");
const repositoryModel = require("../models/repositoryModel");

async function submitReview(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const review = await reviewService.createReview({
      userId: req.user.id,
      title: req.body.title,
      sourceCode: req.body.sourceCode,
      language: req.body.language || 'plaintext',
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserReviews(req, res, next) {
  try {
    const reviews = await reviewService.getUserReviews(req.user.id);

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

async function analyzeCode(req, res, next) {
  try {
    const { sourceCode, fileName, repositoryId, language, isRevalidation, previousFindings } = req.body;

    if (!sourceCode) {
      return res.status(400).json({ success: false, message: "Source code is required." });
    }

    let projectContext = null;
    if (repositoryId && typeof repositoryId === 'string' && repositoryId.trim() !== '') {
      const repo = await repositoryModel.findById(repositoryId);
      if (repo && repo.project_context) {
        projectContext = repo.project_context;
      }
    }

    const analysis = await aiService.analyzeCode(sourceCode, fileName, isRevalidation, previousFindings, projectContext);

    // Persist to database
    try {
      const review = await reviewModel.createReview({
        userId: req.user.id,
        repositoryId: repositoryId || null,
        filePath: fileName || null,
        title: `Review for ${fileName || "unknown file"}`,
        sourceCode: sourceCode,
        language: language || "plaintext",
        reviewStatus: "COMPLETED",
        aiSummary: analysis.summary || null,
        overallSeverity: analysis.overallSeverity || "none",
      });

      if (analysis.findings && analysis.findings.length > 0) {
        await findingModel.createFindings(review.id, analysis.findings);
      }
    } catch (dbError) {
      console.error("Failed to persist review to DB:", dbError);
      // We don't fail the request here, just log the error
    }

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitReview,
  getUserReviews,
  analyzeCode,
};