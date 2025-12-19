// controllers/QuanLyLopController.js
const QuanLyLopModel = require('../models/QuanLyLopModel');

class QuanLyLopController {
  async renderPage(req, res) {
    try {
      const maTruong = req.session.user?.maTruong || null;
      const khoiList = await QuanLyLopModel.getKhoiList(maTruong);
      const defaultKhoi = khoiList[0]?.MaKhoi || null;

      let classes = [];
      if (defaultKhoi) {
        classes = await QuanLyLopModel.getClassesByKhoi(defaultKhoi, maTruong);
      }

      res.render('pages/quanlylop', { 
        khoiList, 
        classes, 
        selectedKhoi: defaultKhoi || '' 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang quản lý lớp');
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const maTruong = req.session.user?.maTruong || null;

      if (!MaKhoi || !maTruong) {
        return res.json({ success: true, classes: [] });
      }

      const classes = await QuanLyLopModel.getClassesByKhoi(MaKhoi, maTruong);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp' });
    }
  }

  async createClasses(req, res) {
    try {
      const { MaKhoi, number } = req.body;
      const maTruong = req.session.user?.maTruong;

      if (!maTruong) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập trường' });
      }

      if (!MaKhoi) return res.status(400).json({ success: false, message: 'Vui lòng chọn khối' });
      if (!number || isNaN(number) || number <= 0) return res.status(400).json({ success: false, message: 'Vui lòng nhập số lượng lớp hợp lệ' });

      await QuanLyLopModel.createClasses(MaKhoi, parseInt(number, 10), maTruong);
      res.json({ success: true, message: 'Tạo lớp thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo lớp: ' + (err.message || 'Unknown error') });
    }
  }

  // controllers/QuanLyLopController.js
// ... (giữ nguyên các hàm khác)

  async updateClass(req, res) {
    try {
      const { MaLop, TenLop, Khoi, TrangThai, SiSo, MaGVCN } = req.body;
      const maTruong = req.session.user?.maTruong;

      if (!maTruong) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      }

      if (!MaLop) return res.status(400).json({ success: false, message: 'Thiếu Mã lớp' });

      // Kiểm tra lớp có thuộc trường không
      const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
      if (lopRows.length === 0) {
        return res.status(403).json({ success: false, message: 'Lớp không thuộc trường của bạn' });
      }

      // Truyền thêm maTruong vào data để model dùng
      await QuanLyLopModel.updateClass(MaLop, { TenLop, Khoi, TrangThai, SiSo, maTruong });

      if (MaGVCN) {
        await QuanLyLopModel.assignGVCN(MaLop, MaGVCN, req.body.NamHoc || '2025-2026');
      }

      res.json({ success: true, message: 'Cập nhật lớp thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật lớp: ' + err.message });
    }
  }

// ... (giữ nguyên các hàm khác)
  async deleteClass(req, res) {
    try {
      const { MaLop } = req.body;
      const maTruong = req.session.user?.maTruong;

      if (!maTruong) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      }

      if (!MaLop) return res.status(400).json({ success: false, message: 'Thiếu Mã lớp' });

      // Kiểm tra lớp thuộc trường
      const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
      if (lopRows.length === 0) {
        return res.status(403).json({ success: false, message: 'Lớp không thuộc trường của bạn' });
      }

      await QuanLyLopModel.deleteClass(MaLop);
      res.json({ success: true, message: 'Xóa lớp thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi xóa lớp: ' + err.message });
    }
  }

  async getTeachers(req, res) {
    try {
      const maTruong = req.session.user?.maTruong;
      if (!maTruong) {
        return res.json({ success: true, teachers: [] });
      }
      const rows = await QuanLyLopModel.getTeachers(maTruong);
      res.json({ success: true, teachers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên' });
    }
  }
}

module.exports = new QuanLyLopController();