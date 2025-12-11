const express = require('express');
const router = express.Router();
const XinPhepController = require('../controllers/XinPhepController');

router.get('/render', XinPhepController.renderPage);
router.post('/create', XinPhepController.createRequest);
router.post('/history', XinPhepController.getHistory);

// Teacher routes
router.get('/duyet/render', XinPhepController.renderDuyetPage);
router.post('/teacher/requests', XinPhepController.getTeacherRequests);
router.post('/teacher/update-status', XinPhepController.updateStatus);

module.exports = router;
