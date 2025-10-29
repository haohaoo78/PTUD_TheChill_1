const express = require('express');
const router = express.Router();
const DuyetController = require('../controllers/DuyetYeuCauSuaDiemController');

// Trang duyệt yêu cầu
router.get('/render', DuyetController.renderPage);

// API lấy chi tiết yêu cầu theo ID
router.get('/details/:id', DuyetController.getRequestDetails);

// API lọc danh sách yêu cầu theo trạng thái
router.post('/filter', DuyetController.getRequestsByStatus);

// API duyệt yêu cầu
router.post('/approve', DuyetController.approveRequest);

// API từ chối yêu cầu
router.post('/reject', DuyetController.rejectRequest);

module.exports = router;
