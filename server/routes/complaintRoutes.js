const express = require("express");
const complaintController = require("../controllers/complaintController");
const multer = require("multer");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
});

router.get("/", complaintController.getComplaints);
router.post("/", complaintController.createComplaint);
router.post("/bulk", upload.single("file"), complaintController.uploadComplaints);
router.patch("/:id/reply", complaintController.updateComplaintReply);

module.exports = router;
