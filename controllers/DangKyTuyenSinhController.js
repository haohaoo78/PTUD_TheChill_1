// controllers/DangKyTuyenSinhController.js
const DangKyTuyenSinhModel = require('../models/DangKyTuyenSinhModel');
const db = require('../config/database.js');

const DangKyTuyenSinhController = {

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
      const namThi = thiSinh?.NamThi || '2025';

      res.render('pages/dangkytuyensinh', {
        title: 'Đăng ký nguyện vọng',
        page: 'dangkytuyensinh',
        user: req.session.user,
        thiSinh,
        nguyenVong,
        truongList,
        toHopList,
        namThi,
        success: req.query.success === '1' ? 'Lưu nguyện vọng thành công!' : null,
        error: null
      });

    } catch (err) {
      console.error('Lỗi render trang:', err);
      res.status(500).send('Lỗi server');
    }
  },

  getData: async (req, res) => {
    try {
      const truong = await DangKyTuyenSinhModel.getDanhSachTruong();
      const toHop = await DangKyTuyenSinhModel.getDanhSachToHop();
      res.json({ truong, toHop });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  luuNguyenVong: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Thí sinh') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const maThiSinh = req.session.user.username;
    const { nguyenVong } = req.body;

    if (!nguyenVong || !Array.isArray(nguyenVong) || nguyenVong.length === 0) {
      return res.status(400).json({ success: false, message: 'Chưa chọn nguyện vọng!' });
    }

    try {
      const nguyenVongCu = await DangKyTuyenSinhModel.getNguyenVong(maThiSinh);

      if (nguyenVongCu.length + nguyenVong.length > 3) {
        return res.status(400).json({ success: false, message: 'Mỗi thí sinh chỉ được tối đa 3 nguyện vọng!' });
      }

      let thuTu = nguyenVongCu.length + 1;

      for (let nv of nguyenVong) {
        const maNguyenVong = await DangKyTuyenSinhModel.getNextMaNguyenVong();
        await DangKyTuyenSinhModel.themNguyenVong(maNguyenVong, maThiSinh, nv.MaTruong, thuTu, nv.ToHopMon);

        if (thuTu === 1) {
          await DangKyTuyenSinhModel.capNhatKetQuaTuyenSinh(maThiSinh, maNguyenVong, nv.ToHopMon);
        }

        thuTu++;
      }

      res.json({ success: true, message: 'Đăng ký nguyện vọng thành công!' });

    } catch (err) {
      console.error('Lỗi lưu:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  huyNguyenVong: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Thí sinh') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const maThiSinh = req.session.user.username;
    const { maNguyenVong } = req.body;

    if (!maNguyenVong) {
      return res.status(400).json({ success: false, message: 'Chưa chọn nguyện vọng để xóa' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      await connection.query(
        `UPDATE KetQuaTuyenSinh SET NguyenVongTrungTuyen = NULL 
         WHERE MaThiSinh = ? AND NguyenVongTrungTuyen = ?`,
        [maThiSinh, maNguyenVong]
      );

      await connection.query(
        `DELETE FROM NguyenVong WHERE MaThiSinh = ? AND MaNguyenVong = ?`,
        [maThiSinh, maNguyenVong]
      );

      await connection.commit();
      res.json({ success: true, message: 'Nguyện vọng đã được hủy' });

    } catch (err) {
      if (connection) await connection.rollback();
      console.error('Lỗi hủy nguyện vọng:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    } finally {
      if (connection) connection.release();
    }
  },

  getThongTinPhongThi: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Thí sinh') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const maThiSinh = req.session.user.username;

    try {
      const info = await DangKyTuyenSinhModel.getThongTinPhongThi(maThiSinh);

      if (!info) {
        return res.json({ success: false, message: 'Không tìm thấy phòng thi' });
      }

      res.json({ success: true, data: info });

    } catch (err) {
      console.error('Lỗi phòng thi:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

module.exports = DangKyTuyenSinhController;
