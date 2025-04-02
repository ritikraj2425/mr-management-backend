// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const organizationRoutes = require("./routes/organization.routes");
const authRoutes = require("./routes/auth.routes");
const mrRoutes = require("./routes/mr.routes");
const groupRoutes = require("./routes/group.routes");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/user.routes");

const corsOptions = {
    origin: ["http://localhost:3000", "https://mergeflow.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "apikey",
        "jwttoken",
        "refreshtoken"
    ],
    credentials: true,
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Make sure this is called before your routes

// app.use(morgan("dev"));

// Routes
app.use("/organization", organizationRoutes);
app.use("/auth", authRoutes);
app.use("/mr", mrRoutes);
app.use("/group", groupRoutes);
app.use("/user", userRoutes);

// Export the app (but don't start the server here)
module.exports = app;
