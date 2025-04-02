const MRModel = require("../models/mr.model");
const { getUserFromToken } = require("../utils/userDetails.utils");
const User = require("../models/user.model");
const Group = require("../models/group.model");
const { getMRStatus } = require("../utils/mrStatus.utils");
const mongoose = require("mongoose");
const { sendEmail } = require("../utils/nodeMailer.utils");

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
        if (reviewerEmails.length > 0) {
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

        // Create the new MR
        const mr = new MRModel({
            title,
            creator,
            groupId,
            link,
            reviewerEmails: reviewerIds
        });
        await mr.save();

        reviewerEmails.forEach(async (email) => {
            const subject = `${creatorUser.name} aasigned MR to you`;
            const textContent = `You have been assigned a new MR by ${creatorUser.name}. Please check the link: ${link}`;
            const htmlContent = `<p>You have been assigned a new MR by <strong>${creatorUser.name}</strong>. Please check the link: <a href="${link}">${link}</a></p>`;
            try {
                await sendEmail(email, subject, htmlContent, textContent);
            } catch (emailError) {
                throw new Error(`Failed to send notification email to ${email}: ${emailError.message}`);
            }
        })

        creatorUser.createdMRs.push(mr._id);
        await creatorUser.save();

        const group = await Group.findById(groupId);
        group.MRs.push(mr._id);
        await group.save();

        await Promise.all(reviewerIds.map(async (reviewerId) => {
            await User.findByIdAndUpdate(reviewerId, {
                $push: { assignedMRs: mr._id }
            });
        }));

        res.status(201).json({ message: "MR created successfully", mr });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.mrUpdate = async (req, res) => {
    try {
        const { groupId } = req.query;
        const groupIdObj = new mongoose.Types.ObjectId(groupId);
        // Fetch only MRs that are not closed/merged
        const mrs = await MRModel.find({ groupId: groupIdObj, status: { $nin: ["closed", "merged"] } });


        if (mrs.length === 0) {
            return res.json({ message: "No open or pending MRs found to update" });
        }

        // Update each MR's status
        const updates = await Promise.all(mrs.map(async (mr) => {
            try {
                const status = await getMRStatus(mr.link, groupIdObj);
                await MRModel.findByIdAndUpdate(mr._id, { status }, { new: true });
                return { mrId: mr._id, status };
            } catch (error) {
                return { mrId: mr._id, status: "update_failed" };
            }
        }));

        res.json({ message: "MR statuses updated successfully", updates });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


exports.getMR = async (req, res) => {
    try {
        const { mrId } = req.params;
        if (!mrId) {
            return res.status(400).send("MR Id is missing");
        }
        // Assuming mrId is the _id of the document
        const mr = await MRModel.findById(mrId);
        return res.status(200).json({ data: mr });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}



exports.getMRGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Validate the groupId
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "Invalid or missing groupId" });
        }

        // Retrieve all merge requests for the given groupId.
        // Populate referenced fields without field selection to include all data.
        const mrs = await MRModel.find({ groupId })
            .populate("reviewerEmails") // This will populate all fields for each reviewer
            .populate("groupId", "name");       // This will populate all fields for the group

        return res.status(200).json({ data: mrs });
    } catch (err) {
        console.error("Error in getMRGroup:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAssignedMR = async (req, res) => {
    const { jwttoken, refreshtoken } = req.headers;
    try {
        let user;
        try {
            user = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or missing token." });
        }
        const mrs = await MRModel.find({ reviewerEmails: user._id })
            .populate({
                path: "reviewerEmails",
                select: "name email" // Get only name and email of reviewers
            })
            .populate({
                path: "creator",
                select: "name email" // Get creator's name
            })
            .populate({
                path: "groupId",
                select: "name" // Get group name
            });

        return res.status(200).json({ data: mrs });
    } catch (err) {
        return res.status(500).send({"server error": err})
    }
}

exports.myMRs = async (req, res) => {
    const { jwttoken, refreshtoken } = req.headers;
    try {
        let user;
        try {
            user = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or missing token." });
        }
        const mrs = await MRModel.find({ creator: user._id })
            .populate({
                path: "reviewerEmails",
                select: "name email" // Get only name and email of reviewers
            })
            .populate({
                path: "creator",
                select: "name email" // Get creator's name
            })
            .populate({
                path: "groupId",
                select: "name" // Get group name
            });

        return res.status(200).json({ data: mrs });
    } catch (err) {
        return res.status(500).send({"server error": err})
    }
}