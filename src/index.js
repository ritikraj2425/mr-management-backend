// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to My Node.js App!");
});

// Export the app (but don't start the server here)
module.exports = app;
