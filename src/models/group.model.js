const mongoose = require("mongoose");
const GroupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        members: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
        MRs: { type: [mongoose.Schema.Types.ObjectId], ref: "MR" },
    }
);


module.exports = mongoose.model("Group", GroupSchema);
