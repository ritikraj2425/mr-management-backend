const express = require("express");
const router = express.Router();
const {signup,login,authCallback, requestOTP, requestOrgOTP} = require("../controllers/auth.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/signup",checkForApiKey,signup);
router.post("/login",checkForApiKey, login);
router.get('/callback',authCallback)
router.post('/user/generate-otp',checkForApiKey,requestOTP)
router.post('/organization/generate-otp',verifyJWT,checkForApiKey,requestOrgOTP)

module.exports = router;