const DangKyTuyenSinhModel = require('../models/DangKyTuyenSinhModel');

module.exports = {
  renderPage: async (req, res) => {
    try {
      const username = req.session.user?.username;
      if(!username) return res.redirect('/login');

      const thiSinh = await DangKyTuyenSinhModel.getThiSinh(username);
      const nguyenVong = await DangKyTuyenSinhModel.getNguyenVong(username);
      const truongList = await DangKyTuyenSinhModel.getDanhSachTruong();
      const toHopList = await DangKyTuyenSinhModel.getDanhSachToHop();

      res.render('pages/dangkytuyensinh', {
        thiSinh, nguyenVong, truongList, toHopList, namThi: thiSinh?.NamThi || '2025', success: null
      });
    } catch(err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  },

  saveNguyenVong: async (req, res) => {
    try {
      const username = req.session.user?.username;
      const { nguyenVong } = req.body; // [{ MaTruong, ToHopMon }]
      if(!username || !nguyenVong) return res.status(400).json({ success:false, message:'Thiếu dữ liệu' });

      const insertedIds = await DangKyTuyenSinhModel.saveNguyenVong(username, nguyenVong);
      res.json({ success:true, maNguyenVong: insertedIds[0] || null, maNguyenVongList: insertedIds });
    } catch(err) {
      console.error(err);
      res.json({ success:false, message:'Lưu thất bại' });
    }
  },

  deleteNguyenVong: async (req, res) => {
    try {
      const username = req.session.user?.username;
      if(!username) return res.status(403).json({ success:false, message:'Unauthorized' });

      const { maNguyenVong } = req.body;
      if(!maNguyenVong) return res.status(400).json({ success:false, message:'Thiếu dữ liệu' });
      await DangKyTuyenSinhModel.deleteNguyenVong(maNguyenVong);
      res.json({ success:true });
    } catch(err) {
      console.error(err);
      res.json({ success:false, message:'Xóa thất bại' });
    }
  }
};
