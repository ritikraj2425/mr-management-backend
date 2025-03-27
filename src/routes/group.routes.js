const express = require("express");
const router = express.Router();
const {createGroup} = require("../controllers/group.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey,verifyJWT,createGroup);

module.exports = router;