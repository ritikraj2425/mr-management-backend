const express = require("express");
const router = express.Router();
const {signup,login,authCallback} = require("../controllers/auth.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/signup",checkForApiKey,signup);
router.post("/login",checkForApiKey, login);
router.get('/callback',authCallback)

module.exports = router;