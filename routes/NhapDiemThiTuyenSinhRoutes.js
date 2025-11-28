const express = require('express');
const router = express.Router();
const NhapDiemThiTuyenSinhController = require('../controllers/NhapDiemThiTuyenSinhController');

// Kiểm tra quyền Cán bộ SGD
const checkRole = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'Cán bộ SGD') {
    return res.status(403).send('Không có quyền truy cập');
  }
  next();
};

// 1. Render trang bằng AJAX (dùng với 1_main.js)
router.get('/render', checkRole, NhapDiemThiTuyenSinhController.renderPage);

// 2. API load danh sách thí sinh theo năm + phòng
router.get('/candidates', checkRole, NhapDiemThiTuyenSinhController.getCandidates);

// 3. API lưu điểm
router.post('/save', checkRole, NhapDiemThiTuyenSinhController.saveScore);

// 4. API xóa điểm
router.delete('/delete/:maThiSinh', checkRole, NhapDiemThiTuyenSinhController.deleteScore);

module.exports = router;