const pool = require("../config/db");

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

async function findByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return mapUser(rows[0]);
}

async function create({ fullName, email, hashedPassword }) {
  const [result] = await pool.execute(
    "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
    [fullName, email, hashedPassword]
  );

  return findById(result.insertId);
}

module.exports = {
  create,
  findByEmail,
  findById,
};
