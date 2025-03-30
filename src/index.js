// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const organizationRoutes = require("./routes/organization.routes");
const authRoutes = require("./routes/auth.routes");
const mrRoutes = require("./routes/mr.routes");
const groupRoutes = require("./routes/group.routes");

// Middleware
const corsOptions = {
    origin: "*", // Allow all origins (change this in production)
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions)); app.use(express.json());
// app.use(morgan("dev"));

// Routes
app.use("/organization", organizationRoutes);
app.use("/auth", authRoutes);
app.use("/mr", mrRoutes);
app.use("/group", groupRoutes);

// Export the app (but don't start the server here)
module.exports = app;
