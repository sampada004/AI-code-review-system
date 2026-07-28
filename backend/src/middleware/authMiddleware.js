const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, headerToken] = authHeader.split(" ");

  // prefer Authorization header Bearer token
  let token = headerToken;

  // fallback: try to read auth_token from cookie header (no cookie-parser required)
  if (!token) {
    const cookieHeader = req.headers.cookie || "";
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map((c) => c.trim());
      const authCookie = cookies.find((c) => c.startsWith("auth_token="));
      if (authCookie) {
        token = authCookie.split("=")[1];
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT secret is not configured");
    }

    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
