// routes/XemBaiTapRoutes.js
const express = require("express");
const router = express.Router();
const XemBaiTapController = require("../controllers/XemBaiTapController");

router.get("/render", XemBaiTapController.renderPage);

module.exports = router;