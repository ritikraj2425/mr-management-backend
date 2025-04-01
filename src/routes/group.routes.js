const express = require("express");
const router = express.Router();
const {createGroup, getGroups} = require("../controllers/group.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey,verifyJWT,createGroup);
router.get("/get",checkForApiKey,verifyJWT,getGroups);

module.exports = router;