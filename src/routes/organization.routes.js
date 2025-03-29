const express = require("express");
const router = express.Router();
const { createOrganization,addMembersToOrganization } = require("../controllers/organization.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, verifyJWT, createOrganization);
router.post("/addMembers",checkForApiKey, addMembersToOrganization);

module.exports = router;



// otp service is pending
// reviewer email send in pending
