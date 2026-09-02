const express = require("express");
const cors = require("cors");
const path = require("path");
// load backend/.env (one level above src)
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const repositoryRoutes = require("./routes/repositoryRoutes");

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://inspectra-frontend-sigma.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// express middleware

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Code Review Backend Running",
  });
});

app.use("/api/auth", authRoutes);
console.log("Mounting review routes...");
app.use("/api/reviews", reviewRoutes);
console.log("Mounting repository routes...");
app.use("/api/repositories", repositoryRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
