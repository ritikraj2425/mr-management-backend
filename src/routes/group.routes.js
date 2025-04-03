const express = require("express");
const router = express.Router();
const {createGroup, getGroups, getUserGroups, addMember} = require("../controllers/group.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey,verifyJWT,createGroup);
router.get("/get",checkForApiKey,verifyJWT,getGroups);
router.get("/get/user",checkForApiKey,verifyJWT,getUserGroups);
router.post("/addMembers",checkForApiKey,verifyJWT, addMember);



module.exports = router;