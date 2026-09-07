const pool = require("../config/db");

const mapRepo = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    repository_name: row.repository_name,
    repository_url: row.repository_url,
    default_branch: row.default_branch,
    project_context: typeof row.project_context === 'string' ? JSON.parse(row.project_context) : row.project_context,
    created_at: row.created_at,
  };
};

async function create({ userId, repositoryName, repositoryUrl, defaultBranch }) {
  const [result] = await pool.execute(
    `INSERT INTO repositories (user_id, repository_name, repository_url, default_branch) VALUES (?, ?, ?, ?)`,
    [userId, repositoryName, repositoryUrl, defaultBranch]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, repository_name, repository_url, default_branch, project_context, created_at FROM repositories WHERE id = ? LIMIT 1`,
    [id]
  );

  return mapRepo(rows[0]);
}

async function findByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, repository_name, repository_url, default_branch, project_context, created_at FROM repositories WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map(mapRepo);
}

async function updateProjectContext(id, projectContext) {
  const contextString = projectContext ? JSON.stringify(projectContext) : null;
  await pool.execute(
    `UPDATE repositories SET project_context = ? WHERE id = ?`,
    [contextString, id]
  );
  return findById(id);
}

async function deleteById(id) {
  // First delete all reviews belonging to this repository (findings will cascade delete via FK)
  await pool.execute(
    `DELETE FROM reviews WHERE repository_id = ?`,
    [id]
  );

  const [result] = await pool.execute(
    `DELETE FROM repositories WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  findByUser,
  updateProjectContext,
  deleteById,
};
      