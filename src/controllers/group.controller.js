const Group = require("../models/group.model");
const Organization = require("../models/organization.model");
const { getUserFromToken } = require("../utils/userDetails.utils");

const CLIENT_ID = {
    github: process.env.GITHUB_CLIENT_ID,
    gitlab: process.env.GITLAB_CLIENT_ID,
    bitbucket: process.env.BITBUCKET_CLIENT_ID,
    // azure: process.env.AZURE_CLIENT_ID,
};


const REDIRECT_URI = process.env.REDIRECT_URI;

exports.createGroup = async (req, res) => {
    try {
        const { name,description, platform } = req.body; // Platform (GitHub, GitLab, Bitbucket, Azure)
        const { jwttoken, refreshtoken } = req.headers;
        if (!name || !platform) {
            return res.status(400).json({ message: "Group name and platform are required." });
        }

        // Authenticate user first before proceeding
        let creatorUser;
        try {
            creatorUser = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or missing token." });
        }

        if (!creatorUser.isAdmin) {
            return res.status(403).json({ message: "Only admins can create groups." });
        }

        if (!creatorUser.organizationId) {
            return res.status(400).json({ message: "User is not associated with any organization." });
        }

        let authUrl;
        const state = JSON.stringify({
            organizationId: creatorUser.organizationId,
            name,
            description,
            userId: creatorUser._id,
            platform,
        });

        switch (platform) {
            case "github":
                authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID.github}&redirect_uri=${REDIRECT_URI}&state=${encodeURIComponent(state)}`;
                break;
            case "gitlab":
                const scopes = encodeURIComponent("read_api read_repository");
                authUrl = `https://gitlab.com/oauth/authorize?client_id=${CLIENT_ID.gitlab}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${encodeURIComponent(state)}&scope=${scopes}`;
                break;
            case "bitbucket":
                authUrl = `https://bitbucket.org/site/oauth2/authorize?client_id=${CLIENT_ID.bitbucket}&response_type=code&state=${encodeURIComponent(state)}`;
                break;
            default:
                return res.status(400).json({ message: "Unsupported platform." });
        }

        res.json({ redirectUrl: authUrl }); // Send redirect URL to frontend
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.getGroups = async (req, res) => {
    try {
        const { jwttoken, refreshtoken } = req.headers;
        const { groupId } = req.query;

        // Authenticate user first before proceeding
        let user;
        try {
            user = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or missing token." });
        }

        // Query to fetch either all groups or a specific group
        let query = { organizationId: user.organizationId };
        if (groupId) {
            query._id = groupId;
        }

        const groups = await Group.find(query)
            .populate({
                path: "members",
                select: "name email isAdmin", // Populate name, email, and isAdmin
            })
            .populate({
                path: "MRs",
                select: "title creator groupId status createdAt link",
                populate: [
                    { path: "creator", select: "name email" }, // Populate creator's name and email
                    { path: "groupId", select: "name" } // Populate group name
                ]
            });

        return res.status(200).json({ data: groups });
    } catch (error) {
        console.error("Error in getGroups:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.getUserGroups = async(req, res)=>{
    try {
        const { jwttoken, refreshtoken } = req.headers;

        let user;
        try {
            user = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or missing token." });
        }

        // Find all groups where the user is a member
        const groups = await Group.find({ members: user._id })

        return res.status(200).json({ data: groups });
    } catch (error) {
        console.error("Error fetching user groups:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}