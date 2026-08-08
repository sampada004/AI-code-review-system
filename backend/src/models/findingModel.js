const pool = require("../config/db");

const mapFinding = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    review_id: row.review_id,
    severity: row.severity,
    line_number: row.line_number,
    issue: row.issue,
    recommendation: row.recommendation,
    original_code_snippet: row.original_code_snippet,
    suggested_fix: row.suggested_fix,
    fixed_code: row.fixed_code,
    created_at: row.created_at,
  };
};

async function createFindings(reviewId, findingsList) {
  if (!findingsList || findingsList.length === 0) return [];

  const values = [];
  const placeholders = findingsList.map((finding) => {
    values.push(
      reviewId,
      finding.severity || "low",
      finding.lineNumber || null,
      finding.issue || "No issue provided",
      finding.recommendation || "No recommendation provided",
      finding.originalCodeSnippet || null,
      finding.suggestedFix || null,
      finding.fixedCode || null
    );
    return "(?, ?, ?, ?, ?, ?, ?, ?)";
  });

  const query = `
    INSERT INTO review_findings (
      review_id,
      severity,
      line_number,
      issue,
      recommendation,
      original_code_snippet,
      suggested_fix,
      fixed_code
    ) VALUES ${placeholders.join(", ")}
  `;

  await pool.execute(query, values);
}

async function getFindingsByReviewId(reviewId) {
  const [rows] = await pool.query(
    `SELECT
      id,
      review_id,
      severity,
      line_number,
      issue,
      recommendation,
      original_code_snippet,
      suggested_fix,
      fixed_code,
      created_at
    FROM review_findings
    WHERE review_id = ?
    ORDER BY id ASC`,
    [reviewId]
  );

  return rows.map(mapFinding);
}

module.exports = {
  createFindings,
  getFindingsByReviewId,
};
