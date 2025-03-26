const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        members: { type: [UserSchema], required: true },
        orgDomain: { type: String, required: true, unique: true },
        groups: { type: [mongoose.Schema.Types.ObjectId], ref: "Group" },
    }
);


module.exports = mongoose.model("Organization", OrganizationSchema);
