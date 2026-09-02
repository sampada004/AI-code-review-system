const pool = require("../config/db");

async function createOrUpdate({ userId, githubId, githubUsername, githubAvatarUrl, encryptedAccessToken }) {
  const uName = githubUsername || "github_user";
  const aUrl = githubAvatarUrl || null;
  const token = encryptedAccessToken || "";

  const [existing] = await pool.execute(
    "SELECT id FROM github_accounts WHERE user_id = ? OR github_id = ? LIMIT 1",
    [userId, String(githubId)]
  );

  if (existing.length > 0) {
    await pool.execute(
      `UPDATE github_accounts 
       SET user_id = ?, github_id = ?, 
           username = ?, github_username = ?, 
           avatar_url = ?, github_avatar_url = ?, 
           access_token = ?, encrypted_access_token = ?
       WHERE id = ?`,
      [userId, String(githubId), uName, uName, aUrl, aUrl, token, token, existing[0].id]
    );
    return existing[0].id;
  } else {
    const [result] = await pool.execute(
      `INSERT INTO github_accounts (user_id, github_id, username, github_username, avatar_url, github_avatar_url, access_token, encrypted_access_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, String(githubId), uName, uName, aUrl, aUrl, token, token]
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
    username: row.github_username || row.username,
    github_username: row.github_username || row.username,
    avatar_url: row.github_avatar_url || row.avatar_url,
    github_avatar_url: row.github_avatar_url || row.avatar_url,
    access_token: row.encrypted_access_token || row.access_token,
    encrypted_access_token: row.encrypted_access_token || row.access_token,
  };
}

module.exports = {
  createOrUpdate,
  findByUserId,
};
