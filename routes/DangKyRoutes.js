const express = require('express');
const router = express.Router();
const DangKyController = require('../controllers/DangKyController');

router.get('/DangKy', DangKyController.getDangKy);
router.post('/DangKy', DangKyController.postDangKy);
// routes/dangky.js hoặc nơi bạn định nghĩa route
router.get('/student-info', DangKyController.getStudentInfo);
module.exports = router;