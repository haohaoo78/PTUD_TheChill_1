const DuyetModel = require('../models/DuyetYeuCauSuaDiemModel');

class DuyetController {
  // Render trang với danh sách mặc định (Đang xử lý)
  static async renderPage(req, res) {
    try {
      const requests = await DuyetModel.getRequestsByStatus('DangXuLy');
      res.render('pages/duyetyeucausuadiem', {
        title: 'Duyệt yêu cầu sửa điểm',
        requests
      });
    } catch (err) {
      console.error('Lỗi khi tải trang:', err);
      res.status(500).send('Lỗi server: ' + (err.message || 'Không thể tải trang'));
    }
  }

  // API lấy chi tiết yêu cầu
  static async getRequestDetails(req, res) {
    try {
      const { id } = req.params;
      const request = await DuyetModel.getRequestDetails(id);
      if (!request) return res.json({ success: false, message: 'Không tìm thấy yêu cầu' });
      res.json({ success: true, request });
    } catch (err) {
      console.error('Controller - Lỗi lấy chi tiết:', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // API duyệt yêu cầu
  static async approveRequest(req, res) {
    try {
      const { id } = req.body;
      const maHieuTruong = req.session.user?.username;

      if (!maHieuTruong || req.session.user?.role !== 'Hiệu trưởng') {
        console.log('Session user:', req.session.user);
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc không có quyền duyệt' });
      }

      const result = await DuyetModel.approveRequest(id, maHieuTruong);

      if (result.success) {
        res.json({ success: true, message: result.message, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.message || 'Lỗi khi duyệt yêu cầu' });
      }
    } catch (err) {
      console.error('Controller - Lỗi duyệt:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi xử lý duyệt yêu cầu' });
    }
  }

  // API từ chối yêu cầu
  static async rejectRequest(req, res) {
    try {
      const { id, ghiChu } = req.body;
      const maHieuTruong = req.session.user?.username;

      if (!maHieuTruong || req.session.user?.role !== 'Hiệu trưởng') {
        console.log('Session user:', req.session.user);
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc không có quyền từ chối' });
      }

      if (!ghiChu) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
      }

      const result = await DuyetModel.rejectRequest(id, ghiChu, maHieuTruong);

      if (result.success) {
        res.json({ success: true, message: result.message, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.message || 'Lỗi khi từ chối yêu cầu' });
      }
    } catch (err) {
      console.error('Controller - Lỗi từ chối:', err);
      res.status(500).json({ success: false, message: 'Lỗi server khi xử lý từ chối yêu cầu' });
    }
  }

  // API lấy danh sách yêu cầu theo trạng thái
  static async getRequestsByStatus(req, res) {
    try {
      const { status } = req.body;
      console.log('Đang lọc theo trạng thái:', status);

      const requests = await DuyetModel.getRequestsByStatus(status);
      res.json({ success: true, requests });
    } catch (err) {
      console.error('Lỗi khi lấy danh sách:', err);
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy danh sách yêu cầu' });
    }
  }

  // API lấy danh sách yêu cầu đang chờ xử lý
  static async getPendingRequestsAPI(req, res) {
    try {
      const requests = await DuyetModel.getPendingRequests();
      res.json({ success: true, requests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // API lấy danh sách yêu cầu đã xử lý (Đã duyệt hoặc Bị từ chối)
  static async getProcessedRequestsAPI(req, res) {
    try {
      const { status } = req.query; // 'approved' hoặc 'rejected'
      const requests = await DuyetModel.getProcessedRequests(status);
      res.json({ success: true, requests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = DuyetController;
