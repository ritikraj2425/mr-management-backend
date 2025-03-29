const bcrypt = require("bcrypt");
require("dotenv").config();
const Verification = require('../services/jsonWebToken');
const Users = require("../models/user.model");
const saltRounds = 10;
const Group = require("../models/group.model");
const Organization = require("../models/organization.model");
const axios = require("axios");
const { generateOTP, sendOtpEmail } = require("../utils/otp.utils");



exports.signup = async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        let user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No OTP request found. Please request OTP first." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified. Please log in." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        // Hash password and verify user
        user.name = name;
        user.password = await bcrypt.hash(password, 10);
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        // Check if the user was invited to an organization
        const organization = await Organization.findOne({ pendingInvitations: email });

        if (organization) {
            user.organizationId = organization._id;
            organization.members.push(user._id);
            organization.pendingInvitations = organization.pendingInvitations.filter(invEmail => invEmail !== email);
            await organization.save();
        }

        await user.save();

        // Generate tokens
        const payload = { name, email };
        const token = Verification.generateJwt(payload);
        const refreshToken = Verification.generateRefreshToken(payload);

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

        res.status(200).json({
            message: "Login successful",
            jwtToken: token,
            refreshToken: refreshToken,
        });
    } catch (e) {
        res.status(500).json({ message: "Something went wrong while logging in" });
    }
};

const CLIENT_SECRET = {
    github: process.env.GITHUB_CLIENT_SECRET,
    gitlab: process.env.GITLAB_CLIENT_SECRET,
    bitbucket: process.env.BITBUCKET_CLIENT_SECRET,
    // azure: process.env.AZURE_CLIENT_SECRET,
};


exports.authCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const { organizationId, name, userId, platform } = JSON.parse(decodeURIComponent(state));

        if (!code || !organizationId || !name || !userId || !platform) {
            return res.status(400).json({ message: "Invalid request." });
        }

        let tokenUrl, tokenData, headers = {};
        let scopes = ""; // Define scopes for MR access only

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
            members: [userId],
            tokens: { [platform]: accessToken }, // Store token for platform
            authorizedPlatforms: [platform],
        });
        await group.save();

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
        let user = await Users.findOne({ email });

        if (user && user.isVerified) {
            return res.status(400).json({ message: "User already verified. Please log in." });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry

        if (!user) {
            user = new Users({ email, otp, otpExpiry, isVerified: false });
        } else {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }

        await user.save();
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: "OTP sent to email. Verify to continue." });
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};