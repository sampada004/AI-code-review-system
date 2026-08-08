const pool = require("./src/config/db");

async function migrate() {
  console.log("Starting GitHub OAuth database migration...");
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. Make password_hash nullable in users table
    console.log("Modifying users table...");
    try {
      await connection.query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL`);
      console.log("Successfully made password_hash nullable.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column name")) {
        console.log("Column already exists or no change needed.");
      } else {
        console.error("Error modifying users table:", err.message);
      }
    }

    // 2. Create github_accounts table
    console.log("Creating github_accounts table...");
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS github_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        github_id VARCHAR(255) NOT NULL UNIQUE,
        github_username VARCHAR(255) NOT NULL,
        github_avatar_url VARCHAR(1024),
        encrypted_access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableQuery);
    console.log("Successfully created github_accounts table.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

migrate();
