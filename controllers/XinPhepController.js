const XinPhepModel = require('../models/XinPhepModel');
const ThongTinHSModel = require('../models/ThongTinHSModel');

const XinPhepController = {
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('Unauthorized');
    
    let student = null;
    try {
        student = await ThongTinHSModel.getInfo(user.userId);
    } catch (e) {
        console.error("Error fetching student info:", e);
    }

    res.render('pages/xinphep', { user, student });
  },

  createRequest: async (req, res) => {
    try {
      const { ngayNghi, lyDo, tenCon } = req.body;
      const user = req.session.user;
      
      if (!user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      // tenCon is read-only in UI now, but validation is fine.
      if (!lyDo) return res.status(400).json({ success: false, message: 'Vui lòng điền lý do xin phép' });
      if (!ngayNghi) return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày nghỉ' });

      await XinPhepModel.createRequest(user.userId, ngayNghi, lyDo);
      res.json({ success: true, message: 'Gửi đơn xin phép thành công!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi gửi đơn' });
    }
  },

  getHistory: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false });
      
      const history = await XinPhepModel.getHistory(user.userId);
      res.json({ success: true, history });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử' });
    }
  },

  renderDuyetPage: (req, res) => {
    const user = req.session.user;
    if (!user || user.role !== 'Giáo viên') return res.status(403).send('Forbidden');
    res.render('pages/duyetxinphep', { user });
  },

  getTeacherRequests: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user || user.role !== 'Giáo viên') return res.status(403).json({ success: false, message: 'Không có quyền' });

      const requests = await XinPhepModel.getRequestsByTeacher(user.userId);
      res.json({ success: true, requests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { maPhieu, trangThai } = req.body;
      const user = req.session.user;
      if (!user || user.role !== 'Giáo viên') return res.status(403).json({ success: false, message: 'Không có quyền' });

      await XinPhepModel.updateStatus(maPhieu, trangThai);
      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
  }
};

module.exports = XinPhepController;
