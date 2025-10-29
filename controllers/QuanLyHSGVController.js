const QLModel = require('../models/QuanLyHSGVModels');

class QuanLyHSGVController {
  // ==================== Render trang chính ====================
  async renderPage(req, res) {
    try {
      const khoiList = await QLModel.getKhoiList();
      const namHocList = await QLModel.getNamHocList();
      res.render('pages/quanlygiaovien_hocsinh', {
        khoiList,
        namHocList,
        selectedKhoi: '',
        selectedClass: '',
        selectedNamHoc: '',
        classes: [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang');
    }
  }

  // ==================== Học sinh ====================
  async getHocSinh(req, res) {
    try {
      const { namHoc, khoi, lop } = req.query;
      const data = await QLModel.getStudentList(namHoc, khoi, lop);
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách học sinh' });
    }
  }

  async getHocSinhById(req, res) {
    try {
      const data = await QLModel.getStudentById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy thông tin học sinh' });
    }
  }

  async addHocSinh(req, res) {
    try {
      await QLModel.addStudent(req.body);
      res.json({ success: true, message: 'Thêm học sinh thành công' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi thêm học sinh' });
    }
  }

  async updateHocSinh(req, res) {
    try {
      await QLModel.updateStudent(req.params.id, req.body);
      res.json({ success: true, message: 'Cập nhật học sinh thành công' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi cập nhật học sinh' });
    }
  }

  async deleteHocSinh(req, res) {
    try {
      await QLModel.deleteStudent(req.params.id);
      res.json({ success: true, message: 'Học sinh đã ngừng học' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi xóa học sinh' });
    }
  }

  // ==================== Giáo viên ====================
  async getGiaoVien(req, res) {
    try {
      const { boMon, trangThai } = req.query;
      const data = await QLModel.getTeacherList(boMon, trangThai);
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên' });
    }
  }

  async getGiaoVienById(req, res) {
    try {
      const data = await QLModel.getTeacherById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy thông tin giáo viên' });
    }
  }

  async addGiaoVien(req, res) {
    try {
      await QLModel.addTeacher(req.body);
      res.json({ success: true, message: 'Thêm giáo viên thành công' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi thêm giáo viên' });
    }
  }

  async updateGiaoVien(req, res) {
    try {
      await QLModel.updateTeacher(req.params.id, req.body);
      res.json({ success: true, message: 'Cập nhật giáo viên thành công' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi cập nhật giáo viên' });
    }
  }

  async deleteGiaoVien(req, res) {
    try {
      await QLModel.deleteTeacher(req.params.id);
      res.json({ success: true, message: 'Giáo viên đã ngừng hoạt động' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi xóa giáo viên' });
    }
  }

  // ==================== Dropdown / filter phụ trợ ====================
  async getNamHoc(req, res) {
    try {
      const data = await QLModel.getNamHocList();
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách năm học' });
    }
  }

  async getKhoi(req, res) {
    try {
      const data = await QLModel.getKhoiList();
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách khối' });
    }
  }

  async getLopByKhoi(req, res) {
    try {
      const { khoi } = req.params;
      const data = await QLModel.getClassesByKhoi(khoi);
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách lớp theo khối' });
    }
  }

  async getHocKy(req, res) {
    try {
      const data = await QLModel.getHocKyList();
      res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi khi lấy danh sách học kỳ' });
    }
  }
}

module.exports = new QuanLyHSGVController();
