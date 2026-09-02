const pool = require("../config/db");

async function initializeDatabase() {
  console.log("[db] Initializing Inspectra AI database tables...");

  try {
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✓ users table verified");

    // 2. GitHub Accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS github_accounts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        github_id VARCHAR(100) NOT NULL UNIQUE,
        github_username VARCHAR(255) NULL,
        github_avatar_url VARCHAR(500) NULL,
        encrypted_access_token TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Add columns if table already existed with old names
    try {
      await pool.query(`ALTER TABLE github_accounts ADD COLUMN github_username VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE github_accounts ADD COLUMN github_avatar_url VARCHAR(500) NULL`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE github_accounts ADD COLUMN encrypted_access_token TEXT NULL`);
    } catch (e) {}
    console.log("✓ github_accounts table verified");

    // 3. Repositories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        repository_name VARCHAR(255) NOT NULL,
        repository_url VARCHAR(500) NOT NULL,
        default_branch VARCHAR(100) DEFAULT 'main',
        project_context JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✓ repositories table verified");

    // Check & add project_context column if missing in older schema
    try {
      await pool.query(`ALTER TABLE repositories ADD COLUMN project_context JSON NULL`);
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") console.warn(e.message);
    }

    // 4. Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        repository_id BIGINT NULL,
        file_path VARCHAR(500) NULL,
        title VARCHAR(255) NULL,
        source_code LONGTEXT NOT NULL,
        language VARCHAR(100) NOT NULL,
        review_status VARCHAR(50) DEFAULT 'COMPLETED',
        ai_summary TEXT NULL,
        overall_severity VARCHAR(50) NULL,
        parent_review_id BIGINT NULL,
        pr_url VARCHAR(500) NULL,
        pr_number INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_review_id) REFERENCES reviews(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✓ reviews table verified");

    // 5. Review Findings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_findings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        review_id BIGINT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        line_number INT NULL,
        issue TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        original_code_snippet TEXT NULL,
        suggested_fix TEXT NULL,
        fixed_code LONGTEXT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✓ review_findings table verified");

    // Check & add columns to review_findings if missing
    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN original_code_snippet TEXT NULL`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN suggested_fix TEXT NULL`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN fixed_code LONGTEXT NULL`);
    } catch (e) {}
    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN is_resolved BOOLEAN DEFAULT FALSE`);
    } catch (e) {}

    console.log("[db] Database initialization completed successfully!");
  } catch (error) {
    console.error("[db] Database initialization failed:", error);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
