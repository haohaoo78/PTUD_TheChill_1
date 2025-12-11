// routes/DangKyTuyenSinhRoutes.js
const express = require('express');
const router = express.Router();
const DangKyTuyenSinhController = require('../controllers/DangKyTuyenSinhController');

// Hiển thị trang tuyển sinh
router.get('/render', DangKyTuyenSinhController.renderPage);

// Lấy danh sách trường + tổ hợp
router.get('/data', DangKyTuyenSinhController.getData);

// Lưu nguyện vọng
router.post('/luu-nguyen-vong', DangKyTuyenSinhController.luuNguyenVong);

// Hủy nguyện vọng
router.post('/huy-nguyen-vong', DangKyTuyenSinhController.huyNguyenVong);

// Xem thông tin phòng thi
router.get('/thong-tin-phong-thi', DangKyTuyenSinhController.getThongTinPhongThi);

module.exports = router;
