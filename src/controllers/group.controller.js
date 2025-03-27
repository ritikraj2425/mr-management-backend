const Group = require("../models/group.model");
const Organization = require("../models/organization.model");
const { getUserFromToken } = require("../utils/userDetails.utils");

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const { jwttoken, refreshtoken } = req.headers;

        if (!name) {
            return res.status(400).json({ message: "Group name is required." });
        }

        let creatorUser;
        try {
            creatorUser = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }

        if (!creatorUser.isAdmin) {
            return res.status(403).json({ message: "Only admins can create groups." });
        }

        if (!creatorUser.organizationId) {
            return res.status(400).json({ message: "User is not associated with any organization." });
        }

        const organization = await Organization.findById(creatorUser.organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found." });
        }

        const group = new Group({
            name,
            organizationId: creatorUser.organizationId,
            members: [creatorUser._id]
        });
        await group.save();

        organization.groups.push(group._id);
        await organization.save();

        res.status(201).json({ message: "Group created successfully", group });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
