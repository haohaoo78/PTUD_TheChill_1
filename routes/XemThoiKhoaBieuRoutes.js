// routes/XemThoiKhoaBieuRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/XemThoiKhoaBieuController');

// Route này trả về HTML cho 1_main.js fetch
router.get('/render', controller.renderPage);

// Route này trả về JSON dữ liệu TKB
router.get('/data', controller.getScheduleData);

module.exports = router;