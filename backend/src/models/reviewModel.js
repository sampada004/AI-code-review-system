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
      overall_severity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, repositoryId, filePath, title, sourceCode, language, reviewStatus, aiSummary, overallSeverity]
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
      updated_at
    FROM reviews
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return mapReview(rows[0]);
}

async function getReviewsByUserId(
  userId,
  { limit = 50, offset = 0 } = {}
) {
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
      updated_at
    FROM reviews
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );

  return rows.map(mapReview);
}

module.exports = {
  createReview,
  getReviewById,
  getReviewsByUserId,
};