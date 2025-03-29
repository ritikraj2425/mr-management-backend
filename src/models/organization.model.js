const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema({
    orgName: { type: String, required: true },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    orgEmail: { type: String, required: true, unique: true },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }],
    orgDomain: { type: String, required: true },
    pendingInvitations: [{
        type: String
    }],
    isVerified: { type: Boolean, default: false } // New field to track verification

}, {
    timestamps: true
});

module.exports = mongoose.model("Organization", OrganizationSchema);
