// routes/accessRoutes.js
const express = require("express");
const router = express.Router();
const accessController = require("../controllers/accessController");
const { protect, security } = require("../middleware/authMiddleware");

// Routes
router.post("/entry", protect ,security, accessController.recordEntry);
router.post("/exit", protect ,security, accessController.recordExit);

module.exports = router;
