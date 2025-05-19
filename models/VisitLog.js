// models/VisitLog.js
const mongoose = require("mongoose");

const visitLogSchema = new mongoose.Schema({
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visitor",
    required: true,
  },
  entryTime: {
    type: Date,
    default: null,
  },
  exitTime: {
    type: Date,
    default: null,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VisitLog", visitLogSchema);
