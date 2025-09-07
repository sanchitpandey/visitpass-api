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
    age: {
    type: Number,
    required: true,
  },
  sex: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  officialToMeet: {
    type: String,
    required: true,
    trim: true,
  },
  referredBy: { 
    type: String,
    trim: true,
    default: '',
  },
  diseases: {
    type: String,
    trim: true,
    default: '',
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
}, {
  timestamps: true
});

module.exports = mongoose.model("Visitor", visitorSchema);