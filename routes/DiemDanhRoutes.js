const express = require('express');
const router = express.Router();
const DiemDanhController = require('../controllers/DiemDanhController');

// Render trang điểm danh
router.get('/render', DiemDanhController.renderPage);
// API
router.get('/classes-today', DiemDanhController.getClassesToday);
router.get('/students', DiemDanhController.getStudents);
router.post('/save', DiemDanhController.saveAttendance);
router.post('/delete', DiemDanhController.deleteAttendance);

module.exports = router;
