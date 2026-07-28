const pool = require("./src/config/db");

async function migrate() {
  try {
    console.log("Starting database migration...");
    
    // Add columns to reviews table
    try {
      await pool.query(`ALTER TABLE reviews ADD COLUMN repository_id BIGINT NULL`);
      console.log("Added repository_id");
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log('repository_id already exists');
      else throw e;
    }

    try {
      await pool.query(`ALTER TABLE reviews ADD COLUMN file_path VARCHAR(500) NULL`);
      console.log("Added file_path");
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log('file_path already exists');
      else throw e;
    }

    // Create review_findings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_findings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        review_id BIGINT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        line_number INT NULL,
        issue TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      )
    `);
    console.log("Created review_findings table.");

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
