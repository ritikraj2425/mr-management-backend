const express = require("express");
const router = express.Router();
const {createMR,mrUpdate} = require("../controllers/mr.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, createMR);
router.put("/update",checkForApiKey,verifyJWT, mrUpdate);

module.exports = router;