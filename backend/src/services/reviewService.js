const reviewModel = require("../models/reviewModel");

async function createReview({
  userId,
  title,
  sourceCode,
  language,
}) {
  if (!sourceCode || !language) {
    const error = new Error("sourceCode and language are required");
    error.statusCode = 400;
    throw error;
  }

  const review = await reviewModel.createReview({
    userId,
    title,
    sourceCode,
    language,
  });

  return review;
}

async function getReview(id) {
  const review = await reviewModel.getReviewById(id);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  return review;
}

async function getUserReviews(userId) {
  return reviewModel.getReviewsByUserId(userId);
}

module.exports = {
  createReview,
  getReview,
  getUserReviews,
};

