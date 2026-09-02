const authService = require("../services/authService");
const userModel = require("../models/userModel");

const sendAuthResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);

    sendAuthResponse(res, 201, "Registration successful", {
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
    sendAuthResponse(res, 200, "Login successful", {
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

    sendAuthResponse(res, 200, "Profile loaded", {
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

const crypto = require("crypto");
const githubAccountModel = require("../models/githubAccountModel");
const encryption = require("../utils/encryption");

async function githubLogin(req, res, next) {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 10, // 10 minutes
      path: "/",
    });

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      throw new Error("GitHub OAuth is not configured properly");
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email repo&state=${state}`;
    res.redirect(githubAuthUrl);
  } catch (error) {
    next(error);
  }
}

async function githubCallback(req, res, next) {
  try {
    const { code, state } = req.query;
    
    // Check CSRF state if cookie exists
    const cookieState = req.headers.cookie?.split('; ')?.find(row => row.startsWith('oauth_state='))?.split('=')[1];
    
    if (state && cookieState && state !== cookieState) {
      return res.status(403).json({ success: false, message: "Invalid state parameter (CSRF protection)" });
    }

    // Clear state cookie
    res.clearCookie("oauth_state", { path: "/" });

    const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liJYJqQciQXHOTs0";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || "37a27ba9dfaa3fd7073302a39094569075824567";
    const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI || "https://inspectra-backend-fktg.onrender.com/api/auth/github/callback";

    console.log("[github OAuth] Exchanging code for token with redirectUri:", redirectUri);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code", code);
    if (redirectUri) {
      params.append("redirect_uri", redirectUri);
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Inspectra-AI",
      },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log("[github OAuth] GitHub token exchange response:", tokenData);

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(`GitHub token error (${tokenData.error || 'no_token'}): ${tokenData.error_description || JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "Inspectra-AI",
      },
    });
    
    const githubUser = await userResponse.json();

    // Fetch primary email
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "Inspectra-AI",
      },
    });
    
    const emails = await emailResponse.json();
    const primaryEmailObj = emails.find(e => e.primary) || emails[0];
    if (!primaryEmailObj) {
      throw new Error("No email found on GitHub account");
    }
    const primaryEmail = primaryEmailObj.email;

    // See if user exists
    let user = await userModel.findByEmail(primaryEmail);

    if (!user) {
      // Create user
      user = await userModel.create({
        fullName: githubUser.name || githubUser.login,
        email: primaryEmail,
        hashedPassword: null,
      });
    }

    // Encrypt token and store in github_accounts
    const encryptedToken = encryption.encryptToken(accessToken);
    await githubAccountModel.createOrUpdate({
      userId: user.id,
      githubId: String(githubUser.id),
      githubUsername: githubUser.login,
      githubAvatarUrl: githubUser.avatar_url,
      encryptedAccessToken: encryptedToken,
    });

    // Create JWT
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
    };
    const token = authService.createToken(safeUser);

    res.cookie("auth_token", token, getAuthCookieOptions());
    
    // Redirect to frontend callback page
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://inspectra-frontend-sigma.vercel.app" : "http://localhost:3000");
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logout,
  login,
  me,
  register,
  githubLogin,
  githubCallback,
};
