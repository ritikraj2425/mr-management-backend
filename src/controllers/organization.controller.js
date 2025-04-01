const Organization = require("../models/organization.model");
const OrganizationOTP = require("../models/organizationOTP");
const User = require("../models/user.model");
const { sendEmail } = require('../utils/nodeMailer.utils'); // Adjust the path as necessary
const { getUserFromToken } = require('../utils/userDetails.utils'); // Adjust the path as necessary

exports.createOrganization = async (req, res) => {
    try {
        const { orgName, orgEmail, otp } = req.body;

        if (!orgName || !orgEmail || !otp) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Find the OTP entry
        const otpEntry = await OrganizationOTP.findOne({ orgEmail });
        if (!otpEntry || otpEntry.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Check if OTP has expired
        if (new Date() > otpEntry.otpExpiry) {
            return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
        }

        // Check if organization already exists
        const existingOrg = await Organization.findOne({ orgEmail });
        if (existingOrg) {
            return res.status(400).json({ message: `Organization already exists. Contact ${existingOrg.orgEmail} to join.` });
        }

        // Check if user exists
        const userWithDomain = await User.findOne({ email: orgEmail });
        if (!userWithDomain) {
            return res.status(400).json({ message: "No user found with this email. Please create an account first." });
        }

        if (!userWithDomain.isAdmin) {
            userWithDomain.isAdmin = true;
        }

        // Create verified organization
        const organization = new Organization({
            orgName,
            orgEmail,
            orgDomain: orgEmail.split("@")[1],
            members: [userWithDomain._id],
            isVerified: true
        });

        await organization.save();

        // Assign organization to user
        userWithDomain.organizationId = organization._id;
        await userWithDomain.save();

        // Delete OTP entry after successful verification
        await OrganizationOTP.deleteOne({ orgEmail });

        res.status(201).json({ message: "Organization verified and created successfully", organization });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




exports.addMembersToOrganization = async (req, res) => {
    try {
        const { emails } = req.body; // expecting an array of emails
        const { jwttoken, refreshtoken } = req.headers;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ message: "An array of emails is required." });
        }

        // Authenticate admin user
        let adminUser;
        try {
            adminUser = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }

        if (!adminUser.isAdmin) {
            return res.status(403).json({ message: "Only admins can add members." });
        }

        const organization = await Organization.findById(adminUser.organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found." });
        }

        const addedMembers = [];
        const invitationEmailsSent = [];
        const errors = [];

        for (const email of emails) {
            // Validate email format and extract domain
            const emailParts = email.split('@');
            if (emailParts.length !== 2) {
                errors.push(`Invalid email format for ${email}.`);
                continue;
            }
            const emailDomain = emailParts[1].toLowerCase();

            // Only process if the email's domain matches the organization's domain
            if (emailDomain !== organization.orgDomain.toLowerCase()) {
                errors.push(`Email ${email} does not match the organization's domain.`);
                continue;
            }

            // Check if the user already exists
            const user = await User.findOne({ email });
            if (user) {
                // If already a member, skip the addition
                if (organization.members.includes(user._id)) {
                    errors.push(`User with email ${email} is already a member.`);
                    continue;
                }
                // Add the user to the organization
                organization.members.push(user._id);
                user.organizationId = organization._id;
                await user.save();

                // Send email notification to the existing user
                const subject = `You've been added to ${organization.orgName}`;
                const textContent = `Hello ${user.name},\n\nYou've been added to the organization ${organization.orgName}.`;
                const htmlContent = `<p>Hello ${user.name},</p><p>You've been added to the organization <strong>${organization.orgName}</strong>.</p>`;
                try {
                    await sendEmail(user.email, subject, htmlContent, textContent);
                } catch (emailError) {
                    errors.push(`Failed to send notification email to ${email}: ${emailError.message}`);
                }
                addedMembers.push(user);
            } else {
                // If the user does not exist, add the email to pendingInvitations if not already added
                if (!organization.pendingInvitations.includes(email)) {
                    organization.pendingInvitations.push(email);
                }

                // Send invitation email to sign up
                const subject = `Invitation to join ${organization.orgName}`;
                const invitationLink = `${process.env.FRONTEND_URL}/signup`;
                const textContent = `Hello,\n\nYou've been added to the organization ${organization.orgName}. Please sign up to view your account. Click the following link: ${invitationLink}`;
                const htmlContent = `<p>Hello,</p><p>You've been added to the organization <strong>${organization.orgName}</strong>. Please <a href="${invitationLink}">sign up</a> to view your account.</p>`;
                try {
                    await sendEmail(email, subject, htmlContent, textContent);
                    invitationEmailsSent.push(email);
                } catch (emailError) {
                    errors.push(`Failed to send invitation email to ${email}: ${emailError.message}`);
                }
            }
        }

        await organization.save();

        res.status(200).json({
            message: "Member processing complete.",
            addedMembers,
            invitationEmailsSent,
            errors
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.getOrganizationDetails = async (req, res) => {
    try {
        const { jwttoken, refreshtoken } = req.headers;

        // Authenticate user
        let user;
        try {
            user = await getUserFromToken(jwttoken, refreshtoken);
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }

        // Find organization by user ID
        const organization = await Organization.findOne({ members: user._id }).populate('members', 'name email');

        if (!organization) {
            return res.status(404).json({ message: "Organization not found." });
        }

        res.status(200).json({ data: organization });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
