const pool = require("./src/config/db");

async function migrate() {
  console.log("Starting database migration for project_context...");
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("Modifying repositories table...");
    try {
      await connection.query(`ALTER TABLE repositories ADD COLUMN project_context JSON DEFAULT NULL`);
      console.log("Successfully added project_context JSON column.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column name")) {
        console.log("Column project_context already exists.");
      } else {
        console.error("Error modifying repositories table:", err.message);
        throw err;
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
