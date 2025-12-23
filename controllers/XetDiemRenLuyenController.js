const QLModel = require('../models/XetDiemRenLuyenModel');

class QuanLyHSGVController {
  // Render page
  async renderPage(req, res) {
    try {
      const namHocList = await QLModel.getNamHocList();
      const currentNamHoc = await QLModel.getCurrentNamHoc();
      const selectedNamHoc = currentNamHoc || namHocList[0]?.NamHoc || '';
      // const selectedTeacher = teacherList[0]?.MaGiaoVien || '';
      // const classes = await QLModel.getClasses(selectedTeacher, selectedNamHoc);

      // tìm các tempale ejs có pages/xetdiemrenluyen.ejs trong views đã cấu hình mặc định trước đó
      // nó sẽ render (biên dịch) tempale đó thành html thuần
      // trong quá trình biên dịch thì nó sẽ truyền các biến ... vào để bạn dùng trong ejs
      res.render('pages/xetdiemrenluyen', {
        namHocList,
        // teacherList,
        selectedNamHoc,
        // selectedTeacher,
        // selectedClass: '',
        // classes,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  // HỌC SINH
  async getHocSinh(req, res) {
    try {
      const { maLop } = req.query;
      // Lấy mã GVCN từ session đăng nhập
      const maGiaoVien = req.session?.user?.username || null;
      if (!maGiaoVien) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc không có mã giáo viên chủ nhiệm' });
      }

      const currentHocKy = await QLModel.getCurrentNamHocKyHoc();
      if (!currentHocKy?.NamHoc || !currentHocKy?.KyHoc) {
        return res.status(400).json({ success: false, message: 'Không xác định được năm học/học kỳ hiện tại' });
      }

      // Lấy các lớp mà giáo viên này chủ nhiệm trong năm học
      const classes = await QLModel.getClasses(maGiaoVien, currentHocKy.NamHoc, maLop);
      if (!classes || classes.length === 0) {
        return res.json({
          success: true,
          data: [],
          namHoc: currentHocKy.NamHoc,
          hocKy: currentHocKy.KyHoc,
          message: 'Giáo viên chưa chủ nhiệm lớp nào trong năm học này'
        });
      }

      // Chỉ chấp nhận MaLop thuộc danh sách lớp của giáo viên; nếu không, chọn lớp đầu tiên
      const lopId = classes.find(c => c.MaLop === maLop)?.MaLop || classes[0].MaLop;
      let data = [];
      const hocKyNum = Number(currentHocKy.KyHoc);
      if (hocKyNum === 2) {
        const hk1List = await QLModel.getStudentList(lopId, currentHocKy.NamHoc, 1);
        const hk2List = await QLModel.getStudentList(lopId, currentHocKy.NamHoc, 2);
        const hk2Map = new Map(hk2List.map(hs => [hs.MaHocSinh, hs]));
        data = hk1List.flatMap(hk1 => {
        const hk2 = hk2Map.get(hk1.MaHocSinh) || { ...hk1, HocKy: 2, HanhKiem: '', RenLuyen: '' };
        return [hk1, hk2];
      });
      } else {
        data = await QLModel.getStudentList(lopId, currentHocKy.NamHoc, 1);
      }
      res.json({
        success: true,
        data,
        namHoc: currentHocKy.NamHoc,
        hocKy: currentHocKy.KyHoc,
        maLop: lopId
      });
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
        MaHocSinh: MaHS,
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

  // DROPDOWN / FILTER
  async getNamHoc(req, res) {
    try {
      const data = await QLModel.getNamHocList();
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getTeachers(req, res) {
    try {
      const { namHoc } = req.query;
      const data = await QLModel.getTeacherList(namHoc);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getClassesByTeacher(req, res) {
    try {
      const { maGiaoVien, namHoc, maLop } = req.query;
      const data = await QLModel.getClasses(maGiaoVien, namHoc, maLop);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async getTruong(req, res) {
    try {
      const data = await QLModel.getTruongList();
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  // HẠNH KIỂM / RÈN LUYỆN
  async getHocBa(req, res) {
    try {
      const { maHS, namHoc, hocKy } = req.query;
      const data = await QLModel.getHocBa(maHS, namHoc, hocKy);
      res.json({ success: true, data });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async updateHocBa(req, res) {
    try {
      const { maHS, namHoc, hocKy, HanhKiem, RenLuyen } = req.body;
      if (!maHS || !namHoc || !hocKy) {
        return res.json({ success: false, message: 'Thiếu thông tin bắt buộc (maHS, namHoc, hocKy)' });
      }
      await QLModel.updateHocBa(maHS, namHoc, hocKy, { HanhKiem, RenLuyen });
      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  // Lấy HK/RL tổng hợp theo NĂM
  async getHocBaNam(req, res) {
    try {
      const { maHS, namHoc } = req.query;
      if (!maHS || !namHoc) return res.json({ success: false, message: 'Thiếu tham số' });

      const hk1 = await QLModel.getHocBa(maHS, namHoc, 1);
      const hk2 = await QLModel.getHocBa(maHS, namHoc, 2);

      const order = ['Yếu', 'Trung bình', 'Khá', 'Tốt', 'Xuất sắc'];
      const getLower = (v1, v2) => {
        if (!v1) return v2;
        if (!v2) return v1;
        return order[Math.min(order.indexOf(v1), order.indexOf(v2))] || v1;
      };

      const result = {
        HanhKiem: getLower(hk1?.HanhKiem, hk2?.HanhKiem) || 'Tốt',
        RenLuyen: getLower(hk1?.RenLuyen, hk2?.RenLuyen) || 'Tốt',
        NhanXet: [hk1?.NhanXet, hk2?.NhanXet].filter(n => n).join('; ')
      };

      res.json({ success: true, data: result });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new QuanLyHSGVController();
