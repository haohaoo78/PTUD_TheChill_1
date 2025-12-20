const express = require('express');
const ThoiKhoaBieuController = require('../controllers/ThoiKhoaBieuController');
const router = express.Router();

router.get('/render', ThoiKhoaBieuController.renderPage);
router.post('/getAll', ThoiKhoaBieuController.getAll);
router.post('/getKyHocList', ThoiKhoaBieuController.getKyHocList);
router.post('/getTeacher', ThoiKhoaBieuController.getTeacher);
router.post('/getAvailableTeachersForSlot', ThoiKhoaBieuController.getAvailableTeachersForSlot);
router.post('/saveAll', ThoiKhoaBieuController.saveAll);
router.post('/resetWeek', ThoiKhoaBieuController.resetWeek);
router.post('/getSubjectsByClass', ThoiKhoaBieuController.getSubjectsByClass);
router.post('/getLopTheoKhoi', ThoiKhoaBieuController.getLopTheoKhoi);
router.post('/deleteCell', ThoiKhoaBieuController.deleteCell);
router.post('/checkSubjectLimit', ThoiKhoaBieuController.checkSubjectLimit);
router.post('/checkSubjectConflict', ThoiKhoaBieuController.checkSubjectConflict); // API mới

module.exports = router;
