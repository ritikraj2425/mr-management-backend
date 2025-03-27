// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const organizationRoutes = require("./routes/organization.routes");
const authRoutes = require("./routes/auth.routes");
const mrRoutes = require("./routes/mr.routes");


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/organization", organizationRoutes);
app.use("/auth", authRoutes);
app.use("/mr", mrRoutes);

// Export the app (but don't start the server here)
module.exports = app;
