const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: false, unique: true },
        password: { type: String, required: false },
        name: {type: String, required: false},
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
        groupId: { type: [mongoose.Schema.Types.ObjectId], ref: "Group", default: [] },
        isAdmin: { type: Boolean, default: false },
        createdMRs: { type: [mongoose.Schema.Types.ObjectId], ref: "MR" },
        assignedMRs: { type: [mongoose.Schema.Types.ObjectId], ref: "MR" },
        isVerified: { type: Boolean, default: false },
    }
)

module.exports = mongoose.model("Users", UserSchema);
