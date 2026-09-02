const pool = require("../config/db");

async function createOrUpdate({ userId, githubId, githubUsername, githubAvatarUrl, encryptedAccessToken }) {
  // Ensure schema compatibility
  try {
    await pool.query("ALTER TABLE github_accounts ADD COLUMN github_username VARCHAR(255) NULL");
  } catch (e) {}
  try {
    await pool.query("ALTER TABLE github_accounts ADD COLUMN github_avatar_url VARCHAR(500) NULL");
  } catch (e) {}
  try {
    await pool.query("ALTER TABLE github_accounts ADD COLUMN encrypted_access_token TEXT NULL");
  } catch (e) {}

  const [existing] = await pool.execute(
    "SELECT id FROM github_accounts WHERE user_id = ? OR github_id = ? LIMIT 1",
    [userId, String(githubId)]
  );

  if (existing.length > 0) {
    await pool.execute(
      `UPDATE github_accounts 
       SET user_id = ?, github_id = ?, github_username = ?, github_avatar_url = ?, encrypted_access_token = ?
       WHERE id = ?`,
      [userId, String(githubId), githubUsername, githubAvatarUrl, encryptedAccessToken, existing[0].id]
    );
    return existing[0].id;
  } else {
    const [result] = await pool.execute(
      `INSERT INTO github_accounts (user_id, github_id, github_username, github_avatar_url, encrypted_access_token)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, String(githubId), githubUsername, githubAvatarUrl, encryptedAccessToken]
    );
    return result.insertId;
  }
}

async function findByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM github_accounts WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    github_username: row.github_username || row.username,
    github_avatar_url: row.github_avatar_url || row.avatar_url,
    encrypted_access_token: row.encrypted_access_token || row.access_token,
  };
}

module.exports = {
  createOrUpdate,
  findByUserId,
};
