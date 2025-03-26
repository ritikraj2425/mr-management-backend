const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        address: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
