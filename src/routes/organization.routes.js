const express = require("express");
const router = express.Router();
const { createOrganization } = require("../controllers/organization.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/create",authMiddleware, createOrganization);

module.exports = router;
