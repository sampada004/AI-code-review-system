const pool = require("../config/db");

async function createOrUpdate({ userId, githubId, githubUsername, githubAvatarUrl, encryptedAccessToken }) {
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
  return rows[0] || null;
}

module.exports = {
  createOrUpdate,
  findByUserId,
};
