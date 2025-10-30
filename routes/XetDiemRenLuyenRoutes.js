const express = require('express');
const router = express.Router();
const quanly = require('../controllers/XetDiemRenLuyenController');

// Render page
router.get('/render', quanly.renderPage);

// Học sinh
router.get('/hocsinh', quanly.getHocSinh);
router.get('/hocsinh/:id', quanly.getHocSinhById);
router.post('/hocsinh', quanly.addHocSinh);
router.put('/hocsinh/:id', quanly.updateHocSinh);
router.delete('/hocsinh/:id', quanly.deleteHocSinh);

// Dropdown / filter
router.get('/namhoc', quanly.getNamHoc);
router.get('/giaovien', quanly.getTeachers);
router.get('/lop', quanly.getClassesByTeacher);
router.get('/truong', quanly.getTruong);

// Hạnh kiểm / Rèn luyện
router.get('/hocba', quanly.getHocBa);
router.put('/hocba', quanly.updateHocBa);


module.exports = router;
