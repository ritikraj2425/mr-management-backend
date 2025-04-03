const bcrypt = require("bcrypt");
require("dotenv").config();
const Verification = require('../services/jsonWebToken');
const Users = require("../models/user.model");
const saltRounds = 10;
const Group = require("../models/group.model");
const Organization = require("../models/organization.model");
const axios = require("axios");
const { generateOTP, sendOtpEmail } = require("../utils/otp.utils");
const OrganizationOTP = require("../models/organizationOTP");
const OTPStore = require("../models/OTPStore");
const jwt = require("jsonwebtoken");



exports.signup = async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check OTP in OTPStore
        const otpEntry = await OTPStore.findOne({ email });

        if (!otpEntry || otpEntry.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        if (otpEntry.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        // Check if user already exists and is verified
        let user = await Users.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ message: "User already verified. Please log in." });
        }

        if (!user) {
            // Create a new verified user
            user = new Users({
                name,
                email,
                password: await bcrypt.hash(password, 10),
                isVerified: true,
            });
        } else {
            // Update existing user
            user.name = name;
            user.password = await bcrypt.hash(password, 10);
            user.isVerified = true;
        }

        // Check if user was invited to an organization
        const organization = await Organization.findOne({ pendingInvitations: email });

        if (organization) {
            user.organizationId = organization._id;
            organization.members.push(user._id);
            organization.pendingInvitations = organization.pendingInvitations.filter(invEmail => invEmail !== email);
            await organization.save();
        }

        await user.save();

        // Delete OTP entry after successful verification
        await OTPStore.deleteOne({ email });

        // Generate tokens
        const payload = { name, email };
        const token = Verification.generateJwt(payload);
        const refreshToken = Verification.generateRefreshToken(payload);
        res.setHeader("Set-Cookie", `authToken=${token}; HttpOnly; Path=/; Max-Age=259200; SameSite=None; Secure;`);
        res.status(200).json({
            message: "Signup successful! You are now verified.",
            jwtToken: token,
            refreshToken: refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: "Error signing up", error: error.message });
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await Users.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const payload = { name: user.name, email: user.email };

        const token = Verification.generateJwt(payload);
        const refreshToken = Verification.generateRefreshToken(payload);
        res.setHeader("Set-Cookie", `authToken=${token}; HttpOnly; Path=/; Max-Age=259200; SameSite=None; Secure`);

        res.status(200).json({
            message: "Login successful",
            jwtToken: token,
            refreshToken: refreshToken,
        });
    } catch (e) {
        res.status(500).json({ message: "Something went wrong while logging in" });
    }
};



const SECRET_KEY = process.env.JWT_SECRET;

exports.checkHandler = async (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(200).json({ isAuthenticated: false });
    }

    try {
        jwt.verify(token, SECRET_KEY);
        return res.status(200).json({ isAuthenticated: true });
    } catch (error) {
        return res.status(200).json({ isAuthenticated: false });
    }
}


const CLIENT_SECRET = {
    github: process.env.GITHUB_CLIENT_SECRET,
    gitlab: process.env.GITLAB_CLIENT_SECRET,
    bitbucket: process.env.BITBUCKET_CLIENT_SECRET,
    // azure: process.env.AZURE_CLIENT_SECRET,
};


exports.authCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const { organizationId, name, userId, platform, description } = JSON.parse(decodeURIComponent(state));

        if (!code || !organizationId || !name || !userId || !platform || !description) {
            return res.status(400).json({ message: "Invalid request." });
        }

        let tokenUrl, tokenData, headers = {};
        let scopes = "";

        switch (platform) {
            case "github":
                tokenUrl = "https://github.com/login/oauth/access_token";
                scopes = "read:pull_request"; // Read-only pull request access
                tokenData = {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.REDIRECT_URI,
                    scope: scopes,
                };
                headers = { Accept: "application/json" };
                break;
            case "gitlab":
                tokenUrl = "https://gitlab.com/oauth/token";
                scopes = "read_api read_repository"; // Matches authorization request
                tokenData = {
                    client_id: process.env.GITLAB_CLIENT_ID,
                    client_secret: process.env.GITLAB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.REDIRECT_URI,
                    grant_type: "authorization_code",
                };
                break;

            case "bitbucket":
                tokenUrl = "https://bitbucket.org/site/oauth2/access_token";
                scopes = "repository.pullrequest"; // Read-only access to pull requests (MRs)
                tokenData = {
                    client_id: process.env.BITBUCKET_CLIENT_ID,
                    client_secret: process.env.BITBUCKET_CLIENT_SECRET,
                    code,
                    grant_type: "authorization_code",
                    scope: scopes,
                };
                break;

            default:
                return res.status(400).json({ message: "Unsupported platform." });
        }

        // Exchange the code for an access token
        const tokenResponse = await axios.post(tokenUrl, tokenData, { headers });
        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            throw new Error("Access token retrieval failed.");
        }

        // Create the group with the OAuth token for the given platform
        const group = new Group({
            name,
            organizationId,
            description,
            members: [userId],
            tokens: { [platform]: accessToken }, // Store token for platform
            authorizedPlatforms: [platform],
        });
        await group.save();

        await Users.findByIdAndUpdate(
            userId,
            { $push: { groupId: group._id } }, // Adding group to user
            { new: true }
        );
        // Update the organization to include this new group
        await Organization.findByIdAndUpdate(
            organizationId,
            { $push: { groups: group._id } }
        );

        // Redirect to the frontend homepage after successful group creation.
        res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};





exports.requestOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        // Check if the user already exists and is verified
        let user = await Users.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ message: "User already verified. Please log in." });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry

        // Store OTP in OTPStore collection
        let otpEntry = await OTPStore.findOne({ email });

        if (otpEntry) {
            otpEntry.otp = otp;
            otpEntry.otpExpiry = otpExpiry;
        } else {
            otpEntry = new OTPStore({ email, otp, otpExpiry });
        }

        await otpEntry.save();
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: "OTP sent to email. Verify to continue." });
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};



exports.requestOrgOTP = async (req, res) => {
    const { orgName, orgEmail } = req.body;

    if (!orgEmail || !orgName) {
        return res.status(400).json({ message: "Organization name and email are required." });
    }

    try {
        // Validate email format
        const emailParts = orgEmail.split("@");
        if (emailParts.length !== 2) {
            return res.status(400).json({ message: "Invalid organization email format." });
        }

        const domain = emailParts[1];
        const genericDomains = ["gmail.com", "yahoo.com", "hotmail.com"];
        if (genericDomains.includes(domain)) {
            return res.status(400).json({ message: "Invalid organization email. Please use a business email." });
        }

        // Check if an organization already exists
        const existingOrg = await Organization.findOne({ orgEmail });
        if (existingOrg) {
            return res.status(400).json({ message: `Organization already exists. Please contact the admin (${existingOrg.orgEmail}) to join.` });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Check if OTP request exists and update it
        let otpEntry = await OrganizationOTP.findOne({ orgEmail });

        if (otpEntry) {
            otpEntry.otp = otp;
            otpEntry.otpExpiry = otpExpiry;
        } else {
            otpEntry = new OrganizationOTP({ orgName, orgEmail, otp, otpExpiry });
        }

        await otpEntry.save();
        await sendOtpEmail(orgEmail, otp);

        res.status(200).json({ message: "OTP sent to organization email. Verify to continue." });
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};