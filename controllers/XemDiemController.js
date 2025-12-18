const XemDiemModel = require('../models/XemDiemModel');

const XemDiemController = {
  // =========================
  // 📄 RENDER TRANG XEM ĐIỂM
  // =========================
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/');
    }

    let studentInfo = null;

    // Nếu là phụ huynh hoặc học sinh, lấy thông tin học sinh
    if (user.loaiTaiKhoan === 'Phụ huynh' || user.loaiTaiKhoan === 'Học sinh') {
      const maHS = user.maHocSinh; // lấy trực tiếp từ session
      if (maHS) {
        studentInfo = await XemDiemModel.getStudentInfo(maHS);
      }
    }

    res.render('pages/xemdiem', { user, studentInfo });
  },

  // =========================
  // 📥 LẤY ĐIỂM
  // =========================
  getScores: async (req, res) => {
    try {
      const { namHoc, hocKy } = req.body;
      const user = req.session.user;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      }

      if (!namHoc || !hocKy) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn học kỳ để xem điểm.' });
      }

      // Lấy MaHocSinh từ session
      const maHS = user.maHocSinh;
      if (!maHS) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin học sinh' });
      }

      const scores = await XemDiemModel.getScores(maHS, namHoc, hocKy);
      const summary = await XemDiemModel.getHanhKiemHocLuc(maHS, namHoc, hocKy);
      const student = await XemDiemModel.getStudentInfo(maHS);

      res.json({ success: true, scores, summary, student });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

module.exports = XemDiemController;
