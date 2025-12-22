// controllers/QuanLyTruongController.js
const Model = require('../models/QuanLyTruongModels');
const db = require('../config/database'); // Để sinh mã HT và tính thâm niên

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

  // ==================== THÊM TRƯỜNG ====================
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
      console.error('Lỗi create trường:', err);
      res.status(500).json({ error: err.message || 'Lỗi server' });
    }
  }

  // ==================== SỬA TRƯỜNG ====================
  async update(req, res) {
    const { MaTruong } = req.params;
    const { TenTruong, DiaChi, Email, SDT, TrangThai } = req.body;

    try {
      if (Email) {
        const emailExists = await Model.isEmailExists(Email, MaTruong);
        if (emailExists) return res.status(400).json({ error: 'Email đã được sử dụng.' });
      }

      await Model.update(MaTruong, req.body);
      res.json({ message: 'Cập nhật trường thành công!' });
    } catch (err) {
      console.error('Lỗi update trường:', err);
      res.status(500).json({ error: err.message || 'Lỗi server' });
    }
  }

  // ==================== XÓA TRƯỜNG ====================
  async delete(req, res) {
    try {
      await Model.delete(req.params.MaTruong);
      res.json({ message: 'Xóa trường thành công!' });
    } catch (err) {
      console.error('Lỗi delete trường:', err);
      res.status(500).json({ error: err.message || 'Lỗi server' });
    }
  }

  // ==================== LẤY THÔNG TIN HIỆU TRƯỞNG ĐỂ SỬA (QUAN TRỌNG - ĐÃ THÊM LẠI) ====================
  async getHieuTruong(req, res) {
    const { MaTruong } = req.params;
    try {
      const hieuTruong = await Model.getHieuTruongByMaTruong(MaTruong);
      if (!hieuTruong) {
        return res.status(404).json({ message: 'Chưa có hiệu trưởng' });
      }
      res.json(hieuTruong); // Trả về đầy đủ tất cả trường
    } catch (err) {
      console.error('Lỗi getHieuTruong:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }

  // ==================== THÊM HOẶC CẬP NHẬT HIỆU TRƯỞNG ====================
  async upsertHieuTruong(req, res) {
    const { MaTruong } = req.params;
    const data = req.body;

    console.log('Data nhận được từ frontend:', data); // Debug - có thể xóa sau

    // Validate bắt buộc
    if (!data.TenHieuTruong || data.TenHieuTruong.trim() === '') {
      return res.status(400).json({ error: 'Tên hiệu trưởng là bắt buộc.' });
    }
    if (!data.GioiTinh) {
      return res.status(400).json({ error: 'Giới tính là bắt buộc.' });
    }
    if (!data.NgayNhanChuc) {
      return res.status(400).json({ error: 'Ngày nhận chức là bắt buộc.' });
    }

    try {
      // TỰ ĐỘNG TÍNH THÂM NIÊN (số năm công tác)
      const ngayNhanChuc = new Date(data.NgayNhanChuc);
      const today = new Date(); // Ngày hiện tại
      let thoiGianCongTac = today.getFullYear() - ngayNhanChuc.getFullYear();

      const monthDiff = today.getMonth() - ngayNhanChuc.getMonth();
      const dayDiff = today.getDate() - ngayNhanChuc.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        thoiGianCongTac--;
      }
      data.ThoiGianCongTac = thoiGianCongTac >= 0 ? thoiGianCongTac : 0;

      // Kiểm tra email trùng (nếu có nhập)
      if (data.Email && data.Email.trim()) {
        const emailExists = await Model.isEmailHieuTruongExists(data.Email.trim(), MaTruong);
        if (emailExists) {
          return res.status(400).json({ error: 'Email này đã được sử dụng cho hiệu trưởng khác.' });
        }
      }

      // Sinh mã hiệu trưởng tự động HT001, HT002...
      if (!data.MaHieuTruong) {
        const [rows] = await db.execute(`SELECT COUNT(*) AS count FROM HieuTruong`);
        const count = rows[0].count;
        data.MaHieuTruong = `HT${String(count + 1).padStart(3, '0')}`;
      }

      data.MaTruong = MaTruong;

      const existing = await Model.getHieuTruongByMaTruong(MaTruong);

      if (existing) {
        await Model.updateHieuTruong(MaTruong, data);
        res.json({ message: 'Cập nhật thông tin hiệu trưởng thành công!' });
      } else {
        await Model.createHieuTruong(data);
        res.json({ message: 'Thêm hiệu trưởng thành công!' });
      }
    } catch (err) {
      console.error('Lỗi khi lưu hiệu trưởng:', err);
      res.status(500).json({ error: err.message || 'Lỗi server khi lưu hiệu trưởng' });
    }
  }

  // ==================== XÓA HIỆU TRƯỞNG (TÙY CHỌN) ====================
  async deleteHieuTruong(req, res) {
    const { MaTruong } = req.params;
    try {
      const result = await Model.deleteHieuTruong(MaTruong);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Không tìm thấy hiệu trưởng để xóa.' });
      }
      res.json({ message: 'Xóa hiệu trưởng thành công!' });
    } catch (err) {
      console.error('Lỗi deleteHieuTruong:', err);
      res.status(500).json({ error: 'Lỗi server' });
    }
  }

  // ==================== RENDER TRANG ====================
  async renderPage(req, res) {
    res.render('pages/quanlytruong');
  }
}

module.exports = new QuanLyTruongController();