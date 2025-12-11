const express = require('express');
const router = express.Router();
const XemDiemController = require('../controllers/XemDiemController');

router.get('/render', XemDiemController.renderPage);
router.post('/get-scores', XemDiemController.getScores);

module.exports = router;
