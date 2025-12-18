const NhanXetHocSinhModel = require('../models/NhanXetHocSinhModel');

class NhanXetHocSinhController {
  renderPage(req, res) {
    res.render('pages/nhanxethocsinh', {
      classList: [],
      students: [],
      selectedClass: null
    });
  }

  // API: danh sách lớp theo GV và năm học đang học
  async getClasses(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const classList = await NhanXetHocSinhModel.getClassesByTeacher(maGV, namHoc);
      res.json({ success: true, namHoc, classList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp' });
    }
  }

  // API: danh sách học sinh theo lớp
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
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy học sinh' });
    }
  }

  // API: cập nhật nhận xét
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
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật nhận xét' });
    }
  }

  // API: cập nhật nhận xét hàng loạt
  async updateCommentMultiple(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { maHSList = [], nhanXet = '' } = req.body;
      if (!Array.isArray(maHSList) || maHSList.length === 0) {
        return res.status(400).json({ success: false, message: 'Thiếu danh sách mã học sinh' });
      }
      const namHoc = await NhanXetHocSinhModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      await NhanXetHocSinhModel.updateCommentMultiple(maHSList, namHoc, nhanXet);
      res.json({ success: true, message: 'Cập nhật nhận xét chung thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật nhận xét chung' });
    }
  }
}

module.exports = new NhanXetHocSinhController();
