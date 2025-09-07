// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("./config/env");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const visitorRoutes = require("./routes/visitorRoutes");
const accessRoutes = require("./routes/accessRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");

connectDB();
const app = express();

app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/image/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "uploads", filename);
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error(`Error sending file: ${err.message}`);
            res.status(404).send("Image not found");
        }
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Hospital Visitor Management API" });
});

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;