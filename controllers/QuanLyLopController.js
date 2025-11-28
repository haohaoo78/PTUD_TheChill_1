const QuanLyLopModel = require('../models/QuanLyLopModel');

class QuanLyLopController {
  async renderPage(req, res) {
    try {
      const khoiList = await QuanLyLopModel.getKhoiList();
      const defaultKhoi = khoiList[0]?.MaKhoi || '';
      const classes = defaultKhoi ? await QuanLyLopModel.getClassesByKhoi(defaultKhoi) : [];
      res.render('pages/quanlylop', { khoiList, classes, selectedKhoi: defaultKhoi });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang quản lý lớp');
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      if (!MaKhoi) return res.json({ success: true, classes: [] });
      const classes = await QuanLyLopModel.getClassesByKhoi(MaKhoi);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp' });
    }
  }

  async createClasses(req, res) {
    try {
      const { MaKhoi, number } = req.body;
      if (!MaKhoi) return res.status(400).json({ success: false, message: 'Vui lòng chọn khối' });
      if (!number || isNaN(number) || number <= 0) return res.status(400).json({ success: false, message: 'Vui lòng nhập số lượng lớp' });
      await QuanLyLopModel.createClasses(MaKhoi, parseInt(number, 10));
      res.json({ success: true, message: 'Tạo lớp thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo lớp' });
    }
  }

  async updateClass(req, res) {
    try {
      const { MaLop, TenLop, Khoi, TrangThai, SiSo } = req.body;
      if (!MaLop) return res.status(400).json({ success: false, message: 'Thiếu Mã lớp' });
      // validate TenLop
      if (TenLop) {
        if (!/^[a-zA-ZÀ-ỹ0-9\s]+$/.test(TenLop)) return res.status(400).json({ success: false, message: 'Tên lớp không hợp lệ' });
        // check duplicate excluding this MaLop
        const [rows] = await require('../config/database').execute('SELECT COUNT(*) AS cnt FROM Lop WHERE TenLop = ? AND MaLop <> ?', [TenLop, MaLop]);
        if (rows[0].cnt > 0) return res.status(400).json({ success: false, message: 'Tên lớp đã tồn tại' });
      }
      const result = await QuanLyLopModel.updateClass(MaLop, { TenLop, Khoi, TrangThai, SiSo });
      // assign GVCN if provided
      if (req.body.MaGVCN) {
        await QuanLyLopModel.assignGVCN(MaLop, req.body.MaGVCN, req.body.NamHoc);
      }
      res.json({ success: true, message: 'Cập nhật lớp thành công', result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật lớp' });
    }
  }

  async deleteClass(req, res) {
    try {
      const { MaLop } = req.body;
      if (!MaLop) return res.status(400).json({ success: false, message: 'Thiếu Mã lớp' });
      const result = await QuanLyLopModel.deleteClass(MaLop);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi xóa lớp' });
    }
  }

  async getTeachers(req, res) {
    try {
      const rows = await QuanLyLopModel.getTeachers();
      res.json({ success: true, teachers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên' });
    }
  }
}

module.exports = new QuanLyLopController();