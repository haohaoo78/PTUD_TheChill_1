const DuyetModel = require('../models/DuyetYeuCauSuaDiemModel');

class DuyetController {

  // ==========================
  // Render trang duyệt yêu cầu
  // ==========================
  static async renderPage(req, res) {
    try {
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'HieuTruong' || !user.maTruong) {
        return res.status(403).send('Không có quyền truy cập');
      }

      const requests = await DuyetModel.getRequestsByStatus(
        'DangXuLy',
        user.maTruong
      );

      res.render('pages/duyetyeucausuadiem', {
        title: 'Duyệt yêu cầu sửa điểm',
        requests
      });
    } catch (err) {
      console.error('Lỗi render duyệt yêu cầu:', err);
      res.status(500).send('Lỗi server');
    }
  }

  // ==========================
  // Lấy chi tiết yêu cầu
  // ==========================
  static async getRequestDetails(req, res) {
    try {
      const { id } = req.params;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'HieuTruong') {
        return res.status(403).json({ success: false, message: 'Không có quyền' });
      }

      const request = await DuyetModel.getRequestDetails(id, user.maTruong);
      if (!request) {
        return res.json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }

      res.json({ success: true, request });
    } catch (err) {
      console.error('Lỗi lấy chi tiết:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // ==========================
  // Duyệt yêu cầu
  // ==========================
  static async approveRequest(req, res) {
    try {
      const { id } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'HieuTruong') {
        return res.status(401).json({
          success: false,
          message: 'Không có quyền duyệt'
        });
      }

      const result = await DuyetModel.approveRequest(
        id,
        user.username,
        user.maTruong
      );

      return res.json(result);
    } catch (err) {
      console.error('Lỗi duyệt:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // ==========================
  // Từ chối yêu cầu
  // ==========================
  static async rejectRequest(req, res) {
    try {
      const { id, ghiChu } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'HieuTruong') {
        return res.status(401).json({
          success: false,
          message: 'Không có quyền từ chối'
        });
      }

      if (!ghiChu) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập lý do từ chối'
        });
      }

      const result = await DuyetModel.rejectRequest(
        id,
        ghiChu,
        user.username,
        user.maTruong
      );

      return res.json(result);
    } catch (err) {
      console.error('Lỗi từ chối:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // ==========================
  // Lọc danh sách theo trạng thái
  // ==========================
  static async getRequestsByStatus(req, res) {
    try {
      const { status } = req.body;
      const user = req.session.user;

      if (!user || user.loaiTaiKhoan !== 'HieuTruong') {
        return res.status(403).json({ success: false });
      }

      const requests = await DuyetModel.getRequestsByStatus(
        status,
        user.maTruong
      );

      res.json({ success: true, requests });
    } catch (err) {
      console.error('Lỗi lọc yêu cầu:', err);
      res.status(500).json({ success: false });
    }
  }
}

module.exports = DuyetController;
