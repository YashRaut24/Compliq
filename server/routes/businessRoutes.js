const express = require("express");
const businessController = require("../controllers/businessController");

const router = express.Router();

router.get("/", businessController.getBusinesses);
router.get("/:id", businessController.getBusiness);
router.post("/", businessController.createBusiness);
router.patch("/:id", businessController.updateBusiness);

module.exports = router;