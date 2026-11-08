const express = require("express");
const complaintController = require("../controllers/complaintController");

const router = express.Router();
const multer = require("multer");

router.get("/", complaintController.getComplaints);
router.post("/", complaintController.createComplaint);
router.post("/bulk", upload.single("file"), complaintController.uploadComplaints);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
});

module.exports = router;
