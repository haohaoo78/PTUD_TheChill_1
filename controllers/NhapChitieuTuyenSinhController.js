const NhapChitieuTuyenSinhModel = require('../models/NhapChitieuTuyenSinhModel');

const NhapChitieuTuyenSinhController = {
  // ==============================
  // 1️⃣ RENDER PAGE LẦN ĐẦU
  // ==============================
renderPage: async (req, res) => {
  try {
    const chitieu = await NhapChitieuTuyenSinhModel.getAll();
    res.render('pages/nhapchitieutuyensinh', {
      chitieu,
      user: req.session.user || null,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('RenderPage error:', err);
    res.status(500).render('pages/error', { 
      message: 'Không thể tải dữ liệu: ' + err.message 
    });
  }
},

  // ==============================
  // 2️⃣ HIỂN THỊ TRONG LAYOUT INDEX
  // ==============================
  index: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Cán bộ SGD') {
      return res.status(403).redirect('/?error=Không có quyền truy cập');
    }

    try {
      const chitieu = await NhapChitieuTuyenSinhModel.getAll();
      res.render('index', { 
        page: 'nhapchitieutuyensinh',
        chitieu,
        user: req.session.user,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (err) {
      console.error('Controller index error:', err);
      res.status(500).render('pages/error', { 
        message: 'Lỗi lấy dữ liệu chỉ tiêu: ' + err.message 
      });
    }
  },

  // ==============================
  // 3️⃣ CREATE — thêm chỉ tiêu
  // ==============================
  create: async (req, res) => {
    const { nam_thi, ma_truong, so_luong_ct } = req.body;
    const soLuongInt = parseInt(so_luong_ct);

    try {
      if (!nam_thi || !ma_truong || !so_luong_ct || soLuongInt < 1) {
        const chitieu = await NhapChitieuTuyenSinhModel.getAll();
        return res.render('index', {
          page: 'nhapchitieutuyensinh',
          chitieu,
          user: req.session.user,
          success: null,
          error: 'Thiếu hoặc sai thông tin bắt buộc (Năm thi, Trường, Số lượng > 0)'
        });
      }

      const result = await NhapChitieuTuyenSinhModel.create({
        nam_thi,
        ma_truong,
        so_luong_ct: soLuongInt
      });

      const chitieu = await NhapChitieuTuyenSinhModel.getAll();

      res.render('index', {
        page: 'nhapchitieutuyensinh',
        chitieu,
        user: req.session.user,
        success: `Thêm thành công chỉ tiêu ID: ${result.chitieu}`,
        error: null
      });
    } catch (err) {
      console.error('Controller create error:', err);
      const chitieu = await NhapChitieuTuyenSinhModel.getAll();
      res.render('index', {
        page: 'nhapchitieutuyensinh',
        chitieu,
        user: req.session.user,
        success: null,
        error: 'Lỗi thêm chỉ tiêu: ' + err.message
      });
    }
  },

  // ==============================
  // 4️⃣ UPDATE
  // ==============================
  update: async (req, res) => {
    const { chitieu } = req.params;
    const { nam_thi, ma_truong, so_luong_ct } = req.body;
    const soLuongInt = parseInt(so_luong_ct);

    if (!nam_thi || !ma_truong || !so_luong_ct || soLuongInt < 1) {
      return res.json({ success: false, message: 'Thiếu hoặc sai thông tin' });
    }

    try {
      const success = await NhapChitieuTuyenSinhModel.update(chitieu, {
        nam_thi,
        ma_truong,
        so_luong_ct: soLuongInt
      });

      if (!success) {
        return res.json({ success: false, message: 'Không tìm thấy để cập nhật' });
      }

      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
      console.error('Controller update error:', err);
      res.json({ success: false, message: 'Lỗi cập nhật: ' + err.message });
    }
  },

  // ==============================
  // 5️⃣ DELETE
  // ==============================
  delete: async (req, res) => {
    const { chitieu } = req.params;
    try {
      const success = await NhapChitieuTuyenSinhModel.delete(chitieu);
      if (!success) {
        return res.json({ success: false, message: 'Không tìm thấy để xóa' });
      }
      res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
      console.error('Controller delete error:', err);
      res.json({ success: false, message: 'Lỗi xóa: ' + err.message });
    }
  },

  // ==============================
  // 6️⃣ GET BY ID
  // ==============================
  getById: async (req, res) => {
    const { chitieu } = req.params;
    try {
      const data = await NhapChitieuTuyenSinhModel.getById(chitieu);
      res.json({ success: true, data });
    } catch (err) {
      console.error('Controller getById error:', err);
      res.json({ success: false, message: err.message });
    }
  }
};

module.exports = NhapChitieuTuyenSinhController;
