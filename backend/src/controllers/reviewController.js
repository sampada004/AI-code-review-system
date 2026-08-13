const reviewService = require("../services/reviewService");
const aiService = require("../services/aiService");
const reviewModel = require("../models/reviewModel");
const findingModel = require("../models/findingModel");
const repositoryModel = require("../models/repositoryModel");

async function submitReview(req, res, next) {
  try {
    const review = await reviewService.createReview({
      userId: req.user.id,
      title: req.body.title,
      sourceCode: req.body.sourceCode,
      language: req.body.language,
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

async function getReview(req, res, next) {
  try {
    const review = await reviewService.getReview(req.params.id);
    const findings = await findingModel.getFindingsByReviewId(review.id);
    
    // Find the latest review in this chain to see if issues were resolved
    const parentId = review.parent_review_id || review.id;
    let latestFindings = null;
    let latestReview = null;
    
    // Quick query to get the latest review in the chain
    const latestIdRows = await reviewModel.getLatestReviewInChain(parentId);
    if (latestIdRows && latestIdRows.id !== review.id) {
      latestReview = latestIdRows;
      latestFindings = await findingModel.getFindingsByReviewId(latestReview.id);
    }

    res.status(200).json({
      success: true,
      review: {
        ...review,
        findings,
      },
      latestReview: latestReview ? { ...latestReview, findings: latestFindings } : null
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
    if (repositoryId) {
      const repo = await repositoryModel.findById(repositoryId);
      if (repo && repo.project_context) {
        projectContext = repo.project_context;
      }
    }

    const analysis = await aiService.analyzeCode(sourceCode, fileName, isRevalidation, previousFindings, projectContext);

    // Handle Review Session (Parent/Child)
    let parentReviewId = null;
    let reviewStatus = "COMPLETED";

    if (repositoryId && fileName) {
      const activeParent = await require("../models/reviewModel").findActiveParentReview(repositoryId, fileName);
      if (activeParent) {
        if (isRevalidation) {
          parentReviewId = activeParent.id;
          reviewStatus = (analysis.findings || []).length === 0 ? "CLEAN" : "REVALIDATED";
          // Update the parent's status
          await require("../models/reviewModel").updateReviewStatus(activeParent.id, reviewStatus, null, null, analysis.overallSeverity || "none");
        } else {
          // It's a new analysis, but we have an active parent. We could leave the old one or mark it closed?
          // Actually, if we do a fresh analysis, maybe we start a new session?
          // Let's just create a new parent if it's NOT a revalidation.
        }
      }
    }

    // Persist to database
    try {
      const review = await reviewModel.createReview({
        userId: req.user.id,
        repositoryId: repositoryId || null,
        filePath: fileName || null,
        title: `Review for ${fileName || "unknown file"}`,
        sourceCode: sourceCode,
        language: language || "plaintext",
        reviewStatus: parentReviewId ? reviewStatus : ((analysis.findings || []).length === 0 ? "CLEAN" : "COMPLETED"),
        aiSummary: analysis.summary || null,
        overallSeverity: analysis.overallSeverity || "none",
        parentReviewId: parentReviewId
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
  getReview,
  getUserReviews,
  analyzeCode,
};