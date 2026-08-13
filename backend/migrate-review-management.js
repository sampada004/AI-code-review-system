const pool = require("./src/config/db");

async function migrate() {
  console.log("Starting database migration for Review Management...");
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("Modifying reviews table ENUM...");
    try {
      // Modify ENUM
      await connection.query(`ALTER TABLE reviews MODIFY COLUMN review_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CLEAN', 'REVALIDATED', 'PR_CREATED') DEFAULT 'PENDING'`);
      console.log("Successfully updated review_status ENUM.");
    } catch (err) {
      console.error("Error updating ENUM:", err.message);
    }

    console.log("Adding parent_review_id...");
    try {
      await connection.query(`ALTER TABLE reviews ADD COLUMN parent_review_id INT DEFAULT NULL`);
      await connection.query(`ALTER TABLE reviews ADD CONSTRAINT fk_parent_review FOREIGN KEY (parent_review_id) REFERENCES reviews(id) ON DELETE CASCADE`);
      console.log("Successfully added parent_review_id.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column name")) {
        console.log("Column parent_review_id already exists.");
      } else {
        console.error("Error adding parent_review_id:", err.message);
      }
    }

    console.log("Adding pr_url and pr_number...");
    try {
      await connection.query(`ALTER TABLE reviews ADD COLUMN pr_url VARCHAR(255) DEFAULT NULL`);
      await connection.query(`ALTER TABLE reviews ADD COLUMN pr_number VARCHAR(50) DEFAULT NULL`);
      console.log("Successfully added pr columns.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column name")) {
        console.log("PR columns already exist.");
      } else {
        console.error("Error adding PR columns:", err.message);
      }
    }

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
