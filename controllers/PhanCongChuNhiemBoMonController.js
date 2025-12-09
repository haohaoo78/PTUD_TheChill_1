const PhanCongModel = require('../models/PhanCongChuNhiemBoMonModel');

class PhanCongController {
  async renderPage(req, res) {
    try {
      const namHocList = await PhanCongModel.getNamHocList();
      const selectedNamHoc = namHocList[0] || '';
      const kyHocList = (await PhanCongModel.getKyHocList(selectedNamHoc)).map(k => k.KyHoc);
      const khoiList = await PhanCongModel.getKhoiList();

      res.render('pages/phancongchunhiembomon', {
        namHocList,
        kyHocList,
        khoiList,
        selectedNamHoc,
        selectedKyHoc: kyHocList[0] || '',
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang phân công');
    }
  }

  async getClassesForNamHoc(req, res) {
    try {
      const { NamHoc } = req.body;
      const rows = await PhanCongModel.getClassesByNamHoc(NamHoc);
      res.json({ success: true, classes: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp' });
    }
  }

  async getAvailableTeachersForChunhiem(req, res) {
    try {
      const { NamHoc, MaLop } = req.body;
      const rows = await PhanCongModel.getAvailableTeachersForChunhiem(NamHoc, MaLop);
      res.json({ success: true, teachers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên' });
    }
  }

  async getGVCNByClass(req, res) {
    try {
      const { MaLop, NamHoc } = req.body;
      const row = await PhanCongModel.getGVCNByClass(MaLop, NamHoc);
      res.json({ success: true, current: row });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy giáo viên chủ nhiệm hiện tại' });
    }
  }

  async assignChunhiem(req, res) {
    try {
      const { MaLop, NamHoc, MaGVCN, KyHoc } = req.body;
      if (!MaLop || !NamHoc || !MaGVCN) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
      // Check if selected term is finished
      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc || '1');
      if (status === 'Kết thúc') return res.status(400).json({ success: false, message: 'Kỳ học đã kết thúc, không thể phân công' });

      await PhanCongModel.assignChunhiem(MaLop, NamHoc, MaGVCN);
      res.json({ success: true, message: 'Phân công thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi phân công giáo viên chủ nhiệm' });
    }
  }

  async getKhoiList(req, res) {
    try {
      const rows = await PhanCongModel.getKhoiList();
      res.json({ success: true, khoiList: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách khối' });
    }
  }

  async getSubjectsByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const rows = await PhanCongModel.getSubjectsByKhoi(MaKhoi);
      res.json({ success: true, subjects: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách môn' });
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const rows = await PhanCongModel.getClassesByKhoi(MaKhoi);
      res.json({ success: true, classes: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp' });
    }
  }

  async getTeachersBySubject(req, res) {
    try {
      const { TenMonHoc, NamHoc, KyHoc, Thu, TietHoc, MaLop } = req.body;
      const rows = await PhanCongModel.getTeachersBySubject(TenMonHoc, NamHoc, KyHoc, Thu, TietHoc, MaLop);
      res.json({ success: true, teachers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên theo môn' });
    }
  }

  async getTeacherLoad(req, res) {
    try {
      const { MaGiaoVien, NamHoc, KyHoc } = req.body;
      if (!MaGiaoVien || !NamHoc || !KyHoc) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      const load = await PhanCongModel.getTeacherWeeklyLoad(MaGiaoVien, NamHoc, KyHoc);
      res.json({ success: true, load });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy số tiết giáo viên' });
    }
  }

  // Pre-check assign bomon: compute current load + added load for selected classes
  async checkAssignBomon(req, res) {
    try {
      const { MaGiaoVien, ClassList = [], NamHoc, KyHoc, TenMonHoc } = req.body;
      if (!MaGiaoVien || !NamHoc || !KyHoc || !TenMonHoc) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      const currentLoad = await PhanCongModel.getTeacherWeeklyLoad(MaGiaoVien, NamHoc, KyHoc);
      let addedLoad = 0;
      for (const MaLop of ClassList) {
        const soTiet = await PhanCongModel.getSubjectWeeklyCountForClass(MaLop, NamHoc, KyHoc, TenMonHoc);
        addedLoad += soTiet;
      }
      const MAX_LOAD = 40; // same as model
      const canAssign = currentLoad + addedLoad <= MAX_LOAD;
      res.json({ success: true, canAssign, currentLoad, addedLoad, MAX_LOAD });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra phân công' });
    }
  }

  async getSubjectCountsForClasses(req, res) {
    try {
      const { ClassList = [], NamHoc, KyHoc, TenMonHoc } = req.body;
      if (!ClassList.length || !NamHoc || !KyHoc || !TenMonHoc) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      const results = [];
      for (const MaLop of ClassList) {
        const count = await PhanCongModel.getSubjectWeeklyCountForClass(MaLop, NamHoc, KyHoc, TenMonHoc);
        results.push({ MaLop, count });
      }
      res.json({ success: true, counts: results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy số tiết theo lớp' });
    }
  }

  async checkHocKyStatus(req, res) {
    try {
      const { NamHoc, KyHoc } = req.body;
      if (!NamHoc || !KyHoc) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc);
      res.json({ success: true, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra trạng thái học kỳ' });
    }
  }

  async assignBoMon(req, res) {
    try {
      const { MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc } = req.body;
      if (!MaGiaoVien || !ClassList || !NamHoc || !KyHoc || !TenMonHoc) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc);
      if (status === 'Kết thúc') return res.status(400).json({ success: false, message: 'Kỳ học đã kết thúc, không thể phân công' });

      const result = await PhanCongModel.assignBoMonForTeacher(MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi phân công giáo viên bộ môn' });
    }
  }
}

module.exports = new PhanCongController();
