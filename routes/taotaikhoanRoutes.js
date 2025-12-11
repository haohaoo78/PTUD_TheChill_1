const express = require('express');
const router = express.Router();
const TaiKhoanController = require('../controllers/taotaikhoanController');

// Render trang
router.get('/render', TaiKhoanController.renderPage);

// API JSON
router.get('/list', TaiKhoanController.getList);
router.get('/get', TaiKhoanController.getOne);

// Tạo/Sửa/Xóa
router.post('/taotk', TaiKhoanController.create);
router.put('/update', TaiKhoanController.update);
router.delete('/delete', TaiKhoanController.delete);
router.get('/loai',TaiKhoanController.getLoaiTaiKhoan);  // thêm dòng này
module.exports = router;
