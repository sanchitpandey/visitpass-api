const express = require("express");
const router = express.Router();
const multer = require("multer");
const visitorController = require("../controllers/visitorController");
const {
  protect,
  security,
  admin,
  visitor,
} = require("../middleware/authMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Public route for visitor registration - creates both visitor record and user account
router.post(
  "/register",
  upload.single("selfie"),
  visitorController.registerVisitor
);

// Route for visitors to view their own information
router.get("/my-info", protect, visitor, visitorController.getMyVisitorInfo);
// Protected routes - only staff can access all visitors
router.get("/", protect, security, visitorController.getAllVisitors);
router.get("/:id", protect, security, visitorController.getVisitorById);

module.exports = router;
