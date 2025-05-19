const User = require("../models/User");
const Visitor = require("../models/Visitor");
const VisitLog = require("../models/VisitLog");
const verifyAadhaar = require("../utils/aadhaarVerification");
const generateQRCode = require("../utils/qrCodeGenerator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Register a new visitor
exports.registerVisitor = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      aadhaarNumber,
      address,
      email,
      password,
      purpose,
    } = req.body;

    // Validate input
    if (!name || !phoneNumber || !aadhaarNumber || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check if visitor with this Aadhaar already exists
    const existingVisitor = await Visitor.findOne({ aadhaarNumber });
    if (existingVisitor) {
      return res
        .status(400)
        .json({ message: "Visitor with this Aadhaar number already exists" });
    }

    // Verify Aadhaar (simulated)
    const isAadhaarValid = await verifyAadhaar(aadhaarNumber);
    if (!isAadhaarValid) {
      return res.status(400).json({ message: "Invalid Aadhaar number" });
    }

    // Generate QR code
    const qrData = `VISITOR:${name}:${aadhaarNumber}:${Date.now()}`;
    const qrCodeData = await generateQRCode(qrData);

    // Create new visitor
    const visitor = new Visitor({
      name,
      phoneNumber,
      email,
      aadhaarNumber,
      address: address || "",
      qrCodeData,
      selfieUrl: req.file ? req.file.path : "",
    });

    await visitor.save();

    // Create user account for the visitor
    const user = new User({
      name,
      email,
      password,
      role: "visitor",
      visitorId: visitor._id,
    });

    await user.save();

    // Generate token for immediate login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    res.status(201).json({
      success: true,
      message: "Visitor registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      visitor: {
        id: visitor._id,
        qrCode: qrCodeData,
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

// Get all visitors
exports.getAllVisitors = async (req, res) => {
  try {
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add filtering options
    const filter = {};

    // If date filter is provided
    if (req.query.date) {
      const queryDate = new Date(req.query.date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // If status filter is provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Count total documents for pagination
    const total = await Visitor.countDocuments(filter);

    // Get visitors with pagination and sorting
    const visitors = await Visitor.find(filter)
      .sort({ createdAt: -1 }) // Sort by most recent first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: visitors.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: visitors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get visitor by ID
exports.getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID format",
      });
    }

    // Find visitor by ID
    const visitor = await Visitor.findById(id);

    // If no visitor is found
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Get visit history for this visitor
    const visitLogs = await VisitLog.find({ visitor: id })
      .sort({ entryTime: -1 }) // Most recent visits first
      .limit(10); // Limit to last 10 visits

    res.status(200).json({
      success: true,
      data: {
        visitor,
        visitHistory: visitLogs,
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

// Get visitor's own information
exports.getMyVisitorInfo = async (req, res) => {
  try {
    console.log(req.params);
    if (!req.user.visitorId) {
      return res.status(404).json({ message: "Visitor record not found" });
    }

    const visitor = await Visitor.findById(req.user.visitorId);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor record not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        id: visitor._id,
        name: visitor.name,
        phoneNumber: visitor.phoneNumber,
        aadhaarNumber: visitor.aadhaarNumber,
        qrCode: visitor.qrCodeData,
        selfieUrl: visitor.selfieUrl,
        status: visitor.status,
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
