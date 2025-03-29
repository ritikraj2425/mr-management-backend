const mongoose = require("mongoose");

const OrganizationOTPSchema = new mongoose.Schema({
    orgName: { type: String, required: true },
    orgEmail: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    otpExpiry: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("OrganizationOTP", OrganizationOTPSchema);
