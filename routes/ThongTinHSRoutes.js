const express = require('express');
const router = express.Router();
const ThongTinHSController = require('../controllers/ThongTinHSController');

router.get('/render', ThongTinHSController.renderPage);
router.post('/get-info', ThongTinHSController.getInfo);
router.post('/update', ThongTinHSController.updateInfo);

module.exports = router;
