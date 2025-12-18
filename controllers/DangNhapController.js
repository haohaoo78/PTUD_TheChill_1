// controllers/DangNhapController.js
const TaiKhoan = require('../models/DangNhapModel');
const db = require('../config/database');

// Map: KHÔNG DẤU → CÓ DẤU (GIỐNG FILE CŨ)
const roleMap = {
  HieuTruong: 'Hiệu trưởng',
  GiaoVu: 'Giáo vụ',
  GiaoVien: 'Giáo viên',
  HocSinh: 'Học sinh',
  PhuHuynh: 'Phụ huynh',
  QuanTriVien: 'Quản trị hệ thống',
  CanBoSGD: 'Cán bộ SGD',
  ThiSinh: 'Thí sinh'
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

      // ===== 1. Loại tài khoản (GIỮ NGUYÊN)
      const loaiTaiKhoan = user.LoaiTaiKhoan.trim(); // vd: "Phụ huynh"
      const role = roleMap[loaiTaiKhoan] || loaiTaiKhoan;
      const entityId = user.TenTaiKhoan.trim(); // SĐT phụ huynh

      // ===== 2. Lấy mã trường / mã học sinh
      let maTruong = null;
      let maHocSinh = null;

      if (loaiTaiKhoan === 'Giáo vụ') {
        const [rows] = await db.execute(
          'SELECT MaTruong FROM GiaoVu WHERE MaGiaoVu = ?',
          [entityId]
        );
        maTruong = rows[0]?.MaTruong || null;
      }

      if (loaiTaiKhoan === 'Hiệu trưởng') {
        const [rows] = await db.execute(
          'SELECT MaTruong FROM HieuTruong WHERE MaHieuTruong = ?',
          [entityId]
        );
        maTruong = rows[0]?.MaTruong || null;
      }

      // ✅ CHỈ THÊM ĐOẠN NÀY: PHỤ HUYNH → LẤY MÃ HỌC SINH
      if (loaiTaiKhoan === 'Phụ huynh') {
        const [rows] = await db.execute(
          'SELECT MaHocSinh FROM PhuHuynh WHERE SDT = ?',
          [entityId]
        );
        maHocSinh = rows[0]?.MaHocSinh || null;
      }

       if (loaiTaiKhoan === 'Học sinh') {
        const [rows] = await db.execute(
          'SELECT MaHocSinh FROM HocSinh WHERE MaHocSinh = ?',
          [entityId]
        );
        maHocSinh = rows[0]?.MaHocSinh || entityId;
      }
      // ===== 2.5. Kiểm tra vai trò GIÁO VIÊN
      let isGVBoMon = false;
      let isGVChuNhiem = false;

      if (loaiTaiKhoan === 'Giáo viên') {
        const [bm] = await db.execute(
          'SELECT 1 FROM GVBoMon WHERE MaGVBM = ? LIMIT 1',
          [entityId]
        );

        const [cn] = await db.execute(
          'SELECT 1 FROM GVChuNhiem WHERE MaGVCN = ? LIMIT 1',
          [entityId]
        );

        isGVBoMon = bm.length > 0;
        isGVChuNhiem = cn.length > 0;
      }


      // ===== 3. Session user (GIỮ NGUYÊN + THÊM maHocSinh)
      req.session.user = {
        username: entityId,
        role,                 // CÓ DẤU
        loaiTaiKhoan,         // CÓ DẤU (GIỮ NGUYÊN)
        entityId,             // SĐT phụ huynh
        maHocSinh,            // ✅ MÃ CON
        isAuthenticated: true,
        maTruong,
         // ✅ THÊM 2 CỜ PHÂN QUYỀN GV
        isGVBoMon,
        isGVChuNhiem
      };

      // ===== 4. Session phụ (GIỮ NGUYÊN)
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
        case 'Phụ huynh':
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
