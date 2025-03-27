const mongoose = require("mongoose");
const UserSchema = require("./user.model");

const MRSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        reviewerEmails: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }],
        creator: { type: String, ref: "User" },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        status: { type: String, enum: ["open", "closed"], default: "open" },
        link: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }
);

module.exports = mongoose.model("MR", MRSchema);
