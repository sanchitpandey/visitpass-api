const User = require("../models/User");
const Visitor = require("../models/Visitor");
const VisitLog = require("../models/VisitLog");
const verifyAadhaar = require("../utils/aadhaarVerification");
const generateQRCode = require("../utils/qrCodeGenerator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Register a new visitor
exports.registerVisitor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { phone_number } = req.user;
    const {
      name,
      email,
      aadhaarNumber,
      age,
      sex,
      address,
      officialToMeet,
      referredBy,
      diseases,
    } = req.body;

    if (!name || !email || !aadhaarNumber || !age || !sex || !address || !officialToMeet) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Selfie image is required.' });
    }

    const existingUser = await User.findOne({ phoneNumber: phone_number }).session(session);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this phone number is already registered.' });
    }
    const existingVisitor = await Visitor.findOne({ aadhaarNumber }).session(session);
    if (existingVisitor) {
      return res.status(400).json({ success: false, message: 'A visitor with this Aadhaar number is already registered.' });
    }

    const isAadhaarValid = await verifyAadhaar(aadhaarNumber);
    if (!isAadhaarValid) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar number format.' });
    }

    const qrData = `VISITOR:${name}:${aadhaarNumber}:${Date.now()}`;

    const newVisitor = new Visitor({
      name,
      phoneNumber: phone_number,
      email,
      aadhaarNumber,
      age,
      sex,
      address,
      officialToMeet,
      referredBy,
      diseases,
      qrCodeData: qrData,
      selfieUrl: req.file.path,
    });
    await newVisitor.save({ session });

    const newUser = new User({
      name,
      email,
      phoneNumber: phone_number,
      firebaseUid: req.user.uid,
      role: 'visitor',
      visitorId: newVisitor._id, // Link the user to their visitor profile
    });
    await newUser.save({ session });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Visitor registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
      },
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    session.endSession();
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
