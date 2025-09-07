// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, admin } = require("../middleware/authMiddleware");

// Routes
router.get("/daily", protect, admin, reportController.generateDailyReport);

module.exports = router;
