const express = require("express");
const router = express.Router();
const {createMR,mrUpdate, getMR, getMRGroup, getAssignedMR, myMRs} = require("../controllers/mr.controller");
const {checkForApiKey,verifyJWT} = require("../middlewares/auth.middleware");

router.post("/create",checkForApiKey, createMR);
router.put("/update",checkForApiKey,verifyJWT, mrUpdate);
router.get("/get/:mrId", checkForApiKey, verifyJWT, getMR)
router.get("/getGroup/:groupId", checkForApiKey, verifyJWT, getMRGroup)
router.get("/getAssignedMR",checkForApiKey,getAssignedMR);
router.get("/getMyMr",checkForApiKey,myMRs);

module.exports = router;