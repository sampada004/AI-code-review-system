const pool = require("./src/config/db");

async function migrate() {
  try {
    console.log("Starting database migration for suggested fixes...");
    
    // Add columns to review_findings table
    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN original_code_snippet TEXT NULL`);
      console.log("Added original_code_snippet");
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log('original_code_snippet already exists');
      else throw e;
    }

    try {
      await pool.query(`ALTER TABLE review_findings ADD COLUMN suggested_fix TEXT NULL`);
      console.log("Added suggested_fix");
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log('suggested_fix already exists');
      else throw e;
    }

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
