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
    }],
    tokens: {
        github: { type: String },  // GitHub OAuth token
        gitlab: { type: String },  // GitLab OAuth token
        bitbucket: { type: String },  // Bitbucket OAuth token
        azure: { type: String }  // Azure DevOps OAuth token
    },
    authorizedPlatforms: { type: [String], default: [] },
}, {
    timestamps: true
});

module.exports = mongoose.model("Group", GroupSchema);
