const NhapHocModel = require('../models/NhapHocModel');

const NhapHocController = {
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/');
    // Chỉ học sinh mới được xác nhận nhập học
    if (user.LoaiTaiKhoan !== 'Học sinh') {
        return res.render('pages/nhaphoc', { user, error: 'Chức năng chỉ dành cho học sinh' });
    }
    res.render('pages/nhaphoc', { user, error: null });
  },

  getStatus: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user || user.LoaiTaiKhoan !== 'Học sinh') return res.status(401).json({ success: false });
      
      const status = await NhapHocModel.getStatus(user.userId);
      res.json({ success: true, status });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  },

  confirm: async (req, res) => {
    try {
      const user = req.session.user;
      const { khoiHoc } = req.body;
      
      if (!user || user.LoaiTaiKhoan !== 'Học sinh') return res.status(401).json({ success: false });
      if (!khoiHoc) return res.status(400).json({ success: false, message: 'Vui lòng chọn khối học' });

      await NhapHocModel.confirm(user.userId, khoiHoc);
      res.json({ success: true, message: 'Xác nhận nhập học thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi xác nhận' });
    }
  }
};

module.exports = NhapHocController;
