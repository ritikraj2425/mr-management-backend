// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const organizationRoutes = require("./routes/organization.routes");


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/organization", organizationRoutes);


// Export the app (but don't start the server here)
module.exports = app;
