const XemDiemModel = require('../models/XemDiemModel');

const XemDiemController = {
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/');
    }
    
    // Nếu là phụ huynh hoặc học sinh, lấy thông tin học sinh
    let studentInfo = null;
    if (user.LoaiTaiKhoan === 'Phụ huynh' || user.LoaiTaiKhoan === 'Học sinh') {
        // UserId trong session đã được map thành MaHocSinh ở DangNhapModel (cho cả PH và HS)
        // Tuy nhiên, cần kiểm tra lại logic DangNhapController lưu session như thế nào.
        // DangNhapController lưu: req.session.user = { username, role, isAuthenticated, LoaiTaiKhoan }
        // Nó KHÔNG lưu UserId vào session.user. Tôi cần sửa DangNhapController để lưu UserId.
        
        // Tạm thời tôi sẽ giả định DangNhapController ĐÃ ĐƯỢC SỬA để lưu UserId vào session.
        // Tôi sẽ sửa DangNhapController ngay sau bước này.
    }

    res.render('pages/xemdiem', { user });
  },

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

      // Lấy MaHS từ session (cần sửa DangNhapController để lưu UserId vào session)
      // Tạm thời lấy từ user.username nếu là HocSinh, hoặc logic khác.
      // Nhưng tốt nhất là lấy từ UserId đã map.
      
      // Giả sử tôi sẽ thêm userId vào session
      const maHS = user.userId; 

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
