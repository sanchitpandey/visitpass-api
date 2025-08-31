const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRE } = require("../config/env");
const Visitor = require("../models/Visitor");
const firebaseAdmin = require('../config/firebaseAdmin');

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

// Login/Get user using Firebase ID Token
exports.firebaseLogin = async (req, res) => {
  // Step 1: Get the Firebase token from the request body
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Firebase token is required.' });
  }

  // Check if Firebase Admin was initialized
  if (!firebaseAdmin) {
    return res.status(500).json({ message: 'Firebase Admin SDK is not initialized on the server.' });
  }

  try {
    // Step 2: Verify the token with Firebase
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const phoneNumber = decodedToken.phone_number;

    // Only search for a user if a phone number exists on the token.
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'No phone number associated with this user token. Cannot log in.' });
    }

    // Step 3: Find the user in our database
    const user = await User.findOne({ phoneNumber });

    // Step 4: Handle case where user is not found
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please complete registration.' });
    }
    
    // Step 5: If found, use your existing helper to create a session token
    const appToken = generateToken(user._id, user.role);

    // Step 6: Send the response
    res.status(200).json({
      success: true,
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during Firebase authentication:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid or expired token.',
    });
  }
};