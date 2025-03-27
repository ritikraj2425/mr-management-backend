const MRModel = require("../models/mr.model");
const { getUserFromToken } = require("../utils/userDetails.utils");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Group = require("../models/group.model"); 

exports.createMR = async (req, res) => {
    try {
        const { title, reviewerEmails, groupId, link } = req.body;
        const { jwttoken, refreshtoken } = req.headers;

        if (!title || !groupId || !link || !reviewerEmails) {
            return res.status(400).json({ message: "All fields are required." });
        }

        let creatorUser;
        try {
            creatorUser = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
        const creator = creatorUser._id;

        let reviewerIds = [];
        if (reviewerEmails && reviewerEmails.length > 0) {
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(400).json({ message: "Group not found." });
            }
            reviewerIds = await Promise.all(reviewerEmails.map(async (email) => {
                const user = await User.findOne({ email });
                if (!user) {
                    throw new Error(`User with email ${email} not found.`);
                }
                if (!group.members.includes(user._id)) {
                    throw new Error(`User with email ${email} is not a member of the specified group.`);
                }
                return user._id;
            }));
        }

        const mr = new MRModel({
            title,
            creator, 
            groupId,
            link,
            reviewerEmails: reviewerIds
        });
        await mr.save();

        creatorUser.createdMRs.push(mr._id);
        await creatorUser.save();
        const group = await Group.findById(groupId);
        group.MRs.push(mr._id);
        await group.save();

        res.status(201).json({ message: "MR created successfully", mr });
    } catch (error) {
        console.error("Error creating MR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
