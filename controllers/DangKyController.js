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
  // Trong DangKyController hoặc thêm vào routes
getStudentInfo: async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã học sinh' });

    const trimmedId = studentId.trim().toUpperCase();

    const student = await DangKyModel.findStudentInfoById(trimmedId);
    if (!student) {
      return res.json({ success: false, message: 'Mã học sinh không tồn tại!' });
    }

    // === KIỂM TRA PHỤ HUYNH ĐÃ TỒN TẠI CHƯA ===
    const existingParent = await DangKyModel.checkParentExists(trimmedId);
    if (existingParent) {
      return res.json({
        success: false,
        message: `Mã học sinh này đã được phụ huynh "${existingParent.HoTen}" (SĐT: ${existingParent.SDT}) đăng ký rồi!`
      });
    }

    // Chưa có → cho phép đăng ký
    res.json({
      success: true,
      data: {
        name: student.TenHocSinh,
        class: student.TenLop
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
}
};

module.exports = DangKyController;