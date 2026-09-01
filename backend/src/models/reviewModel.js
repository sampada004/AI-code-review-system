const pool = require("../config/db");

const mapReview = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    repository_id: row.repository_id,
    file_path: row.file_path,
    title: row.title,
    source_code: row.source_code,
    language: row.language,
    review_status: row.review_status,
    ai_summary: row.ai_summary,
    overall_severity: row.overall_severity,
    created_at: row.created_at,
    updated_at: row.updated_at,
    parent_review_id: row.parent_review_id,
    pr_url: row.pr_url,
    pr_number: row.pr_number,
    author_name: row.author_name || null // fetched via JOIN
  };
};

async function createReview({
  userId,
  repositoryId = null,
  filePath = null,
  title = null,
  sourceCode,
  language,
  reviewStatus = "COMPLETED",
  aiSummary = null,
  overallSeverity = null,
  parentReviewId = null,
  prUrl = null,
  prNumber = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO reviews (
      user_id,
      repository_id,
      file_path,
      title,
      source_code,
      language,
      review_status,
      ai_summary,
      overall_severity,
      parent_review_id,
      pr_url,
      pr_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, repositoryId, filePath, title, sourceCode, language, reviewStatus, aiSummary, overallSeverity, parentReviewId, prUrl, prNumber]
  );

  return getReviewById(result.insertId);
}

async function getReviewById(id) {
  const [rows] = await pool.query(
    `SELECT
      id,
      user_id,
      repository_id,
      file_path,
      title,
      source_code,
      language,
      review_status,
      ai_summary,
      overall_severity,
      created_at,
      updated_at,
      parent_review_id,
      pr_url,
      pr_number
    FROM reviews
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return mapReview(rows[0]);
}

async function getReviewsByUserId(
  userId,
  { limit = 200, offset = 0 } = {}
) {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.user_id,
      r.repository_id,
      r.file_path,
      r.title,
      r.source_code,
      r.language,
      r.review_status,
      r.ai_summary,
      r.overall_severity,
      r.created_at,
      r.updated_at,
      r.parent_review_id,
      r.pr_url,
      r.pr_number
    FROM reviews r
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );

  return rows.map(mapReview);
}

async function findActiveParentReview(repositoryId, filePath) {
  if (!repositoryId || !filePath) return null;
  const [rows] = await pool.query(
    `SELECT * FROM reviews 
     WHERE repository_id = ? AND file_path = ? AND parent_review_id IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [repositoryId, filePath]
  );
  return mapReview(rows[0]);
}

async function updateReviewStatus(id, reviewStatus, prUrl = null, prNumber = null, overallSeverity = null) {
  const updates = ['review_status = ?'];
  const values = [reviewStatus];

  if (prUrl !== null) {
    updates.push('pr_url = ?');
    values.push(prUrl);
  }
  if (prNumber !== null) {
    updates.push('pr_number = ?');
    values.push(prNumber);
  }
  if (overallSeverity !== null) {
    updates.push('overall_severity = ?');
    values.push(overallSeverity);
  }

  values.push(id);

  await pool.execute(
    `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

async function getLatestReviewInChain(reviewId) {
  // If the given ID is a child, find its parent first. 
  // But wait, we can just find where parent_review_id = reviewId OR id = reviewId ordered by id DESC
  const [rows] = await pool.query(
    `SELECT * FROM reviews 
     WHERE id = ? OR parent_review_id = ?
     ORDER BY id DESC LIMIT 1`,
    [reviewId, reviewId]
  );
  return mapReview(rows[0]);
}

module.exports = {
  createReview,
  getReviewById,
  getReviewsByUserId,
  findActiveParentReview,
  updateReviewStatus,
  getLatestReviewInChain
};