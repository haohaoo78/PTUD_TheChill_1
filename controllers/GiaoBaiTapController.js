const GiaoBaiTapModel = require('../models/GiaoBaiTapModel');

class GiaoBaiTapController {
  async renderPage(req, res) {
    res.render('pages/giaobaitap', {
      classList: [],
      assignments: [],
      selectedClass: null
    });
  }

  // API: danh sách lớp theo GV và năm học đang học
  async getClasses(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const namHoc = await GiaoBaiTapModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const classList = await GiaoBaiTapModel.getClassesByTeacher(maGV, namHoc);
      res.json({ success: true, namHoc, classList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp' });
    }
  }

  // API: danh sách bài tập của lớp
  async getAssignments(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maLop } = req.query;
      if (!maLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });

      const assignments = await GiaoBaiTapModel.getAssignmentsByClass(maLop, maGV);
      res.json({ success: true, assignments, maLop });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy bài tập' });
    }
  }

  // API: thêm bài tập
  async createAssignment(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { NoiDung, NgayHetHan, MaLop } = req.body;
      const today = new Date().toISOString().split('T')[0];
      if (!NoiDung || !NgayHetHan || !MaLop) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu bắt buộc' });
      }
      if (NgayHetHan < today) {
        return res.status(400).json({ success: false, message: 'Hạn nộp không hợp lệ (trước ngày hiện tại)' });
      }
      const id = await GiaoBaiTapModel.createAssignment({
        NoiDung,
        NgayHetHan,
        MaLop,
        MaGiaoVien: maGV,
        NgayGiao: today
      });
      res.json({ success: true, message: 'Thêm bài tập thành công', maBaiTap: id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi thêm bài tập' });
    }
  }

  // API: sửa bài tập
  async updateAssignment(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { id } = req.params;
      const { NoiDung, NgayHetHan } = req.body;
      const today = new Date().toISOString().split('T')[0];
      if (!NoiDung || !NgayHetHan) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu bắt buộc' });
      }
      if (NgayHetHan < today) {
        return res.status(400).json({ success: false, message: 'Hạn nộp không hợp lệ (trước ngày hiện tại)' });
      }
      const existing = await GiaoBaiTapModel.getAssignmentById(id, maGV);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập hoặc không có quyền sửa' });
      }
      if (existing.NgayHetHan && existing.NgayHetHan < today) {
        return res.status(400).json({ success: false, message: 'Không thể sửa bài tập đã hết hạn' });
      }

      const ok = await GiaoBaiTapModel.updateAssignment(id, maGV, { NoiDung, NgayHetHan });
      if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy bài tập hoặc không có quyền sửa' });
      res.json({ success: true, message: 'Cập nhật bài tập thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật bài tập' });
    }
  }
}

module.exports = new GiaoBaiTapController();
