const authService = require("../services/authService");
const userModel = require("../models/userModel");

const sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);

    sendSuccessResponse(res, 201, "Registration successful", {
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { token, user } = await authService.loginUser(req.body);

    res.cookie("auth_token", token, getAuthCookieOptions());
    sendSuccessResponse(res, 200, "Login successful", {
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    sendSuccessResponse(res, 200, "Profile loaded", {
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie("auth_token", getAuthCookieOptions());

    sendSuccessResponse(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logout,
  login,
  me,
  register,
};
