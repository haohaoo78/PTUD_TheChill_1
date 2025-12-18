// controllers/DuyetController.js
const DuyetModel = require('../models/DuyetYeuCauSuaDiemModel');

class DuyetController {

  // ==========================
  // Render trang duyệt yêu cầu
  // ==========================
  static async renderPage(req, res) {
    try {
      const user = req.session.user;

      // Kiểm tra quyền: chỉ Hiệu trưởng + có mã trường
      if (!user || 
          user.loaiTaiKhoan !== 'Hiệu trưởng' || 
          !user.maTruong) {
        return res.status(403).send('Không có quyền truy cập. Chỉ Hiệu trưởng mới được phép.');
      }

      const requests = await DuyetModel.getRequestsByStatus('DangXuLy', user.maTruong);

      res.render('pages/duyetyeucausuadiem', {
        title: 'Duyệt yêu cầu sửa điểm',
        requests: requests || [],
        statusMessage: ''
      });
    } catch (err) {
      console.error('Lỗi render trang duyệt yêu cầu:', err);
      res.status(500).send('Lỗi server khi tải trang duyệt yêu cầu');
    }
  }

  // ==========================
  // Lấy chi tiết một yêu cầu
  // ==========================
  static async getRequestDetails(req, res) {
    try {
      const { id } = req.params;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'Hiệu trưởng') {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      }

      const request = await DuyetModel.getRequestDetails(id, user.maTruong);

      if (!request) {
        return res.json({ success: false, message: 'Không tìm thấy yêu cầu hoặc không thuộc trường của bạn' });
      }

      res.json({ success: true, request });
    } catch (err) {
      console.error('Lỗi lấy chi tiết yêu cầu:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // ==========================
  // Duyệt (phê duyệt) yêu cầu
  // ==========================
  static async approveRequest(req, res) {
    try {
      const { id } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'Hiệu trưởng') {
        return res.status(403).json({ success: false, message: 'Không có quyền duyệt' });
      }

      if (!id) {
        return res.status(400).json({ success: false, message: 'Thiếu ID yêu cầu' });
      }

      const result = await DuyetModel.approveRequest(
        id,
        user.entityId,      // MaHieuTruong
        user.maTruong
      );

      if (!result.success) {
        return res.json({ success: false, message: result.message || 'Duyệt thất bại' });
      }

      res.json({ success: true, message: 'Đã duyệt yêu cầu thành công' });
    } catch (err) {
      console.error('Lỗi khi duyệt yêu cầu:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi duyệt' });
    }
  }

  // ==========================
  // Từ chối yêu cầu
  // ==========================
  static async rejectRequest(req, res) {
    try {
      const { id, ghiChu } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'Hiệu trưởng') {
        return res.status(403).json({ success: false, message: 'Không có quyền từ chối' });
      }

      if (!id) {
        return res.status(400).json({ success: false, message: 'Thiếu ID yêu cầu' });
      }

      if (!ghiChu || ghiChu.trim() === '') {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
      }

      const result = await DuyetModel.rejectRequest(
        id,
        ghiChu.trim(),
        user.entityId,      // MaHieuTruong
        user.maTruong
      );

      if (!result.success) {
        return res.json({ success: false, message: result.message || 'Từ chối thất bại' });
      }

      res.json({ success: true, message: 'Đã từ chối yêu cầu' });
    } catch (err) {
      console.error('Lỗi khi từ chối yêu cầu:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi từ chối' });
    }
  }

  // ==========================
  // Lọc danh sách theo trạng thái (DangXuLy, DaDuyet, TuChoi)
  // ==========================
  static async getRequestsByStatus(req, res) {
    try {
      const { status } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'Hiệu trưởng' || !user.maTruong) {
        return res.status(403).json({ success: false, message: 'Không có quyền' });
      }

      const validStatuses = ['DangXuLy', 'DaDuyet', 'BiTuChoi'];
      const safeStatus = validStatuses.includes(status) ? status : 'DangXuLy';

      const requests = await DuyetModel.getRequestsByStatus(safeStatus, user.maTruong);

      res.json({ success: true, requests: requests || [] });
    } catch (err) {
      console.error('Lỗi lọc danh sách yêu cầu:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lọc' });
    }
  }
}

module.exports = DuyetController;