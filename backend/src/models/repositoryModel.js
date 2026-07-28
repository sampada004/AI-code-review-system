const pool = require("../config/db");

const mapRepo = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    repository_name: row.repository_name,
    repository_url: row.repository_url,
    default_branch: row.default_branch,
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
    `SELECT id, user_id, repository_name, repository_url, default_branch, created_at FROM repositories WHERE id = ? LIMIT 1`,
    [id]
  );

  return mapRepo(rows[0]);
}

async function findByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, repository_name, repository_url, default_branch, created_at FROM repositories WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map(mapRepo);
}

module.exports = {
  create,
  findById,
  findByUser,
};
      