const express = require('express');
const router = express.Router();
const NhanXetHocSinhController = require('../controllers/NhanXetHocSinhController');

// Render trang nhận xét học sinh
router.get('/render', NhanXetHocSinhController.renderPage);
// API
router.get('/classes', NhanXetHocSinhController.getClasses);
router.get('/students', NhanXetHocSinhController.getStudents);
router.put('/comment', NhanXetHocSinhController.updateComment);
router.put('/comment-multiple', NhanXetHocSinhController.updateCommentMultiple);

module.exports = router;
