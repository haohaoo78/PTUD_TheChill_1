const express = require('express');
const router = express.Router();
const GiaoBaiTapController = require('../controllers/GiaoBaiTapController');

// Render trang giao bài tập
router.get('/render', GiaoBaiTapController.renderPage);
// API
router.get('/classes', GiaoBaiTapController.getClasses);
router.get('/assignments', GiaoBaiTapController.getAssignments);
router.post('/assignments', GiaoBaiTapController.createAssignment);
router.put('/assignments/:id', GiaoBaiTapController.updateAssignment);

module.exports = router;
