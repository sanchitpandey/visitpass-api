// models/Visitor.js
const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  selfieUrl: {
    type: String,
    required: true,
  },
  qrCodeData: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["outside premises", "inside premises"],
    default: "outside premises",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Visitor", visitorSchema);
