// controllers/DangKyTuyenSinhController.js
const DangKyTuyenSinhModel = require('../models/DangKyTuyenSinhModel');
const db = require('../config/database');

const DangKyTuyenSinhController = {

  // ===============================
  // RENDER PAGE
  // ===============================
  renderPage: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Thí sinh') {
      return res.status(403).send('Access denied');
    }

    const maThiSinh = req.session.user.username;

    try {
      const thiSinh = await DangKyTuyenSinhModel.getThiSinh(maThiSinh);
      const nguyenVong = await DangKyTuyenSinhModel.getNguyenVong(maThiSinh);
      const truongList = await DangKyTuyenSinhModel.getDanhSachTruong();
      const toHopList = await DangKyTuyenSinhModel.getDanhSachToHop();

      res.render('pages/dangkytuyensinh', {
        title: 'Đăng ký nguyện vọng',
        page: 'dangkytuyensinh',
        user: req.session.user,
        thiSinh,
        nguyenVong,
        truongList,
        toHopList,
        namThi: thiSinh?.NamThi || '2025',
        success: req.query.success === '1' ? 'Lưu nguyện vọng thành công!' : null,
        error: null
      });

    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },

  // ===============================
  // API LẤY TRƯỜNG + TỔ HỢP
  // ===============================
  getData: async (req, res) => {
    try {
      const truong = await DangKyTuyenSinhModel.getDanhSachTruong();
      const toHop = await DangKyTuyenSinhModel.getDanhSachToHop();
      res.json({ truong, toHop });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // LƯU NGUYỆN VỌNG
  // ===============================
  luuNguyenVong: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Thí sinh') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const maThiSinh = req.session.user.username;
    const { nguyenVong } = req.body;

    if (!nguyenVong || !Array.isArray(nguyenVong)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
    }

    try {
      const existing = await DangKyTuyenSinhModel.getNguyenVong(maThiSinh);

      // ⭐ QUAN TRỌNG: kiểm tra trùng trước khi thêm
      for (let nv of nguyenVong) {
        if (existing.some(x => x.MaTruong === nv.MaTruong && x.ToHopMon === nv.ToHopMon)) {
          return res.json({ success: false, message: 'Nguyện vọng đã tồn tại!' });
        }
      }

      // Giới hạn 3 NV
      if (existing.length + nguyenVong.length > 3) {
        return res.json({
          success: false,
          message: 'Chỉ được tối đa 3 nguyện vọng!'
        });
      }

      let thuTu = existing.length + 1;

      for (let nv of nguyenVong) {
        const maNV = await DangKyTuyenSinhModel.getNextMaNguyenVong();
        await DangKyTuyenSinhModel.themNguyenVong(maNV, maThiSinh, nv.MaTruong, thuTu, nv.ToHopMon);
        thuTu++;
      }

      res.json({ success: true, message: 'Lưu thành công!' });

    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // ===============================
  // HỦY NGUYỆN VỌNG + TỰ XẾP LẠI
  // ===============================
  huyNguyenVong: async (req, res) => {
    const maThiSinh = req.session.user?.username;
    const { maNguyenVong } = req.body;

    if (!maThiSinh) return res.status(403).json({ success: false, message: 'Không có quyền' });
    if (!maNguyenVong) return res.json({ success: false, message: 'Thiếu mã nguyện vọng' });

    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      await conn.query(`DELETE FROM NguyenVong WHERE MaThiSinh=? AND MaNguyenVong=?`, [maThiSinh, maNguyenVong]);

      // ⭐ Sắp xếp lại thứ tự từ 1
      const [rows] = await conn.query(
        `SELECT MaNguyenVong FROM NguyenVong WHERE MaThiSinh=? ORDER BY ThuTuNguyenVong ASC`,
        [maThiSinh]
      );

      let index = 1;
      for (let r of rows) {
        await conn.query(
          `UPDATE NguyenVong SET ThuTuNguyenVong=? WHERE MaNguyenVong=?`,
          [index, r.MaNguyenVong]
        );
        index++;
      }

      await conn.commit();
      res.json({ success: true, message: 'Đã hủy và cập nhật thứ tự!' });

    } catch (err) {
      if (conn) await conn.rollback();
      res.status(500).json({ success: false, message: 'Lỗi server' });
    } finally {
      if (conn) conn.release();
    }
  },

  // ===============================
  // THÔNG TIN PHÒNG THI
  // ===============================
  getThongTinPhongThi: async (req, res) => {
    const maThiSinh = req.session.user?.username;

    if (!maThiSinh) return res.status(403).json({ success: false, message: 'Không có quyền' });

    try {
      const info = await DangKyTuyenSinhModel.getThongTinPhongThi(maThiSinh);
      if (!info) return res.json({ success: false, message: 'Không có phòng thi' });
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

module.exports = DangKyTuyenSinhController;
