const bcrypt = require('bcrypt');
const DangKyModel = require('../models/DangKyModel');

const DangKyController = {
  getDangKy: (req, res) => {
    res.render('index', { page: 'dangky', user: null });
  },

  postDangKy: async (req, res) => {
    try {
      const { password, confirmPassword, studentId, phone, fullName } = req.body;

      // Kiểm tra đầy đủ thông tin
      if (!password || !confirmPassword || !studentId || !phone || !fullName) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
      }

      // Kiểm tra mật khẩu
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp!' });
      }

      // Kiểm tra số điện thoại đã được đăng ký chưa
      const existingUser = await DangKyModel.findByUsername(phone);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký!' });
      }

      // Kiểm tra mã học sinh tồn tại
      const studentExists = await DangKyModel.findStudentById(studentId);
      if (!studentExists) {
        return res.status(400).json({ success: false, message: 'Mã học sinh không tồn tại!' });
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo tài khoản và thêm dữ liệu vào bảng PhuHuynh
      await DangKyModel.createUser(phone, hashedPassword, studentId, phone, fullName);

      res.status(200).json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
      console.error('❌ Lỗi đăng ký:', err);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ!' });
    }
  },
};

module.exports = DangKyController;
