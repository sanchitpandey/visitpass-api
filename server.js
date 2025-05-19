const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("./config/env");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Import routes
const visitorRoutes = require("./routes/visitorRoutes");
const accessRoutes = require("./routes/accessRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes"); // Add this line

// Connect to database
connectDB();

// Initialize express app
const app = express();

app.use("/uploads", (req, res, next) => {
  console.log(`Serving static file: ${req.path}`);
  next();
}, express.static(path.join(__dirname, "uploads")));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static folder for uploads
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "uploads", filename);
  
  // Log the request for debugging
  console.log(`Image request for: ${filename}, full path: ${imagePath}`);
  
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(`Error sending file: ${err.message}`);
      res.status(404).send("Image not found");
    }
  });
});

// API routes
app.use("/api/auth", authRoutes); // Add this line
app.use("/api/visitors", visitorRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/reports", reportRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Hospital Visitor Management API" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
