const pool = require("./src/config/db");

async function migrate() {
  console.log("Starting database migration: Add fixed_code...");
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("Adding fixed_code column to review_findings table...");
    try {
      await connection.query(
        `ALTER TABLE review_findings ADD COLUMN fixed_code TEXT NULL`
      );
      console.log("Successfully added fixed_code column.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("Column fixed_code already exists, skipping...");
      } else {
        throw err;
      }
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) connection.release();
    pool.end();
  }
}

migrate();
