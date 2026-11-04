const express = require("express");
const complaintController = require("../controllers/complaintController");

const router = express.Router();

router.get("/", complaintController.getComplaints);
router.post("/", complaintController.createComplaint);

module.exports = router;