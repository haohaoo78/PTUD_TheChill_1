const express = require('express');
const router = express.Router();
const HocPhiController = require('../controllers/HocPhiController');

router.get('/render', HocPhiController.renderPage);
router.post('/get-tuition', HocPhiController.getTuition);
router.post('/pay', HocPhiController.payTuition);
router.get('/vnpay_return', HocPhiController.vnpayReturn);
router.get('/momo_return', HocPhiController.momoReturn);
router.get('/bank-transfer', HocPhiController.renderBankTransfer);
router.post('/confirm-bank-transfer', HocPhiController.confirmBankTransfer);

module.exports = router;
