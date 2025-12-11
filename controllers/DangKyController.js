// controllers/DangKyController.js
const bcrypt = require('bcrypt');
const DangKyModel = require('../models/DangKyModel');

const DangKyController = {
  // Trang đăng ký
  getDangKy: async (req, res) => {
    try {
      const schools = await DangKyModel.getSchools();
      res.render('index', {
        page: 'dangky',
        user: null,
        schools
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi tải trang');
    }
  },

  // API lấy lớp theo trường
  getClasses: async (req, res) => {
    try {
      const { schoolId } = req.query;
      if (!schoolId) return res.json([]);
      const classes = await DangKyModel.getClassesBySchool(schoolId);
      res.json(classes);
    } catch (err) {
      console.error(err);
      res.json([]);
    }
  },

  // API lấy học sinh theo lớp
  getStudents: async (req, res) => {
    try {
      const { classId } = req.query;
      if (!classId) return res.json([]);
      const students = await DangKyModel.getStudentsByClass(classId);
      res.json(students);
    } catch (err) {
      console.error(err);
      res.json([]);
    }
  },

  // Xử lý đăng ký (trả JSON cho AJAX)
  postDangKy: async (req, res) => {
    try {
      const { fullName, phone, studentId, password, confirmPassword } = req.body;

      if (!fullName || !phone || !studentId || !password || !confirmPassword) {
        return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
      }

      if (password !== confirmPassword) {
        return res.json({ success: false, message: 'Mật khẩu xác nhận không khớp!' });
      }

      if (!/^\d{10,11}$/.test(phone)) {
        return res.json({ success: false, message: 'Số điện thoại không hợp lệ!' });
      }

      const existingUser = await DangKyModel.findByUsername(phone);
      if (existingUser) {
        return res.json({ success: false, message: 'Số điện thoại đã được đăng ký!' });
      }

      const student = await DangKyModel.findStudentById(studentId);
      if (!student) {
        return res.json({ success: false, message: 'Mã học sinh không tồn tại!' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await DangKyModel.createUser(phone, hashedPassword, studentId, phone, fullName);

      res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại!' });
    }
  }
};

module.exports = DangKyController;