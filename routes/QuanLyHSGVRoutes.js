const express = require('express');
const router = express.Router();
const quanly = require('../controllers/QuanLyHSGVController');

// Trang chính quản lý HSGV
router.get('/render', quanly.renderPage);

// Học sinh
router.get('/hocsinh', quanly.getHocSinh);
router.get('/hocsinh/edit/:id', quanly.editHocSinh);
router.post('/hocsinh/edit/:id', quanly.editHocSinh);
router.post('/hocsinh/delete/:id', quanly.deleteHocSinh);

// Giáo viên
router.get('/giaovien', quanly.getGiaoVien);
router.get('/giaovien/create',quanly.createGiaoVien);
router.post('/giaovien/create',  quanly.createGiaoVien);
router.get('/giaovien/edit/:id',  quanly.editGiaoVien);
router.post('/giaovien/edit/:id',  quanly.editGiaoVien);
router.post('/giaovien/delete/:id',quanly.deleteGiaoVien);

module.exports = router;
