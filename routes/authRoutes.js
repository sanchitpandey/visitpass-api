// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");
const { registerStaff, login, firebaseLogin, getTestToken } = require('../controllers/authController');

// Admin only can register new staff
router.post("/register-staff", protect, admin, authController.registerStaff);

// Public login route for all users
router.post("/login", authController.login);

// Protected route to get user profile
router.get("/me", protect, authController.getMe);

router.post('/firebase-login', authController.firebaseLogin);

module.exports = router;
