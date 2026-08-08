const crypto = require("crypto");

// Must be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32); 
const ALGORITHM = "aes-256-gcm";

function encryptToken(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptToken(encryptedData) {
  if (!encryptedData) return null;
  
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = Buffer.from(parts[2], "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  encryptToken,
  decryptToken,
};
