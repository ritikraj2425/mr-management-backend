const express = require("express");
const router = express.Router();
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");
const { getUser } = require("../controllers/user.controller");

router.get("/get",checkForApiKey,verifyJWT,getUser);

module.exports = router;

