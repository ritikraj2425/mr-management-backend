const MRModel = require("../models/mr.model");
const Verification = require("../services/jsonWebToken");
const User = require("../models/user.model");
const Group = require("../models/group.model"); 

exports.createMR = async (req, res) => {
    try {
        const { title, reviewerEmails, groupId, link } = req.body;
        const { jwttoken, refreshtoken } = req.headers;

        if (!title || !groupId || !link || !reviewerEmails) {
            return res.status(400).json({ message: "all fields are required." });
        }

        const check = Verification.verifyJwt(jwttoken, refreshtoken);
        if (!check) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = check.credentials.payload;
        const creatorUser = await User.findOne({ email: payload.email });
        if (!creatorUser) {
            return res.status(400).json({ message: "Creator user not found." });
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
        res.status(201).json({ message: "MR created successfully", mr });
    } catch (error) {
        console.error("Error creating MR:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
