const QLModel = require('../models/QuanLyHSGVModels');

class QuanLyHSGVController {
  // Render trang chính
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
      res.status(500).send('Lỗi server');
    }
  }

  // ================= HỌC SINH =================
  async getHocSinh(req, res) {
    try {
      const { namHoc, khoi, lop } = req.query;
      const data = await QLModel.getStudentList(namHoc, khoi, lop);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getHocSinhById(req, res) {
    try {
      const data = await QLModel.getStudentById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async addHocSinh(req, res) {
    try {
      const { MaHS, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc } = req.body;
      const birthdayFormatted = Birthday ? Birthday.split('T')[0] : null;

      await QLModel.addStudent({
        MaHS,
        TenHocSinh,
        Birthday: birthdayFormatted,
        GioiTinh,
        MaLop,
        TrangThai: TrangThai || 'Đang học',
        KhoaHoc,
      });

      res.json({ success: true, message: 'Thêm học sinh thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi thêm học sinh' });
    }
  }

  async updateHocSinh(req, res) {
    try {
      const id = req.params.id;
      const { TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc } = req.body;
      const birthdayFormatted = Birthday ? Birthday.split('T')[0] : null;

      await QLModel.updateStudent(id, {
        TenHocSinh,
        Birthday: birthdayFormatted,
        GioiTinh,
        MaLop,
        TrangThai,
        KhoaHoc,
      });

      res.json({ success: true, message: 'Cập nhật học sinh thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật học sinh' });
    }
  }

  async deleteHocSinh(req, res) {
    try {
      await QLModel.deleteStudent(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  // ================= GIÁO VIÊN =================
  async getGiaoVien(req, res) {
    try {
      const { monHoc, trangThai } = req.query;
      const data = await QLModel.getTeacherList(monHoc, trangThai);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getGiaoVienById(req, res) {
    try {
      const data = await QLModel.getTeacherById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async addGiaoVien(req, res) {
  try {
    const {
      MaGV, TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
      DiaChi, NgayVaoTruong, TenMonHoc, TinhTrangHonNhan,
      ChucVu, ThamNien, MaTruong, TrangThai
    } = req.body;

    const ngaySinhFormatted = NgaySinh ? NgaySinh.split('T')[0] : null;

    await QLModel.addTeacher({
      MaGiaoVien: MaGV, // <-- sửa key
      TenGiaoVien,
      NgaySinh: ngaySinhFormatted,
      GioiTinh,
      Email,
      SDT,
      TrinhDoChuyenMon,
      DiaChi,
      NgayVaoTruong,
      TenMonHoc,
      TinhTrangHonNhan,
      ChucVu,
      ThamNien,
      MaTruong,
      TrangThai: TrangThai || 'Đang công tác'
    });

    res.json({ success: true, message: 'Thêm giáo viên thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi thêm giáo viên' });
  }
}


  async updateGiaoVien(req, res) {
    try {
      const id = req.params.id;
      const {
        TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
        DiaChi, NgayVaoTruong, TenMonHoc, TinhTrangHonNhan,
        ChucVu, ThamNien, MaTruong, TrangThai
      } = req.body;

      const ngaySinhFormatted = NgaySinh ? NgaySinh.split('T')[0] : null;

      await QLModel.updateTeacher(id, {
        TenGiaoVien,
        NgaySinh: ngaySinhFormatted,
        GioiTinh,
        Email,
        SDT,
        TrinhDoChuyenMon,
        DiaChi,
        NgayVaoTruong,
        TenMonHoc,
        TinhTrangHonNhan,
        ChucVu,
        ThamNien,
        MaTruong,
        TrangThai,
      });

      res.json({ success: true, message: 'Cập nhật giáo viên thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật giáo viên' });
    }
  }

  async deleteGiaoVien(req, res) {
    try {
      await QLModel.deleteTeacher(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  // ================= Dropdown phụ trợ =================
  async getNamHoc(req, res) {
    try {
      const data = await QLModel.getNamHocList();
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getKhoi(req, res) {
    try {
      const data = await QLModel.getKhoiList();
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const data = await QLModel.getClassesByKhoi(req.query.makhoi);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getMonHoc(req, res) {
    try {
      const data = await QLModel.getMonHocList();
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }
}

module.exports = new QuanLyHSGVController();
