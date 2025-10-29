const express = require('express');
const router = express.Router();
const DangKyController = require('../controllers/DangKyController');

router.get('/DangKy', DangKyController.getDangKy);
router.post('/DangKy', DangKyController.postDangKy);

module.exports = router;
