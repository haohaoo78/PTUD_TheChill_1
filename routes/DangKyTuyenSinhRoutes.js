const express = require('express');
const DangKyTuyenSinhController = require('../controllers/DangKyTuyenSinhController');
const router = express.Router();

router.get('/render', DangKyTuyenSinhController.renderPage); // Load page
router.post('/luu-nguyen-vong', DangKyTuyenSinhController.saveNguyenVong);
router.post('/huy-nguyen-vong', DangKyTuyenSinhController.deleteNguyenVong);

module.exports = router;
