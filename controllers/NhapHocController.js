// controllers/NhapHocController.js
const NhapHocModel = require('../models/NhapHocModel');

const NhapHocController = {
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/');

    if (user.loaiTaiKhoan !== 'Thí sinh') {
      return res.render('pages/nhaphoc', {
        user,
        error: 'Chức năng chỉ dành cho thí sinh',
        toHopList: []
      });
    }

    const toHopList = await NhapHocModel.getToHopMon();

    res.render('pages/nhaphoc', { user, error: null, toHopList });
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
      const { toHop } = req.body;  // Bây giờ là MaToHop

      const result = await NhapHocModel.confirm(maTS, toHop);

      res.json({
        success: true,
        message: `Bạn đã nhập học thành công!\n\n` +
                 `Mã học sinh (tên tài khoản): ${result.maHocSinh}\n` +
                 `Mật khẩu đăng nhập ban đầu: 123\n\n` +
                 `Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu!\n` +
                 `Bạn có thể đăng nhập bằng tài khoản học sinh để sử dụng hệ thống.`
      });
    } catch (err) {
      res.json({
        success: false,
        message: err.message || 'Có lỗi xảy ra khi xác nhận nhập học'
      });
    }
  }
};

module.exports = NhapHocController;