const express = require("express");
const router = express.Router();
const {createMR} = require("../controllers/mr.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, createMR);
router.put("/update",checkForApiKey,verifyJWT, createMR);

module.exports = router;