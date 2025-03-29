const mongoose = require("mongoose");

const OTPStoreSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    otpExpiry: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("OTPStore", OTPStoreSchema);
