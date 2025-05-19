// controllers/accessController.js
const Visitor = require("../models/Visitor");
const VisitLog = require("../models/VisitLog");

// Record visitor entry
exports.recordEntry = async (req, res) => {
  try {
    const { qrCodeData, purpose } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({ message: "QR code data is required" });
    }

    // Find visitor by QR code
    const visitor = await Visitor.findOne({ qrCodeData });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Check if visitor is already inside
    if (visitor.status === "inside premises") {
      return res
        .status(400)
        .json({ message: "Visitor is already inside the premises" });
    }

    // Update visitor status
    visitor.status = "inside premises";
    await visitor.save();

    // Create new visit log
    const visitLog = new VisitLog({
      visitor: visitor._id,
      entryTime: new Date(),
      purpose: purpose || "General visit",
    });

    await visitLog.save();

    res.status(200).json({
      success: true,
      message: "Entry recorded successfully",
      data: {
        visitor,
        visitLog,
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

// Record visitor exit
exports.recordExit = async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({ message: "QR code data is required" });
    }

    // Find visitor by QR code
    const visitor = await Visitor.findOne({ qrCodeData });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Check if visitor is inside
    if (visitor.status !== "inside premises") {
      return res
        .status(400)
        .json({ message: "Visitor is not inside the premises" });
    }

    // Update visitor status
    visitor.status = "outside premises";
    await visitor.save();

    // Update visit log
    const visitLog = await VisitLog.findOne({
      visitor: visitor._id,
      exitTime: null,
    }).sort({ entryTime: -1 });

    if (!visitLog) {
      return res
        .status(404)
        .json({ message: "No active visit found for this visitor" });
    }

    visitLog.exitTime = new Date();
    await visitLog.save();

    res.status(200).json({
      success: true,
      message: "Exit recorded successfully",
      data: {
        visitor,
        visitLog,
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
