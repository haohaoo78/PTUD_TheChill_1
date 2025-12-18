const NhapHocModel = require('../models/NhapHocModel');

const NhapHocController = {

  renderPage: (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/');

    if (user.LoaiTaiKhoan !== 'Thí sinh') {
      return res.render('pages/nhaphoc', {
        user,
        error: 'Chức năng chỉ dành cho thí sinh'
      });
    }

    res.render('pages/nhaphoc', { user, error: null });
  },

  getStatus: async (req, res) => {
    try {
      const maTS = req.session.user.username;
      const status = await NhapHocModel.getStatus(maTS);
      res.json({ success: true, status });
    } catch {
      res.json({ success: false });
    }
  },

  confirm: async (req, res) => {
    try {
      const maTS = req.session.user.username;
      const { khoiHoc } = req.body;

      await NhapHocModel.confirm(maTS, khoiHoc);

      res.json({
        success: true,
        message: 'Xác nhận nhập học thành công'
      });

    } catch (err) {
      res.json({
        success: false,
        message: err.message
      });
    }
  }
};

module.exports = NhapHocController;
