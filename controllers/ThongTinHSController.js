const ThongTinHSModel = require('../models/ThongTinHSModel');

const ThongTinHSController = {

  renderPage: (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('Unauthorized');

    res.render('pages/thongtinhs', { user });
  },

  getInfo: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ success: false });
      }

      // ✅ PHỤ HUYNH: dùng maHocSinh
      // ✅ HỌC SINH: entityId chính là MaHocSinh
      const maHocSinh =
        user.loaiTaiKhoan === 'Phụ huynh'
          ? user.maHocSinh
          : user.entityId;

      if (!maHocSinh) {
        return res.json({ success: false, message: 'Không tìm thấy mã học sinh' });
      }

      const info = await ThongTinHSModel.getInfo(maHocSinh);
      res.json({ success: true, info });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },

  updateInfo: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ success: false });
      }

      // ✅ chỉ phụ huynh được sửa
      if (user.loaiTaiKhoan !== 'PhuHuynh' && user.loaiTaiKhoan !== 'Phụ huynh') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ phụ huynh mới được chỉnh sửa thông tin'
        });
      }

      if (!user.maHocSinh) {
        return res.json({
          success: false,
          message: 'Không xác định được học sinh'
        });
      }

      await ThongTinHSModel.updateInfo(user.maHocSinh, req.body);

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công!'
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật'
      });
    }
  }
};

module.exports = ThongTinHSController;
