const express = require("express");
const router = express.Router();
const { createOrganization } = require("../controllers/organization.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, verifyJWT, createOrganization);

module.exports = router;
