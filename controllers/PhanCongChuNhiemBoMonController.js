// controllers/PhanCongChuNhiemBoMonController.js
const PhanCongModel = require('../models/PhanCongChuNhiemBoMonModel');

class PhanCongController {

  async renderPage(req, res) {
    try {
      const maTruong = req.session.user.maTruong;
      const namHocList = await PhanCongModel.getNamHocList();
      const selectedNamHoc = namHocList[0] || '';

      const kyHocList = (await PhanCongModel.getKyHocList(selectedNamHoc))
        .map(k => k.KyHoc);

      const khoiList = await PhanCongModel.getKhoiList(maTruong);

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
      const maTruong = req.session.user.maTruong;
      const classes = await PhanCongModel.getClassesByNamHoc(NamHoc, maTruong);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách lớp" });
    }
  }

  async getAvailableTeachersForChunhiem(req, res) {
    try {
      const { NamHoc, MaLop } = req.body;
      const maTruong = req.session.user.maTruong;
      const teachers = await PhanCongModel.getAvailableTeachersForChunhiem(NamHoc || '2025-2026', MaLop, maTruong);
      res.json({ success: true, teachers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy giáo viên chủ nhiệm" });
    }
  }

  async getGVCNByClass(req, res) {
    try {
      const { MaLop, NamHoc } = req.body;
      const maTruong = req.session.user.maTruong;
      const current = await PhanCongModel.getGVCNByClass(MaLop, NamHoc || '2025-2026', maTruong);
      res.json({ success: true, current });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy giáo viên chủ nhiệm hiện tại" });
    }
  }

  async assignChunhiem(req, res) {
    try {
      const { MaLop, NamHoc, MaGVCN, KyHoc } = req.body;
      const maTruong = req.session.user.maTruong;

      if (!MaLop || !NamHoc || !MaGVCN)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      // Check học kỳ
      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc || '1');
      if (status === "Kết thúc")
        return res.status(400).json({ success: false, message: "Kỳ học đã kết thúc, không thể phân công" });

      // Verify teacher and class exist with maTruong
      const [gvRows] = await global.db.execute('SELECT MaGiaoVien FROM GiaoVien WHERE MaGiaoVien = ? AND MaTruong = ?', [MaGVCN, maTruong]);
      if (!gvRows.length)
        return res.status(400).json({ success: false, message: "Giáo viên không tồn tại hoặc không thuộc trường" });

      const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
      if (!lopRows.length)
        return res.status(400).json({ success: false, message: "Lớp không tồn tại hoặc không thuộc trường" });

      await PhanCongModel.assignChunhiem(MaLop, NamHoc, MaGVCN);
      res.json({ success: true, message: "Phân công giáo viên chủ nhiệm thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi phân công: " + (err && err.message ? err.message : String(err)) });
    }
  }

  async getKhoiList(req, res) {
    try {
      const maTruong = req.session.user.maTruong;
      const khoiList = await PhanCongModel.getKhoiList(maTruong);
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
      const maTruong = req.session.user.maTruong;
      const classes = await PhanCongModel.getClassesByKhoi(MaKhoi, maTruong);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi lấy danh sách lớp" });
    }
  }

  async getTeachersBySubject(req, res) {
    try {
      const { TenMonHoc, NamHoc, KyHoc } = req.body;
      const maTruong = req.session.user.maTruong;
      const teachers = await PhanCongModel.getTeachersBySubject(
        TenMonHoc, NamHoc || '2025-2026', KyHoc || '1', maTruong
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
        const soTietRaw = await PhanCongModel.getSubjectWeeklyCountForClass(
          MaLop, NamHoc, KyHoc, TenMonHoc
        );
        const soTiet = parseInt(soTietRaw, 10) || 0;
        addedLoad += soTiet;
      }

      const MAX_LOAD = 30;
      const canAssign = currentLoad + addedLoad <= MAX_LOAD;

      res.json({
        success: true,
        canAssign,
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

  // controllers/PhanCongChuNhiemBoMonController.js
// ... (giữ nguyên toàn bộ các hàm khác như bạn đã có)

  async assignBoMon(req, res) {
    try {
      const { MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc } = req.body;
      const maTruong = req.session.user.maTruong;
      
      console.log('assignBoMon request:', { MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc });

      if (!MaGiaoVien || !ClassList || !NamHoc || !KyHoc || !TenMonHoc)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      if (!Array.isArray(ClassList) || ClassList.length === 0)
        return res.status(400).json({ success: false, message: "Danh sách lớp không hợp lệ" });

      const status = await PhanCongModel.getHocKyStatus(NamHoc, KyHoc);
      if (status === "Kết thúc")
        return res.status(400).json({ success: false, message: "Kỳ học đã kết thúc, không thể phân công" });

      // KIỂM TRA ĐỊNH MỨC DUY NHẤT TẠI ĐÂY
      const checkRes = await fetch(`http://localhost:5000/api/phancongchunhiembomon/check-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc })
      });
      const check = await checkRes.json();

      if (!check.canAssign) {
        return res.json({
          success: false,
          message: `Vượt định mức 30 tiết (hiện tại ${check.currentLoad} + thêm ${check.addedLoad})`
        });
      }

      // Verify...
      const [gvRows] = await global.db.execute('SELECT MaGiaoVien FROM GiaoVien WHERE MaGiaoVien = ? AND MaTruong = ?', [MaGiaoVien, maTruong]);
      if (!gvRows.length)
        return res.status(400).json({ success: false, message: "Giáo viên không tồn tại hoặc không thuộc trường" });

      const [monRows] = await global.db.execute('SELECT TenMonHoc FROM MonHoc WHERE TenMonHoc = ?', [TenMonHoc]);
      if (!monRows.length)
        return res.status(400).json({ success: false, message: "Môn học không tồn tại" });

      for (const MaLop of ClassList) {
        const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
        if (!lopRows.length)
          return res.status(400).json({ success: false, message: `Lớp ${MaLop} không tồn tại hoặc không thuộc trường` });
      }

      const result = await PhanCongModel.assignBoMonForTeacher(
        MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc
      );

      console.log('assignBoMon result:', result);
      res.json(result);

    } catch (err) {
      console.error('assignBoMon error:', err);
      res.status(500).json({ success: false, message: "Lỗi khi phân công: " + (err?.message || String(err)) });
    }
  }

// ... (giữ nguyên các hàm khác)

  async deleteChunhiem(req, res) {
    try {
      const { MaLop, NamHoc } = req.body;
      const maTruong = req.session.user.maTruong;
      if (!MaLop || !NamHoc)
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

      // Verify class with maTruong
      const [lopRows] = await global.db.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
      if (!lopRows.length)
        return res.status(400).json({ success: false, message: "Lớp không tồn tại hoặc không thuộc trường" });

      await PhanCongModel.deleteChunhiem(MaLop, NamHoc);
      res.json({ success: true, message: "Xóa giáo viên chủ nhiệm thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi xóa: " + (err && err.message ? err.message : String(err)) });
    }
  }

  async listAssignments(req, res) {
    try {
      const { NamHoc = '2025-2026', KyHoc = '1' } = req.body;
      const maTruong = req.session.user.maTruong;
      const assignments = await PhanCongModel.listAssignments(NamHoc, KyHoc, maTruong);
      res.json({ success: true, assignments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách phân công" });
    }
  }

  async deleteBoMonAssign(req, res) {
    try {
      const { MaLop, MaGiaoVien, TenMonHoc, NamHoc, KyHoc } = req.body;
      const maTruong = req.session.user.maTruong;

      if (!MaLop || !MaGiaoVien || !TenMonHoc || !NamHoc || !KyHoc) {
        return res.status(400).json({ success: false, message: "Thiếu dữ liệu xóa" });
      }

      const [gvRows] = await global.db.execute(
        `SELECT MaGiaoVien FROM GiaoVien WHERE TenGiaoVien = ? AND MaTruong = ?`, [MaGiaoVien, maTruong]
      );
      if (!gvRows.length) {
        return res.status(400).json({ success: false, message: "Không tìm thấy giáo viên hoặc không thuộc trường" });
      }
      const MaGV = gvRows[0].MaGiaoVien;

      const [lopRows] = await global.db.execute(
        `SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?`, [MaLop, maTruong]
      );
      if (!lopRows.length) {
        return res.status(400).json({ success: false, message: "Không tìm thấy lớp hoặc không thuộc trường" });
      }

      // Xóa ThoiKhoaBieu trước để tránh foreign key constraint
      await global.db.execute(`
        DELETE FROM ThoiKhoaBieu
        WHERE MaGiaoVien = ? AND MaLop = ? AND TenMonHoc = ? AND NamHoc = ? AND KyHoc = ?
      `, [MaGV, MaLop, TenMonHoc, NamHoc, KyHoc]);

      const [del] = await global.db.execute(`
        DELETE FROM GVBoMon 
        WHERE MaGVBM = ? AND MaLop = ? AND BoMon = ? AND NamHoc = ? AND HocKy = ?
      `, [MaGV, MaLop, TenMonHoc, NamHoc, KyHoc]);

      if (del.affectedRows === 0) {
        return res.json({ success: false, message: "Không tìm thấy phân công để xóa" });
      }

      res.json({ success: true, message: "Xóa phân công thành công" });
    } catch (err) {
      console.error('deleteBoMonAssign error:', err);
      res.status(500).json({ success: false, message: "Lỗi khi xóa: " + err.message });
    }
  }

}

module.exports = new PhanCongController();