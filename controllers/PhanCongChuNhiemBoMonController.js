const PhanCongModel = require('../models/PhanCongChuNhiemBoMonModel');

class PhanCongController {

  async renderPage(req, res) {
    try {
      const namHocList = await PhanCongModel.getNamHocList();
      const selectedNamHoc = namHocList[0] || '';

      const kyHocList = (await PhanCongModel.getKyHocList(selectedNamHoc))
        .map(k => k.KyHoc);

      const khoiList = await PhanCongModel.getKhoiList();

      res.render('pages/phancongchunhiembomon', {
        namHocList,
        kyHocList,
        khoiList,
        selectedNamHoc,
        selectedKyHoc: kyHocList[0] || ''
      });

    } catch (err) {
      console.error(err);
      res.status(500).send("Lỗi server khi render trang phân công");
    }
  }

  async getClassesForNamHoc(req, res) {
    try {
      const { NamHoc } = req.body;
      const classes = await PhanCongModel.getClassesByNamHoc(NamHoc);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách lớp" });
    }
  }

  async getAvailableTeachersForChunhiem(req, res) {
    try {
      const { NamHoc, MaLop } = req.body;
      const teachers = await PhanCongModel.getAvailableTeachersForChunhiem(NamHoc || '2025-2026', MaLop);
      res.json({ success: true, teachers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy giáo viên chủ nhiệm" });
    }
  }

  async getGVCNByClass(req, res) {
    try {
      const { MaLop, NamHoc } = req.body;
      const current = await PhanCongModel.getGVCNByClass(MaLop, NamHoc || '2025-2026');
      res.json({ success: true, current });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy giáo viên chủ nhiệm hiện tại" });
    }
  }

  async assignChunhiem(req, res) {
    try {
      const { MaLop, NamHoc, MaGVCN, KyHoc } = req.body;

      if (!MaLop || !NamHoc || !MaGVCN)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      // Check học kỳ
      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc || '1');
      if (status === "Kết thúc")
        return res.status(400).json({ success: false, message: "Kỳ học đã kết thúc, không thể phân công" });

      // Verify teacher and class exist
      const [gvRows] = await global.db.execute('SELECT MaGiaoVien FROM GiaoVien WHERE MaGiaoVien = ?', [MaGVCN]);
      if (!gvRows.length)
        return res.status(400).json({ success: false, message: "Giáo viên không tồn tại" });

      const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ?', [MaLop]);
      if (!lopRows.length)
        return res.status(400).json({ success: false, message: "Lớp không tồn tại" });

      await PhanCongModel.assignChunhiem(MaLop, NamHoc, MaGVCN);
      res.json({ success: true, message: "Phân công giáo viên chủ nhiệm thành công" });

    } catch (err) {
      console.error(err);
      // include error message to help diagnose DB/save issues
      res.status(500).json({ success: false, message: "Lỗi khi phân công: " + (err && err.message ? err.message : String(err)) });
    }
  }

  async getKhoiList(req, res) {
    try {
      const khoiList = await PhanCongModel.getKhoiList();
      res.json({ success: true, khoiList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy danh sách khối" });
    }
  }

  async getSubjectsByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const subjects = await PhanCongModel.getSubjectsByKhoi(MaKhoi);
      res.json({ success: true, subjects });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy danh sách môn" });
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const classes = await PhanCongModel.getClassesByKhoi(MaKhoi);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy danh sách lớp" });
    }
  }

  async getTeachersBySubject(req, res) {
    try {
      const { TenMonHoc, NamHoc, KyHoc } = req.body;
      const teachers = await PhanCongModel.getTeachersBySubject(
        TenMonHoc, NamHoc || '2025-2026', KyHoc || '1'
      );
      res.json({ success: true, teachers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy giáo viên theo môn" });
    }
  }

  async getTeacherLoad(req, res) {
    try {
      const { MaGiaoVien, NamHoc, KyHoc } = req.body;
      if (!MaGiaoVien || !NamHoc || !KyHoc)
        return res.status(400).json({ success: false, message: "Thiếu tham số" });

      const load = await PhanCongModel.getTeacherWeeklyLoad(MaGiaoVien, NamHoc, KyHoc);
      res.json({ success: true, load });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy số tiết" });
    }
  }

  async checkAssignBomon(req, res) {
    try {
      const { MaGiaoVien, ClassList = [], NamHoc, KyHoc, TenMonHoc } = req.body;

      if (!MaGiaoVien || !NamHoc || !KyHoc || !TenMonHoc)
        return res.status(400).json({ success: false, message: "Thiếu tham số" });

      const currentLoad = await PhanCongModel.getTeacherWeeklyLoad(
        MaGiaoVien, NamHoc, KyHoc
      );

      let addedLoad = 0;
      for (const MaLop of ClassList) {
        const soTiet = await PhanCongModel.getSubjectWeeklyCountForClass(
          MaLop, NamHoc, KyHoc, TenMonHoc
        );
        addedLoad += soTiet;
      }

      const MAX_LOAD = 40;
      res.json({
        success: true,
        canAssign: currentLoad + addedLoad <= MAX_LOAD,
        currentLoad,
        addedLoad,
        MAX_LOAD
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi kiểm tra phân công" });
    }
  }

  async getSubjectCountsForClasses(req, res) {
    try {
      const { ClassList = [], NamHoc, KyHoc, TenMonHoc } = req.body;

      if (!ClassList.length || !NamHoc || !KyHoc || !TenMonHoc)
        return res.status(400).json({ success: false, message: "Thiếu tham số" });

      const results = [];
      for (const MaLop of ClassList) {
        const count = await PhanCongModel.getSubjectWeeklyCountForClass(
          MaLop, NamHoc, KyHoc, TenMonHoc
        );
        results.push({ MaLop, count });
      }

      res.json({ success: true, counts: results });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy số tiết" });
    }
  }

  async checkHocKyStatus(req, res) {
    try {
      const { NamHoc, KyHoc } = req.body;

      if (!NamHoc || !KyHoc)
        return res.status(400).json({ success: false, message: "Thiếu tham số" });

      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc);
      res.json({ success: true, status });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi kiểm tra học kỳ" });
    }
  }

  async assignBoMon(req, res) {
    try {
      const { MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc } = req.body;
      
      console.log('assignBoMon request:', { MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc });

      if (!MaGiaoVien || !ClassList || !NamHoc || !KyHoc || !TenMonHoc)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      if (!Array.isArray(ClassList) || ClassList.length === 0)
        return res.status(400).json({ success: false, message: "Danh sách lớp không hợp lệ" });

      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc);
      if (status === "Kết thúc")
        return res.status(400).json({ success: false, message: "Kỳ học đã kết thúc, không thể phân công" });

      // Verify teacher exists
      const [gvRows] = await global.db.execute('SELECT MaGiaoVien FROM GiaoVien WHERE MaGiaoVien = ?', [MaGiaoVien]);
      if (!gvRows.length)
        return res.status(400).json({ success: false, message: "Giáo viên không tồn tại" });

      // Verify subject exists
      const [monRows] = await global.db.execute('SELECT TenMonHoc FROM MonHoc WHERE TenMonHoc = ?', [TenMonHoc]);
      if (!monRows.length)
        return res.status(400).json({ success: false, message: "Môn học không tồn tại" });

      const result = await PhanCongModel.assignBoMonForTeacher(
        MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc
      );
      console.log('assignBoMon result:', result);
      res.json(result);

    } catch (err) {
      console.error('assignBoMon error:', err);
      // return full message for debugging (can be toned down later)
      res.status(500).json({ success: false, message: "Lỗi khi phân công: " + (err && err.message ? err.message : String(err)) });
    }
  }

  async deleteChunhiem(req, res) {
    try {
      const { MaLop, NamHoc } = req.body;
      if (!MaLop || !NamHoc)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      await PhanCongModel.deleteChunhiem(MaLop, NamHoc);
      res.json({ success: true, message: "Xóa giáo viên chủ nhiệm thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi xóa: " + (err && err.message ? err.message : String(err)) });
    }
  }

  async listAssignments(req, res) {
    try {
      const { NamHoc, KyHoc } = req.body;
      const assignments = await PhanCongModel.listAssignments(NamHoc || '2025-2026', KyHoc || '1');
      res.json({ success: true, assignments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách phân công" });
    }
  }

  async deleteBoMon(req, res) {
    try {
      const { MaGVBM, MaLop, NamHoc, HocKy, TenMonHoc } = req.body;
      if (!MaGVBM || !MaLop || !NamHoc || !HocKy || !TenMonHoc)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      await PhanCongModel.deleteBoMon(MaGVBM, MaLop, NamHoc, HocKy, TenMonHoc);
      res.json({ success: true, message: "Xóa phân công bộ môn thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi xóa: " + (err && err.message ? err.message : String(err)) });
    }
  }
}

module.exports = new PhanCongController();