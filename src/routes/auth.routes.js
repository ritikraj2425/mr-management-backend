const express = require("express");
const router = express.Router();
const { signup, login, authCallback, requestOTP, requestOrgOTP, checkHandler } = require("../controllers/auth.controller");
const { checkForApiKey, verifyJWT } = require("../middlewares/auth.middleware");

router.post("/signup", checkForApiKey, signup);
router.post("/login", checkForApiKey, login);
router.get('/callback', authCallback)
router.post('/user/generate-otp', checkForApiKey, requestOTP)
router.post('/organization/generate-otp', verifyJWT, checkForApiKey, requestOrgOTP)
router.get('/check', checkHandler)
router.post("/logout", (req, res) => {
    // Clear the authToken cookie by setting it with Max-Age=0
    res.setHeader("Set-Cookie", "authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure");
    return res.status(200).json({ message: "Logout successful" });
});

module.exports = router;