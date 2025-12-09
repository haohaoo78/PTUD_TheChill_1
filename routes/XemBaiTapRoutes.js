// routes/XemBaiTapRoutes.js
const express = require("express");
const router = express.Router();
const XemBaiTapController = require("../controllers/XemBaiTapController");

router.get("/render", XemBaiTapController.renderPage);
router.post('/detail', XemBaiTapController.getAssignmentDetail);

module.exports = router;