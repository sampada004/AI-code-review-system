const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const tokenConfig = () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: "7d",
});

const createToken = (user) => {
  const { secret, expiresIn } = tokenConfig();

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    secret,
    { expiresIn }
  );
};

async function registerUser({ full_name, email, password }) {
  if (!full_name || !email || !password) {
    const error = new Error("full_name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await userModel.findByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userModel.create({
    fullName: full_name.trim(),
    email: normalizedEmail,
    hashedPassword,
  });

  return user;
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error("email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const token = createToken(safeUser);

  return {
    token,
    user: safeUser,
  };
}

module.exports = {
  loginUser,
  registerUser,
  createToken,
};
