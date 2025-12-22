// controllers/DangNhapController.js
const TaiKhoan = require('../models/DangNhapModel');
const db = require('../config/database');

// Map hiển thị vai trò có dấu (giữ nguyên nếu cần, nhưng không ảnh hưởng đến logic so sánh)
const roleMap = {
  'HieuTruong': 'Hiệu trưởng',
  'GiaoVu': 'Giáo vụ',
  'GiaoVien': 'Giáo viên',
  'HocSinh': 'Học sinh',
  'PhuHuynh': 'Phụ huynh',
  'QuanTriVien': 'Quản trị hệ thống',
  'CanBoSGD': 'Cán bộ SGD',
  'ThiSinh': 'Thí sinh',
  'Học sinh': 'Học sinh',
  'Giáo viên': 'Giáo viên',
  'Thí sinh': 'Thí sinh'
  // Thêm các biến thể khác nếu cần
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
        return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
      }

      const user = await TaiKhoan.login(username, password);
      if (!user) {
        return res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
      }

      // ===== CHỮA LỖI CHÍNH TẠI ĐÂY =====
      const loaiTaiKhoanRaw = user.LoaiTaiKhoan.trim(); // Giá trị gốc từ DB: "Học sinh", "Giáo viên",...

      // Chuẩn hóa để so sánh an toàn (bỏ dấu, xóa khoảng trắng, chữ thường)
      const loaiKey = loaiTaiKhoanRaw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, '')              // xóa khoảng trắng
        .toLowerCase();

      // Role hiển thị có dấu
      const role = roleMap[loaiTaiKhoanRaw] || loaiTaiKhoanRaw;

      const entityId = user.TenTaiKhoan.trim();

      // Biến thông tin người dùng
      let hoTen = entityId;
      let tenLop = null;
      let maLop = null;
      let maTruong = null;
      let maHocSinh = null;
      let isGVBoMon = false;
      let isGVChuNhiem = false;

      const namHocHienTai = '2025-2026';

      // So sánh bằng key đã chuẩn hóa
      switch (loaiKey) {
        case 'hocsinh':
          const [hs] = await db.execute(
            `SELECT hs.TenHocSinh AS hoTen, hs.MaLop, l.TenLop
             FROM HocSinh hs
             LEFT JOIN Lop l ON hs.MaLop = l.MaLop
             WHERE hs.MaHocSinh = ?`,
            [entityId]
          );
          if (hs.length > 0) {
            hoTen = hs[0].hoTen;
            maLop = hs[0].MaLop;
            tenLop = hs[0].TenLop;
            // maTruong = hs[0].MaTruong;
            maHocSinh = entityId;
          }
          break;

        case 'giaovien':
          const [gv] = await db.execute(
            `SELECT gv.TenGiaoVien AS hoTen, gvcn.MaLop, l.TenLop
             FROM GiaoVien gv
             LEFT JOIN GVChuNhiem gvcn ON gv.MaGiaoVien = gvcn.MaGVCN AND gvcn.NamHoc = ?
             LEFT JOIN Lop l ON gvcn.MaLop = l.MaLop
             WHERE gv.MaGiaoVien = ?`,
            [namHocHienTai, entityId]
          );
          if (gv.length > 0) {
            hoTen = gv[0].hoTen;
            maLop = gv[0].MaLop || null;
            tenLop = gv[0].TenLop || null;
            // maTruong = gv[0].MaTruong;
          }

          const [bm] = await db.execute('SELECT 1 FROM GVBoMon WHERE MaGVBM = ? LIMIT 1', [entityId]);
          const [cn] = await db.execute('SELECT 1 FROM GVChuNhiem WHERE MaGVCN = ? LIMIT 1', [entityId]);
          isGVBoMon = bm.length > 0;
          isGVChuNhiem = cn.length > 0;
          break;

        case 'thisinh':
          const [ts] = await db.execute(
            `SELECT HoTen AS hoTen FROM ThiSinhDuThi WHERE MaThiSinh = ?`,
            [entityId]
          );
          if (ts.length > 0) {
            hoTen = ts[0].hoTen;
          }
          break;

        case 'hieutruong':
          const [ht] = await db.execute(
            'SELECT TenHieuTruong AS hoTen, MaTruong FROM HieuTruong WHERE MaHieuTruong = ?',
            [entityId]
          );
          if (ht.length > 0) {
            hoTen = ht[0].hoTen;
            maTruong = ht[0].MaTruong;
          }
          break;

        case 'giaovu':
          const [gvu] = await db.execute(
            'SELECT TenGiaoVu AS hoTen, MaTruong FROM GiaoVu WHERE MaGiaoVu = ?',
            [entityId]
          );
          if (gvu.length > 0) {
            hoTen = gvu[0].hoTen;
            maTruong = gvu[0].MaTruong;
          }
          break;

        case 'phuhuynh':
          const [ph] = await db.execute(
            `SELECT ph.HoTen AS hoTenPhuHuynh, hs.TenHocSinh, hs.MaLop, l.TenLop
             FROM PhuHuynh ph
             JOIN HocSinh hs ON ph.MaHocSinh = hs.MaHocSinh
             LEFT JOIN Lop l ON hs.MaLop = l.MaLop
             WHERE ph.SDT = ?`,
            [entityId]
          );
          if (ph.length > 0) {
            hoTen = `${ph[0].hoTenPhuHuynh} (PH của ${ph[0].TenHocSinh})`;
            maLop = ph[0].MaLop;
            tenLop = ph[0].TenLop;
            maHocSinh = ph[0].MaHocSinh;
          }
          break;

        default:
          hoTen = entityId;
      }

      // Lưu vào session
      req.session.user = {
        username: entityId,
        role,
        loaiTaiKhoan: loaiTaiKhoanRaw,
        entityId,
        hoTen,
        tenLop,
        MaLop: maLop,
        maHocSinh,
        maTruong,
        isAuthenticated: true,
        isGVBoMon,
        isGVChuNhiem
      };

      // Session phụ (giữ nguyên)
      switch (loaiTaiKhoanRaw) {
        case 'GiaoVu':
        case 'Giáo vụ':
          req.session.MaGiaoVu = entityId;
          break;
        case 'GiaoVien':
        case 'Giáo viên':
          req.session.MaGiaoVien = entityId;
          break;
        case 'HieuTruong':
        case 'Hiệu trưởng':
          req.session.MaHieuTruong = entityId;
          break;
        case 'HocSinh':
        case 'Học sinh':
          req.session.MaHocSinh = entityId;
          break;
        case 'PhuHuynh':
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
      return res.json({ success: false, message: 'Lỗi server, thử lại sau' });
    }
  }

  logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        console.error('❌ Lỗi destroy session:', err);
        return res.json({ success: false, message: 'Không thể đăng xuất' });
      }
      res.redirect('/');
    });
  }
}

module.exports = new DangNhapController();