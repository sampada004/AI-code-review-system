const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load .env file next to the backend folder (robust to different CWDs)
const envPath = path.resolve(__dirname, "../../.env");
let fileEnv = {};
if (fs.existsSync(envPath)) {
  try {
    fileEnv = dotenv.parse(fs.readFileSync(envPath));
  } catch (err) {
    // ignore parse errors; we'll rely on process.env
  }
}

const getEnv = (key) => {
  const val = process.env[key];
  // treat undefined or empty string as missing and fall back to file env
  if (val === undefined || val === "") {
    return fileEnv[key];
  }
  return val;
};

const resolvedConfig = {
  host: getEnv("DB_HOST"),
  port: getEnv("DB_PORT") ? Number(getEnv("DB_PORT")) : undefined,
  user: getEnv("DB_USER"),
  password: getEnv("DB_PASSWORD"),
  database: getEnv("DB_NAME") || "test",
  timezone: "Z",
};

const useSsl = getEnv("DB_SSL") === "true" || (resolvedConfig.host && resolvedConfig.host.includes("tidbcloud.com"));
if (useSsl) {
  resolvedConfig.ssl = {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  };
}

// Mask password for logs
const safeLogConfig = Object.assign({}, resolvedConfig, {
  password: resolvedConfig.password ? "<redacted>" : undefined,
});

console.log("[db] resolved DB config:", safeLogConfig);

const pool = mysql.createPool(resolvedConfig);
console.log("[db] created mysql pool");

module.exports = pool;