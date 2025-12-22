// routes/QuanLyTruongRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/QuanLyTruongController');

// ==================== TRANG CHÍNH ====================
router.get('/render', controller.renderPage);

// ==================== QUẢN LÝ TRƯỜNG (CRUD + LIST) ====================

// Lấy danh sách trường (có lọc)
router.get('/getAll', controller.getAll);

// Thêm trường mới
router.post('/create', controller.create);

// Sửa trường
router.put('/update/:MaTruong', controller.update);

// Xóa trường
router.delete('/delete/:MaTruong', controller.delete);

// ==================== QUẢN LÝ HIỆU TRƯỞNG (CHO TỪNG TRƯỜNG) ====================

// Lấy thông tin hiệu trưởng của một trường cụ thể
// Ví dụ: GET /api/truong/T01/hieutruong
router.get('/:MaTruong/hieutruong', controller.getHieuTruong);

// Thêm mới hoặc Cập nhật hiệu trưởng cho trường
// POST body: { TenHieuTruong, NgaySinh, GioiTinh, Email, SDT, NgayNhanChuc, DiaChi, GhiChu }
// Nếu trường chưa có HT → thêm mới
// Nếu đã có → cập nhật
router.post('/:MaTruong/hieutruong', controller.upsertHieuTruong);

// (Tùy chọn) Xóa hiệu trưởng của trường
// DELETE /api/truong/T03/hieutruong
router.delete('/:MaTruong/hieutruong', controller.deleteHieuTruong);

module.exports = router;