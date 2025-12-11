// controllers/QuanLyTruongController.js
const Model = require('../models/QuanLyTruongModels');

class QuanLyTruongController {

  // ==================== LẤY DANH SÁCH + LỌC ====================
  async getAll(req, res) {
    try {
      const { MaTruong, TenTruong, TrangThai } = req.query;

      const truongs = await Model.getAll({
        MaTruong,
        TenTruong,
        TrangThai,
      });

      res.json(truongs || []);
    } catch (err) {
      console.error('Lỗi getAll:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }

  // ==================== THÊM ====================
  async create(req, res) {
    const { MaTruong, TenTruong, DiaChi, Email, SDT } = req.body;
    if (!MaTruong || !TenTruong || !DiaChi || !Email || !SDT) {
      return res.status(400).json({ error: 'Thông tin không được để trống.' });
    }

    try {
      const exists = await Model.isMaTruongExists(MaTruong);
      if (exists) return res.status(400).json({ error: 'Mã trường đã tồn tại.' });

      const emailExists = await Model.isEmailExists(Email);
      if (emailExists) return res.status(400).json({ error: 'Email đã được sử dụng.' });

      await Model.create(req.body);
      res.json({ message: 'Thêm trường thành công!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // ==================== SỬA ====================
  async update(req, res) {
    const { MaTruong } = req.params;
    const { TenTruong, DiaChi, Email, SDT, TrangThai } = req.body;

    try {
      const emailExists = await Model.isEmailExists(Email, MaTruong);
      if (emailExists) return res.status(400).json({ error: 'Email đã được sử dụng.' });

      await Model.update(MaTruong, req.body);
      res.json({ message: 'Cập nhật thành công!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // ==================== XÓA ====================
  async delete(req, res) {
    try {
      await Model.delete(req.params.MaTruong);
      res.json({ message: 'Xóa thành công!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async renderPage(req, res) {
    res.render('pages/quanlytruong');
  }
}

module.exports = new QuanLyTruongController();
