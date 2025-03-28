const bcrypt = require("bcrypt");
require("dotenv").config();
const Verification = require('../services/jsonWebToken');
const Users = require("../models/user.model");
const saltRounds = 10;
const Group = require("../models/group.model");
const Organization = require("../models/organization.model");
const axios = require("axios");



exports.signup = async (req, res) => {

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "all fields are required",
        });
    }
    try {
        const checkEmailExist = await Users.findOne({
            email: email,
        });
        if (checkEmailExist) {
            res
                .status(400)
                .send({ message: "email already exists" });
            return;
        }

        const hash = await bcrypt.hash(password, saltRounds);
        const user = new Users({
            ...req.body,
            password: hash,
        });
        await user.save();

        const payload = { name, email };
        const token = Verification.generateJwt(payload);
        const refreshToken = Verification.generateRefreshToken(payload);
        res.status(200).send({
            message: "success",
            jwtToken: token,
            refreshToken: refreshToken,
        });
        return;
    } catch (e) {
        res.status(500).send({ message: "something went wrong while signing up" });
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

        switch (platform) {
            case "github":
                tokenUrl = "https://github.com/login/oauth/access_token";
                tokenData = {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.REDIRECT_URI, // Must exactly match the OAuth app settings
                };
                headers = { Accept: "application/json" };
                break;
            case "gitlab":
                tokenUrl = "https://gitlab.com/oauth/token";
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
                tokenData = {
                    client_id: process.env.BITBUCKET_CLIENT_ID,
                    client_secret: process.env.BITBUCKET_CLIENT_SECRET,
                    code,
                    grant_type: "authorization_code",
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