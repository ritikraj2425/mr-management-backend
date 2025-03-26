// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const organizationRoutes = require("./routes/organization.routes");
const authRoutes = require("./routes/auth.routes");


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/organization", organizationRoutes);
app.use("/auth", authRoutes);

// Export the app (but don't start the server here)
module.exports = app;
