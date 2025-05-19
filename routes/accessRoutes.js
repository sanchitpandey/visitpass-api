// routes/accessRoutes.js
const express = require("express");
const router = express.Router();
const accessController = require("../controllers/accessController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.post("/entry", protect, accessController.recordEntry);
router.post("/exit", protect, accessController.recordExit);

module.exports = router;
