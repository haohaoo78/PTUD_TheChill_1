const express = require('express');
const methodOverride = require('method-override'); // npm install method-override nếu chưa
const router = express.Router();
const NhapChitieuTuyenSinhController = require('../controllers/NhapChitieuTuyenSinhController');

// Middleware kiểm tra quyền (Cán bộ SGD)
const checkRole = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'Cán bộ SGD') {
    return res.redirect('/?error=Không có quyền truy cập');
  }
  next();
};

router.use(checkRole);
router.use(methodOverride('_method'));

// GET: Trang chính (sửa từ '/render' thành '/')
router.get('/render', NhapChitieuTuyenSinhController.renderPage);

router.get('/', NhapChitieuTuyenSinhController.index);

// POST: Tạo mới
router.post('/create', NhapChitieuTuyenSinhController.create);

// PUT: Cập nhật (AJAX)
router.put('/update/:chitieu', NhapChitieuTuyenSinhController.update);

// DELETE: Xóa (AJAX)
router.delete('/delete/:chitieu', NhapChitieuTuyenSinhController.delete);

// GET: Chi tiết để edit (AJAX)
router.get('/:chitieu', NhapChitieuTuyenSinhController.getById);

module.exports = router;