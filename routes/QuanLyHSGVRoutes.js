const express = require('express');
const router = express.Router();
const quanly = require('../controllers/QuanLyHSGVController');

// Render page
router.get('/render', quanly.renderPage);

// ---- Học sinh ----
router.get('/hocsinh', quanly.getHocSinh);
router.get('/hocsinh/:id', quanly.getHocSinhById);
router.post('/hocsinh', quanly.addHocSinh);
router.put('/hocsinh/:id', quanly.updateHocSinh);
router.delete('/hocsinh/:id', quanly.deleteHocSinh);

// ---- Giáo viên ----
router.get('/giaovien', quanly.getGiaoVien);
router.get('/giaovien/:id', quanly.getGiaoVienById);
router.post('/giaovien', quanly.addGiaoVien);
router.put('/giaovien/:id', quanly.updateGiaoVien);
router.delete('/giaovien/:id', quanly.deleteGiaoVien);

// ---- Dropdown / filter phụ trợ ----
router.get('/namhoc', quanly.getNamHoc);            // danh sách năm học
router.get('/khoi', quanly.getKhoi);               // danh sách khối
router.get('/lop', quanly.getClassesByKhoi);  // lớp theo khối
router.get('/hocky', quanly.getHocKy);             // danh sách học kỳ
router.get('/monhoc', quanly.getMonHoc);

module.exports = router;
