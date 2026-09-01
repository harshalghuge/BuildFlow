const User = require("../models/User");
const Organization = require("../models/Organization");

const {
  hashPassword,
  comparePassword,
} = require("../services/authService");

const { generateToken } = require("../utils/jwt");


// ======================================================
// REGISTER
// ======================================================

const register = async (req, res) => {
  try {
    const {
      businessName,
      gstin,
      name,
      email,
      password,
    } = req.body || {};

    // Basic validation
    if (!businessName || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Basic password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization
    const organization = await Organization.create({
      businessName: businessName.trim(),
      gstin: gstin
        ? gstin.trim().toUpperCase()
        : undefined,
    });

    // Create owner
    const user = await User.create({
      organizationId: organization._id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "OWNER",
      status: "ACTIVE",
    });

    // Generate JWT
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },

        token,
      },
    });

  } catch (error) {

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });

  }
};


// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
  try {

    const {
      email,
      password,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    /*
      passwordHash has select:false in User model,
      therefore we explicitly request it here.
    */

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    // Don't reveal whether email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Compare password
    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();

    await user.save();

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },

        token,
      },
    });

  } catch (error) {

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};


// ======================================================
// GET CURRENT USER
// ======================================================

const getMe = async (req, res) => {
  try {

    const user = await User.findOne({
      _id: req.user.userId,
      organizationId: req.user.organizationId,
      status: "ACTIVE",
    }).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
      },
    });

  } catch (error) {

    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });
  }
};


module.exports = {
  register,
  login,
  getMe,
};
