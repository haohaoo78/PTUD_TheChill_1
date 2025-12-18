const XinPhepModel = require('../models/XinPhepModel');
const ThongTinHSModel = require('../models/ThongTinHSModel');

const XinPhepController = {

  // ===============================
  // RENDER TRANG XIN PHÉP
  // ===============================
  renderPage: async (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('Unauthorized');

    let student = null;

    try {
      const maHocSinh =
        user.loaiTaiKhoan === 'Phụ huynh'
          ? user.maHocSinh
          : user.entityId;

      if (maHocSinh) {
        student = await ThongTinHSModel.getInfo(maHocSinh);
      }
    } catch (err) {
      console.error('Error fetching student info:', err);
    }

    res.render('pages/xinphep', { user, student });
  },

  // ===============================
  // TẠO ĐƠN XIN PHÉP
  // ===============================
  createRequest: async (req, res) => {
    try {
      const { ngayNghi, lyDo } = req.body;
      const user = req.session.user;

      if (!user)
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      if (!ngayNghi)
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày nghỉ' });

      if (!lyDo)
        return res.status(400).json({ success: false, message: 'Vui lòng điền lý do' });

      const maHocSinh =
        user.loaiTaiKhoan === 'Phụ huynh'
          ? user.maHocSinh
          : user.entityId;

      if (!maHocSinh)
        return res.json({ success: false, message: 'Không xác định được học sinh' });

      await XinPhepModel.createRequest(maHocSinh, ngayNghi, lyDo);

      res.json({ success: true, message: 'Gửi đơn xin phép thành công!' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi gửi đơn' });
    }
  },

  // ===============================
  // LỊCH SỬ ĐƠN XIN PHÉP
  // ===============================
  getHistory: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false });

      const maHocSinh =
        user.loaiTaiKhoan === 'Phụ huynh'
          ? user.maHocSinh
          : user.entityId;

      if (!maHocSinh)
        return res.json({ success: false, message: 'Không xác định được học sinh' });

      const history = await XinPhepModel.getHistory(maHocSinh);

      res.json({ success: true, history });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử' });
    }
  },

  // ===============================
  // GIÁO VIÊN DUYỆT ĐƠN
  // ===============================
  renderDuyetPage: (req, res) => {
    const user = req.session.user;
    if (!user || user.loaiTaiKhoan !== 'Giáo viên')
      return res.status(403).send('Forbidden');

    res.render('pages/duyetxinphep', { user });
  },

  getTeacherRequests: async (req, res) => {
    try {
      const user = req.session.user;
      if (!user || user.loaiTaiKhoan !== 'Giáo viên')
        return res.status(403).json({ success: false, message: 'Không có quyền' });

      const requests = await XinPhepModel.getRequestsByTeacher(user.entityId);
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

      if (!user || user.loaiTaiKhoan !== 'Giáo viên')
        return res.status(403).json({ success: false, message: 'Không có quyền' });

      await XinPhepModel.updateStatus(maPhieu, trangThai);

      res.json({ success: true, message: 'Cập nhật thành công' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
  }
};

module.exports = XinPhepController;
