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
      if (!user) return res.status(401).json({ success: false });
      
      const info = await ThongTinHSModel.getInfo(user.userId);
      res.json({ success: true, info });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  },

  updateInfo: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false });

      // Chỉ phụ huynh mới được sửa (theo yêu cầu)
      if (user.LoaiTaiKhoan !== 'Phụ huynh') {
          return res.status(403).json({ success: false, message: 'Chỉ phụ huynh mới được chỉnh sửa thông tin' });
      }

      await ThongTinHSModel.updateInfo(user.userId, req.body);
      res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
  }
};

module.exports = ThongTinHSController;
