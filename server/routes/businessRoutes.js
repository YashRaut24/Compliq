const express = require("express");
const businessController = require("../controllers/businessController");

const router = express.Router();

router.get("/", businessController.getBusinesses);
router.post("/", businessController.createBusiness);

module.exports = router;