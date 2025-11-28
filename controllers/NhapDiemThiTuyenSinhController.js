const NhapDiemThiTuyenSinhModel = require('../models/NhapDiemThiTuyenSinhModel');

const NhapDiemThiTuyenSinhController = {
  renderPage: async (req, res) => {
    res.render('pages/nhapdiemthituyensinh', {
      user: req.session.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  },

  getCandidates: async (req, res) => {
    const { nam_thi, ma_phong_thi } = req.query;
    if (!nam_thi || !ma_phong_thi) return res.json({ success: false, message: 'Chọn năm thi và phòng thi' });
    try {
      const data = await NhapDiemThiTuyenSinhModel.getCandidatesByRoom(nam_thi, ma_phong_thi);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message || 'Lỗi server' });
    }
  },

  saveScore: async (req, res) => {
    const { ma_thi_sinh, toan, van, anh, tu_chon, nam_thi, ma_phong_thi } = req.body;
    try {
      await NhapDiemThiTuyenSinhModel.saveOrUpdate({ ma_thi_sinh, toan, van, anh, tu_chon, nam_thi, ma_phong_thi });
      res.json({ success: true, message: 'Lưu điểm thành công!' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  deleteScore: async (req, res) => {
    const { maThiSinh } = req.params;
    try {
      const ok = await NhapDiemThiTuyenSinhModel.delete(maThiSinh);
      res.json({ success: ok, message: ok ? 'Xóa thành công' : 'Không tìm thấy' });
    } catch (err) {
      res.json({ success: false, message: 'Lỗi xóa' });
    }
  }
};

module.exports = NhapDiemThiTuyenSinhController;