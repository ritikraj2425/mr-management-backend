const express = require("express");
const router = express.Router();
const {signup,login} = require("../controllers/auth.controller");
const {checkForApiKey} = require("../middlewares/auth.middleware");

router.post("/signup",checkForApiKey,signup);
router.post("/login",checkForApiKey, login);

module.exports = router;