const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/env");
const firebaseAdmin = require('../config/firebaseAdmin');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: "User account is disabled" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// Security guard middleware
exports.security = (req, res, next) => {
  if (req.user && (req.user.role === "security" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as security personnel" });
  }
};

// Visitor middleware
exports.visitor = (req, res, next) => {
  if (req.user && req.user.role === "visitor") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a visitor" });
  }
};

// It verifies the token from Firebase, not our local app's JWT
exports.firebaseAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }

  if (!firebaseAdmin) {
    return res.status(500).json({ success: false, message: 'Firebase Admin SDK not initialized on server.' });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
  }
};