// routes/PhanLopRoutes.js

const express = require('express');
const router = express.Router();
const PhanLopController = require('../controllers/PhanLopController');

// 1. Render trang phân lớp
router.get('/render', PhanLopController.renderPage);

// 2. API lấy học sinh chưa có lớp (dùng cho danh sách bên trái)
router.post('/students', PhanLopController.getUnassignedStudents);

// 3. API lấy danh sách lớp theo khối (dùng cho bảng lớp bên phải)
router.post('/classes', PhanLopController.getClassesByKhoi);

// 4. API phân lớp tự động
router.post('/auto-assign', PhanLopController.autoAssign);

// 5. API lưu phân lớp vào DB
router.post('/save', PhanLopController.saveAssignment);

// 6. API xem danh sách học sinh trong một lớp (khi double click vào lớp)
router.post('/class-students', PhanLopController.getStudentsInClass);

// Bonus: nếu bạn vẫn muốn dùng đếm sĩ số hiện tại (t (không bắt buộc vì đã có trong /classes)
router.post('/class-counts', PhanLopController.getClassesByKhoi); // có thể bỏ nếu không dùng

module.exports = router;