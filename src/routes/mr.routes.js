const express = require("express");
const router = express.Router();
const {createMR} = require("../controllers/mr.controller");
const {checkForApiKey} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, createMR);

module.exports = router;