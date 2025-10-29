const GiaoVien = require('../models/QuanLyHSGVModels');

class QuanLyHSGVController {
  // ✅ Render trang chính quản lý Học sinh / Giáo viên
  async renderPage(req, res) {
    try {
      res.render('pages/quanlygiaovien_hocsinh', {
        statusMessage: ''
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang');
    }
  }

  // ==================== HỌC SINH ====================
  async getHocSinh(req, res) {
    try {
      const { namHoc, khoi, lop } = req.query;
      const hocsinh = await HocSinh.getAll(namHoc, khoi, lop);
      res.render('pages/quanly_hocsinh', { hocsinh, statusMessage: '' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi lấy danh sách học sinh');
    }
  }

  async editHocSinh(req, res) {
    try {
      if(req.method === 'GET') {
        const hs = await HocSinh.getById(req.params.id);
        res.render('pages/edit_hocsinh', { hs, statusMessage: '' });
      } else if(req.method === 'POST') {
        await HocSinh.update(req.params.id, req.body);
        res.redirect('/quanly/hocsinh?namHoc=' + req.body.namHoc + '&khoi=' + req.body.khoi + '&lop=' + req.body.lop);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi chỉnh sửa học sinh');
    }
  }

  async deleteHocSinh(req, res) {
    try {
      await HocSinh.delete(req.params.id);
      res.redirect('back');
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi xóa học sinh');
    }
  }

  // ==================== GIÁO VIÊN ====================
  async getGiaoVien(req, res) {
    try {
      const giaovien = await GiaoVien.getAll();
      res.render('pages/quanly_giaovien', { giaovien, statusMessage: '' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi lấy danh sách giáo viên');
    }
  }

  async createGiaoVien(req, res) {
    try {
      if(req.method === 'GET') {
        res.render('pages/edit_giaovien', { gv: null, statusMessage: '' });
      } else if(req.method === 'POST') {
        await GiaoVien.create(req.body);
        res.redirect('/quanly/giaovien');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi thêm giáo viên');
    }
  }

  async editGiaoVien(req, res) {
    try {
      if(req.method === 'GET') {
        const gv = await GiaoVien.getById(req.params.id);
        res.render('pages/edit_giaovien', { gv, statusMessage: '' });
      } else if(req.method === 'POST') {
        await GiaoVien.update(req.params.id, req.body);
        res.redirect('/quanly/giaovien');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi chỉnh sửa giáo viên');
    }
  }

  async deleteGiaoVien(req, res) {
    try {
      await GiaoVien.delete(req.params.id);
      res.redirect('/quanly/giaovien');
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi xóa giáo viên');
    }
  }
}

module.exports = new QuanLyHSGVController();
