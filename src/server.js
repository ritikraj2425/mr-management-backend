// src/server.js
const http = require("http");
const app = require("./index"); // Import app
const connectDB = require('./config/db'); // Import connectDB
require("dotenv").config(); // Load environment variables
const { PORT } = require("./config/env"); // Import PORT

// Connect to MongoDB before starting the server
connectDB().then(() => {
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
