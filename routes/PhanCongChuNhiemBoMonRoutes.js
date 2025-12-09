const express = require('express');
const PhanCongController = require('../controllers/PhanCongChuNhiemBoMonController');
const router = express.Router();

router.get('/render', PhanCongController.renderPage);

// Chức năng GVCN
router.post('/classes', PhanCongController.getClassesForNamHoc);
router.post('/teachers-available', PhanCongController.getAvailableTeachersForChunhiem);
router.post('/current-gvcn', PhanCongController.getGVCNByClass);
router.post('/assign-chunhiem', PhanCongController.assignChunhiem);
router.post('/teacher-load', PhanCongController.getTeacherLoad);
router.post('/check-assign', PhanCongController.checkAssignBomon);
router.post('/subject-counts', PhanCongController.getSubjectCountsForClasses);
router.post('/check-hk-status', PhanCongController.checkHocKyStatus);

// Chức năng GVBM
router.post('/khoi-list', PhanCongController.getKhoiList);
router.post('/subjects', PhanCongController.getSubjectsByKhoi);
router.post('/classes-by-khoi', PhanCongController.getClassesByKhoi);
router.post('/teachers-by-subject', PhanCongController.getTeachersBySubject);
router.post('/assign-bomon', PhanCongController.assignBoMon);

module.exports = router;
