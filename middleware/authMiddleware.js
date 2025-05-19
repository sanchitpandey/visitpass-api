const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/env");

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
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
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user from payload to request
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
