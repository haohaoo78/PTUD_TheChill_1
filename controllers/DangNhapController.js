// controllers/DangNhapController.js
const TaiKhoan = require('../models/DangNhapModel');
const db = require('../config/database');

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
    res.render('pages/dangnhap', { title: 'Đăng nhập hệ thống', user: null });
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });

      const user = await TaiKhoan.login(username, password);
      if (!user) return res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });

      const loaiTaiKhoan = user.LoaiTaiKhoan.trim(); 
      const role = roleMap[loaiTaiKhoan] || loaiTaiKhoan;
      const entityId = user.TenTaiKhoan.trim();

      let maTruong = null, maHocSinh = null, maLop = null, hoTen = entityId, tenLop = null;
      let isGVBoMon = false, isGVChuNhiem = false;

      // ===== Học sinh
      if (loaiTaiKhoan === 'Học sinh') {
        const [rows] = await db.execute(
          `SELECT hs.TenHocSinh AS hoTen, hs.MaLop, l.TenLop
           FROM HocSinh hs
           LEFT JOIN Lop l ON hs.MaLop = l.MaLop
           WHERE hs.MaHocSinh = ?`,
          [entityId]
        );
        if (rows.length) {
          hoTen = rows[0].hoTen;
          maLop = rows[0].MaLop;
          tenLop = rows[0].TenLop;
          maHocSinh = entityId;
        }
      }

      // ===== Giáo viên
      if (loaiTaiKhoan === 'Giáo viên') {
        const [gv] = await db.execute(
          `SELECT gv.TenGiaoVien AS hoTen, gvcn.MaLop, l.TenLop
           FROM GiaoVien gv
           LEFT JOIN GVChuNhiem gvcn ON gv.MaGiaoVien = gvcn.MaGVCN
           LEFT JOIN Lop l ON gvcn.MaLop = l.MaLop
           WHERE gv.MaGiaoVien = ?`,
          [entityId]
        );
        if (gv.length) {
          hoTen = gv[0].hoTen;
          maLop = gv[0].MaLop || null;
          tenLop = gv[0].TenLop || null;
        }
        const [bm] = await db.execute('SELECT 1 FROM GVBoMon WHERE MaGVBM = ? LIMIT 1', [entityId]);
        const [cn] = await db.execute('SELECT 1 FROM GVChuNhiem WHERE MaGVCN = ? LIMIT 1', [entityId]);
        isGVBoMon = bm.length > 0;
        isGVChuNhiem = cn.length > 0;
      }

      // ===== Phụ huynh
      if (loaiTaiKhoan === 'Phụ huynh') {
        const [ph] = await db.execute(
          `SELECT ph.HoTen AS hoTenPhuHuynh, hs.TenHocSinh, hs.MaHocSinh, hs.MaLop, l.TenLop
           FROM PhuHuynh ph
           JOIN HocSinh hs ON ph.MaHocSinh = hs.MaHocSinh
           LEFT JOIN Lop l ON hs.MaLop = l.MaLop
           WHERE ph.SDT = ?`,
          [entityId]
        );
        if (ph.length) {
          hoTen = `${ph[0].hoTenPhuHuynh} (PH của ${ph[0].TenHocSinh})`;
          maLop = ph[0].MaLop;
          tenLop = ph[0].TenLop;
          maHocSinh = ph[0].MaHocSinh; // ✅ chắc chắn lấy từ hs
        }
      }

      // ===== Hiệu trưởng
      if (loaiTaiKhoan === 'Hiệu trưởng') {
        const [ht] = await db.execute(
          'SELECT TenHieuTruong AS hoTen, MaTruong FROM HieuTruong WHERE MaHieuTruong = ?',
          [entityId]
        );
        if (ht.length) {
          hoTen = ht[0].hoTen;
          maTruong = ht[0].MaTruong;
        }
      }

      // ===== Giáo vụ
      if (loaiTaiKhoan === 'Giáo vụ') {
        const [gvu] = await db.execute(
          'SELECT TenGiaoVu AS hoTen, MaTruong FROM GiaoVu WHERE MaGiaoVu = ?',
          [entityId]
        );
        if (gvu.length) {
          hoTen = gvu[0].hoTen;
          maTruong = gvu[0].MaTruong;
        }
      }

      // ===== Session chính
      req.session.user = {
        username: entityId,
        role,
        loaiTaiKhoan,
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

      // ===== Session phụ
      switch (loaiTaiKhoan) {
        case 'GiaoVu': req.session.MaGiaoVu = entityId; break;
        case 'Giáo viên': case 'GiaoVien': req.session.MaGiaoVien = entityId; break;
        case 'Hiệu trưởng': case 'HieuTruong': req.session.MaHieuTruong = entityId; break;
        case 'Học sinh': case 'HocSinh': req.session.MaHocSinh = entityId; break;
        case 'Phụ huynh': case 'PhuHuynh': req.session.SDTPhuHuynh = entityId; break;
      }

      console.log('✅ Đăng nhập thành công:', req.session.user);
      return res.json({ success: true, message: 'Đăng nhập thành công', redirect: '/' });

    } catch (err) {
      console.error('💥 Lỗi đăng nhập:', err);
      return res.json({ success: false, message: 'Lỗi server, thử lại sau' });
    }
  }

  logout(req, res) {
    req.session.destroy(err => {
      if (err) return res.json({ success: false, message: 'Không thể đăng xuất' });
      res.redirect('/');
    });
  }
}

module.exports = new DangNhapController();
