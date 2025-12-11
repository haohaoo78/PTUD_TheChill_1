const TaiKhoanModel = require('../models/TaiKhoanModel');

const TaiKhoanController = {
  async renderPage(req, res) {
    try {
      const accounts = await TaiKhoanModel.getAll();
      res.render('pages/taotk', { accounts });
    } catch (err) {
      console.error(err);
      res.status(500).send("Lỗi server");
    }
  },

  async getList(req, res) {
    try {
      const { search = '', loai = '', trangthai = '' } = req.query;
      const accounts = await TaiKhoanModel.getList({ search, loai, trangthai });
      res.json({ success: true, accounts });
    } catch (err) {
      console.error('Lỗi getList:', err);
      res.json({ success: false, message: 'Lỗi tải dữ liệu' });
    }
  },

  async getOne(req, res) {
    try {
      const { ma } = req.query;
      const account = await TaiKhoanModel.getOne(ma);
      if (!account) return res.json({ success: false, message: 'Không tìm thấy tài khoản' });
      res.json({ success: true, account });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { ma, loaiTK, password } = req.body;
      if (!ma || !loaiTK || !password)
        return res.json({ success: false, message: 'Thiếu dữ liệu' });

      if (await TaiKhoanModel.isExists(ma))
        return res.json({ success: false, message: 'Tài khoản đã tồn tại' });

      await TaiKhoanModel.create(ma, password, loaiTK, 1);
      res.json({ success: true, message: 'Tạo tài khoản thành công' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { ma, loaiTK, password, trangThai } = req.body;
      if (!ma) return res.json({ success: false, message: 'Thiếu mã tài khoản' });

      const account = await TaiKhoanModel.getOne(ma);
      if (!account) return res.json({ success: false, message: 'Tài khoản không tồn tại' });

      const updateData = {};
      if (loaiTK) updateData.LoaiTaiKhoan = loaiTK;
      if (password && password.trim()) updateData.MatKhau = password;
      if (trangThai !== undefined) updateData.TrangThai = trangThai;

      await TaiKhoanModel.update(ma, updateData);
      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  async getLoaiTaiKhoan(req, res) {
    try {
      const [rows] = await db.execute(`
        SELECT DISTINCT LoaiTaiKhoan 
        FROM TaiKhoan 
        WHERE LoaiTaiKhoan IS NOT NULL 
        ORDER BY LoaiTaiKhoan
      `);
      const loaiList = rows.map(r => r.LoaiTaiKhoan);
      res.json({ success: true, loaiList });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi server' });
    }
  },

  async delete(req, res) {
    try {
      const { ma } = req.body;
      if (!ma) return res.json({ success: false, message: 'Thiếu mã tài khoản' });

      const account = await TaiKhoanModel.getOne(ma);
      if (!account) return res.json({ success: false, message: 'Tài khoản không tồn tại' });

      await TaiKhoanModel.delete(ma);
      res.json({ success: true, message: 'Xóa tài khoản thành công' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }
};

module.exports = TaiKhoanController;
