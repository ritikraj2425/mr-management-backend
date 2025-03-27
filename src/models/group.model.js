const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    MRs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MR"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("Group", GroupSchema);
