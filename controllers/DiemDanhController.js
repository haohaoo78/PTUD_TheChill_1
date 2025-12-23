const DiemDanhModel = require('../models/DiemDanhModel');

class DiemDanhController {
  renderPage(req, res) {
    res.render('pages/diemdanh', {
      classList: [],
      students: [],
      selectedClass: null
    });
  }

  // API: lấy danh sách lớp có lịch dạy trong ngày của giáo viên
  async getClassesToday(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const hk = await DiemDanhModel.getCurrentNamHocKyHoc();
      if (!hk?.NamHoc || !hk?.KyHoc) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy năm học/học kỳ đang học' });
      }

      // Lưu vào session để dùng các bước sau
      req.session.ddNamHoc = hk.NamHoc;
      req.session.ddKyHoc = hk.KyHoc;

      const todayISO = new Date().toISOString().slice(0, 10);
      const classList = await DiemDanhModel.getClassesToday(maGV, hk.NamHoc, todayISO, hk.KyHoc);

      res.json({ success: true, namHoc: hk.NamHoc, hocKy: hk.KyHoc, ngay: todayISO, classList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy lớp dạy hôm nay' });
    }
  }

  // API: danh sách học sinh theo lớp
  async getStudents(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { maLop, ngay, tietHoc, tenMonHoc } = req.query;
      if (!maLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });

      const namHoc = req.session?.ddNamHoc || (await DiemDanhModel.getCurrentNamHoc());
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const students = await DiemDanhModel.getStudentsByClass(maLop, namHoc, ngay, tietHoc, tenMonHoc);
      res.json({ success: true, students, maLop, namHoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy học sinh' });
    }
  }

  // API: lưu điểm danh
  async saveAttendance(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { maLop, tenMonHoc, tietHoc, ngay, records = [] } = req.body;
      if (!maLop || !tenMonHoc || !tietHoc || !ngay || !Array.isArray(records) || !records.length) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu điểm danh' });
      }
      // dùng ngày gửi lên (đã lấy từ classes-today)
      await DiemDanhModel.saveAttendance({ maLop, tenMonHoc, ngayISO: ngay, tietHoc, records });
      res.json({ success: true, message: 'Lưu điểm danh thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lưu điểm danh' });
    }
  }

  // API: hủy điểm danh (xóa trạng thái)
  async deleteAttendance(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { ngay, tietHoc, maHSList = [] } = req.body;
      if (!ngay || !tietHoc || !Array.isArray(maHSList) || !maHSList.length) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
      }
      await DiemDanhModel.deleteAttendance({ ngayISO: ngay, tietHoc, maHocSinhList: maHSList });
      res.json({ success: true, message: 'Đã hủy điểm danh' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi hủy điểm danh' });
    }
  }
}

module.exports = new DiemDanhController();
