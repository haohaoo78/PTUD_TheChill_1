// controllers/DangNhapController.js
const TaiKhoan = require('../models/DangNhapModel');
const db = require('../config/database');

// Map chuẩn hóa: CÓ DẤU → KHÔNG DẤU (dùng cho phân quyền)
const normalizeMap = {
  'Hiệu trưởng': 'HieuTruong',
  'Giáo vụ': 'GiaoVu',
  'Giáo viên': 'GiaoVien',
  'Học sinh': 'HocSinh',
  'Phụ huynh': 'PhuHuynh',
  'Quản trị hệ thống': 'QuanTriVien',
  'Cán bộ SGD': 'CanBoSGD',
  'Thí sinh': 'ThiSinh'
};

class DangNhapController {
  renderLogin(req, res) {
    res.render('pages/dangnhap', {
      title: 'Đăng nhập hệ thống',
      user: null
    });
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin'
        });
      }

      const user = await TaiKhoan.login(username, password);

      if (!user) {
        return res.json({
          success: false,
          message: 'Sai tài khoản hoặc mật khẩu'
        });
      }

      // ===== 1. Lấy loại tài khoản từ DB (CÓ DẤU)
      const loaiTaiKhoanDB = user.LoaiTaiKhoan.trim();

      // ===== 2. Chuẩn hóa loại tài khoản (KHÔNG DẤU)
      const loaiTaiKhoan =
        normalizeMap[loaiTaiKhoanDB] || loaiTaiKhoanDB;

      const entityId = user.TenTaiKhoan.trim();

      // ===== 3. Lấy mã trường (chỉ với Giáo vụ)
// ===== 3. Lấy mã trường (Giáo vụ + Hiệu trưởng)
let maTruong = null;

if (loaiTaiKhoan === 'GiaoVu') {
  const [rows] = await db.execute(
    'SELECT MaTruong FROM GiaoVu WHERE MaGiaoVu = ?',
    [entityId]
  );
  maTruong = rows[0]?.MaTruong || null;
}

if (loaiTaiKhoan === 'HieuTruong') {
  const [rows] = await db.execute(
    'SELECT MaTruong FROM HieuTruong WHERE MaHieuTruong = ?',
    [entityId]
  );
  maTruong = rows[0]?.MaTruong || null;
}


      // ===== 4. Lưu session (CHUẨN)
      req.session.user = {
        username: entityId,
        role: loaiTaiKhoanDB,     // HIỂN THỊ (có dấu)
        loaiTaiKhoan: loaiTaiKhoan, // PHÂN QUYỀN (không dấu)
        entityId: entityId,
        isAuthenticated: true,
        maTruong: maTruong
      };

      // ===== 5. Lưu session phụ theo từng role
      switch (loaiTaiKhoan) {
        case 'GiaoVu':
          req.session.MaGiaoVu = entityId;
          break;
        case 'GiaoVien':
          req.session.MaGiaoVien = entityId;
          break;
        case 'HieuTruong':
          req.session.MaHieuTruong = entityId;
          break;
        case 'HocSinh':
          req.session.MaHocSinh = entityId;
          break;
        case 'PhuHuynh':
          req.session.SDTPhuHuynh = entityId;
          break;
      }

      console.log('✅ Đăng nhập thành công:', req.session.user);

      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        redirect: '/'
      });

    } catch (err) {
      console.error('💥 Lỗi đăng nhập:', err);
      return res.json({
        success: false,
        message: 'Lỗi server, thử lại sau'
      });
    }
  }

  logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        console.error('❌ Lỗi destroy session:', err);
        return res.json({
          success: false,
          message: 'Không thể đăng xuất'
        });
      }
      res.redirect('/');
    });
  }
}

module.exports = new DangNhapController();
