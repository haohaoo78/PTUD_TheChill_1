const express = require('express');
const router = express.Router();
const quanly = require('../controllers/QuanLyHSGVController');
const { protect } = require('../middleware/auth');

// Trang chính quản lý HSGV
router.get('/quanlygiaovien_hocsinh', protect, quanly.renderPage);

// Học sinh
router.get('/hocsinh', protect, quanly.getHocSinh);
router.get('/hocsinh/edit/:id', protect, quanly.editHocSinh);
router.post('/hocsinh/edit/:id', protect, quanly.editHocSinh);
router.post('/hocsinh/delete/:id', protect, quanly.deleteHocSinh);

// Giáo viên
router.get('/giaovien', protect, quanly.getGiaoVien);
router.get('/giaovien/create', protect, quanly.createGiaoVien);
router.post('/giaovien/create', protect, quanly.createGiaoVien);
router.get('/giaovien/edit/:id', protect, quanly.editGiaoVien);
router.post('/giaovien/edit/:id', protect, quanly.editGiaoVien);
router.post('/giaovien/delete/:id', protect, quanly.deleteGiaoVien);

module.exports = router;
