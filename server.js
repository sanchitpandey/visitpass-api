// server.js
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
const authRoutes = require("./routes/authRoutes");

const allowedOrigins = [
    /^https:\/\/visitpass-react-.*\.vercel\.app$/,
    "http://localhost:3000"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return allowedOrigin === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

connectDB();

const app = express();

app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/image/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "uploads", filename);
    console.log(`Image request for: ${filename}, full path: ${imagePath}`);
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error(`Error sending file: ${err.message}`);
            res.status(404).send("Image not found");
        }
    });
});

// API routes
app.use("/api/auth", authRoutes);
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
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };