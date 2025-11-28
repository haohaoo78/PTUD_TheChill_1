const express = require('express');
const router = express.Router();
const PhanLopController = require('../controllers/PhanLopController');

router.get('/render', PhanLopController.renderPage);
router.post('/students', PhanLopController.getUnassignedStudents);
router.post('/classes', PhanLopController.getClassesByKhoi);
router.post('/class-counts', PhanLopController.getClassCounts);
router.post('/auto-assign', PhanLopController.autoAssign);
router.post('/save', PhanLopController.saveAssignment);
router.post('/class-students', PhanLopController.getClassStudents);

module.exports = router;