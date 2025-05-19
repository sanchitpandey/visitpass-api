const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRE } = require("../config/env");
const Visitor = require("../models/Visitor");

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE || "30d",
  });
};

// Register a new staff user (security or admin)
exports.registerStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role !== "security" && role !== "admin") {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Login user (any role)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Account is disabled. Please contact administrator.",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // If visitor, include visitor data
    let visitorData = null;
    if (user.role === "visitor" && user.visitorId) {
      const visitor = await Visitor.findById(user.visitorId);
      if (visitor) {
        visitorData = {
          id: visitor._id,
          qrCode: visitor.qrCodeData,
        };
      }
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      visitor: visitorData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If visitor, include visitor data
    let visitorData = null;
    if (user.role === "visitor" && user.visitorId) {
      const visitor = await Visitor.findById(user.visitorId);
      if (visitor) {
        visitorData = {
          id: visitor._id,
          qrCode: visitor.qrCodeData,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: user,
      visitor: visitorData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
