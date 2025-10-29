const express = require('express');
const router = express.Router();
const quanly = require('../controllers/QuanLyHSGVController');

// Render page
router.get('/render', quanly.renderPage);

// Học sinh
router.get('/hocsinh', quanly.getHocSinh);
router.get('/hocsinh/:id', quanly.getHocSinhById);
router.post('/hocsinh', quanly.addHocSinh);
router.put('/hocsinh/:id', quanly.updateHocSinh);
router.delete('/hocsinh/:id', quanly.deleteHocSinh);

// Giáo viên
router.get('/giaovien', quanly.getGiaoVien);
router.get('/giaovien/:id', quanly.getGiaoVienById);
router.post('/giaovien', quanly.addGiaoVien);
router.put('/giaovien/:id', quanly.updateGiaoVien);
router.delete('/giaovien/:id', quanly.deleteGiaoVien);

// Dropdown / filter
router.get('/namhoc', quanly.getNamHoc);
router.get('/khoi', quanly.getKhoi);
router.get('/lop', quanly.getClassesByKhoi);
router.get('/monhoc', quanly.getMonHoc);

module.exports = router;
