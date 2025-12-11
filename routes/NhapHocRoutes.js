const express = require('express');
const router = express.Router();
const NhapHocController = require('../controllers/NhapHocController');

router.get('/render', NhapHocController.renderPage);
router.post('/status', NhapHocController.getStatus);
router.post('/confirm', NhapHocController.confirm);

module.exports = router;
