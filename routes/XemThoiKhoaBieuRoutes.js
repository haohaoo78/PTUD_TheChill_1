const express = require('express');
const router = express.Router();
const controller = require('../controllers/XemThoiKhoaBieuController');

router.get('/render', controller.renderPage);
router.post('/getAll', controller.getAll);
router.post('/getKyHocList', controller.getKyHocList);

module.exports = router;