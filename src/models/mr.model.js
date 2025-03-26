const mongoose = require("mongoose");

const MRSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        checker: { type: [UserSchema], required: true },
        creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        status: { type: String, enum: ["open", "closed"], default: "open" },
        link: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }
);

module.exports = mongoose.model("MR", MRSchema);
