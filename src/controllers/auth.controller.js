const bcrypt = require("bcrypt");
require("dotenv").config();
const Verification = require('../services/jsonWebToken');
const Users = require("../models/user.model");
const saltRounds = 10;


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
