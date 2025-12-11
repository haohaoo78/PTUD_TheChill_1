const express = require('express');
const router = express.Router();
const PhanLopController = require('../controllers/PhanLopController');

// 1. Render trang phân lớp
router.get('/render', PhanLopController.renderPage.bind(PhanLopController));

// 2. API lấy học sinh theo khối
router.post('/students', PhanLopController.getStudentsByKhoi.bind(PhanLopController));

// 3. API lấy danh sách lớp theo khối
router.post('/classes', PhanLopController.getClassesByKhoi.bind(PhanLopController));

// 4. API phân lớp tự động
router.post('/auto-assign', PhanLopController.autoAssign.bind(PhanLopController));

// 5. API lưu phân lớp vào DB
router.post('/save', PhanLopController.saveAssignment.bind(PhanLopController));

// 6. API xem danh sách học sinh trong một lớp
router.post('/class-students', PhanLopController.getStudentsInClass.bind(PhanLopController));

// 7. API điều chỉnh thủ công
router.post('/manual-assign', PhanLopController.manualAssign.bind(PhanLopController));

module.exports = router;