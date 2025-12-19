// controllers/NhanXetHocSinhController.js
const NhanXetHocSinhModel = require('../models/NhanXetHocSinhModel');

class NhanXetHocSinhController {
  async renderPage(req, res) {
    res.render('pages/nhanxet', {
      classList: [],
      students: [],
      selectedClass: null
    });
  }

  // API: Lấy danh sách lớp mà giáo viên đang dạy bộ môn (trong năm học đang học)
  async getClasses(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const classList = await NhanXetHocSinhModel.getClassesByTeacher(maGV, namHoc);
      res.json({ success: true, namHoc, classList });
    } catch (err) {
      console.error('Lỗi getClasses:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp' });
    }
  }

  // API: Lấy danh sách học sinh trong lớp + nhận xét hiện tại
  async getStudents(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maLop } = req.query;
      if (!maLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });

      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const students = await NhanXetHocSinhModel.getStudentsByClass(maLop, namHoc);
      res.json({ success: true, students, maLop, namHoc });
    } catch (err) {
      console.error('Lỗi getStudents:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách học sinh' });
    }
  }

  // API: Cập nhật nhận xét cho 1 học sinh
  async updateComment(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maHS, nhanXet } = req.body;
      if (!maHS) return res.status(400).json({ success: false, message: 'Thiếu mã học sinh' });

      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      await NhanXetHocSinhModel.updateComment(maHS, namHoc, nhanXet || '');
      res.json({ success: true, message: 'Cập nhật nhận xét thành công' });
    } catch (err) {
      console.error('Lỗi updateComment:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật nhận xét' });
    }
  }

  // API: Cập nhật nhận xét chung cho nhiều học sinh
  async updateCommentMultiple(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maHSList = [], nhanXet = '' } = req.body;
      if (!Array.isArray(maHSList) || maHSList.length === 0) {
        return res.status(400).json({ success: false, message: 'Thiếu danh sách học sinh' });
      }

      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      await NhanXetHocSinhModel.updateCommentMultiple(maHSList, namHoc, nhanXet);
      res.json({ success: true, message: `Cập nhật nhận xét chung thành công cho ${maHSList.length} học sinh` });
    } catch (err) {
      console.error('Lỗi updateCommentMultiple:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật nhận xét chung' });
    }
  }
}

module.exports = new NhanXetHocSinhController();