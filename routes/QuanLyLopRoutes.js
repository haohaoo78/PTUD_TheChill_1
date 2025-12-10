// routes/quanlylop.js
const express = require('express');
const router = express.Router();
const QuanLyLopController = require('../controllers/QuanLyLopController');

router.get('/render', QuanLyLopController.renderPage);
router.post('/classes', QuanLyLopController.getClassesByKhoi);
router.post('/create', QuanLyLopController.createClasses);
router.post('/update', QuanLyLopController.updateClass);
router.post('/delete', QuanLyLopController.deleteClass);
router.post('/teachers', QuanLyLopController.getTeachers);

module.exports = router;