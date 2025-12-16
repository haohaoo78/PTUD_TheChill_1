// controllers/ThoiKhoaBieuController.js
const ThoiKhoaBieu = require('../models/ThoiKhoaBieuModel');

class ThoiKhoaBieuController {
  async renderPage(req, res) {
    try {
      if (!req.session.user || req.session.user.loaiTaiKhoan !== 'GiaoVu' || !req.session.user.maTruong) {
        return res.status(403).send('Bạn không có quyền truy cập chức năng này (chỉ dành cho Giáo vụ).');
      }

      const MaTruong = req.session.user.maTruong;

      const khoiList = await ThoiKhoaBieu.getKhoiList(MaTruong);
      const firstKhoi = khoiList[0]?.MaKhoi || '';
      const classes = await ThoiKhoaBieu.getClassesByKhoi(firstKhoi, MaTruong);
      const firstClass = classes[0]?.MaLop || '';

      const namHocList = await ThoiKhoaBieu.getNamHocList();
      const selectedNamHoc = namHocList[0] || '';
      const kyHocListObj = await ThoiKhoaBieu.getKyHocList(selectedNamHoc);
      const kyHocList = kyHocListObj.map(k => k.KyHoc);
      const selectedKyHoc = kyHocList[0] || '';
      const selectedNamHocStart = kyHocListObj[0]?.NgayBatDau || '2025-08-01';

      res.render('pages/thoikhoabieu', {
        khoiList,
        classes,
        subjects: [],
        namHocList,
        kyHocList,
        timetable: {},
        selectedKhoi: firstKhoi,
        selectedClass: firstClass,
        selectedNamHoc,
        selectedKyHoc,
        selectedLoaiTKB: 'Chuan',
        selectedNamHocStart,
        statusMessage: ''
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang');
    }
  }

  async getLopTheoKhoi(req, res) {
    try {
      if (!req.session.user || req.session.user.loaiTaiKhoan !== 'Giáo vụ' || !req.session.user.maTruong) {
        return res.status(403).json({ error: 'Không có quyền truy cập.' });
      }

      const MaTruong = req.session.user.maTruong;

      const { MaKhoi } = req.body;
      if (!MaKhoi) return res.json([]);

      const classes = await ThoiKhoaBieu.getClassesByKhoi(MaKhoi, MaTruong);
      res.json(classes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi truy vấn lớp theo khối' });
    }
  }

  async getKyHocList(req, res) {
    try {
      const { NamHoc } = req.body;
      const list = await ThoiKhoaBieu.getKyHocList(NamHoc);
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy học kỳ' });
    }
  }

  async getSubjectsByClass(req, res) {
    try {
      const { MaLop, NamHoc, KyHoc } = req.body;
      const subjects = await ThoiKhoaBieu.getSubjectsWithTeacherByClass(MaLop, NamHoc, KyHoc);
      res.json(subjects);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy môn đã phân công giáo viên cho lớp' });
    }
  }

  async getTeacher(req, res) {
    try {
      const { MaLop, TenMonHoc } = req.body;
      const gv = await ThoiKhoaBieu.getTeacher(MaLop, TenMonHoc);
      res.json(gv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy giáo viên' });
    }
  }

  async getAvailableTeachersForSlot(req, res) {
    try {
      const { MaLop, NamHoc, KyHoc, Thu, TietHoc, TenMonHoc } = req.body;
      if (!TenMonHoc || !NamHoc || !KyHoc || (Thu === undefined || Thu === null) || (TietHoc === undefined || TietHoc === null)) return res.status(400).json({ error: 'Thiếu tham số' });
      let normalizedThu = Thu;
      if (typeof normalizedThu === 'string') normalizedThu = normalizedThu === 'CN' ? 8 : parseInt(normalizedThu, 10);
      const ThuNum = Number(normalizedThu);
      const TietNum = Number(TietHoc);
      const rows = await ThoiKhoaBieu.getAvailableTeachersForSlot(TenMonHoc, NamHoc, KyHoc, ThuNum, TietNum, MaLop);
      res.json({ success: true, teachers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy giáo viên khả dụng' });
    }
  }

  async getAll(req, res) {
    try {
      let { MaLop, NamHoc, KyHoc, LoaiTKB } = req.body;
      if (!MaLop || !NamHoc)
        return res.status(400).json({ error: 'Thiếu lớp hoặc năm học' });

      LoaiTKB = LoaiTKB || 'Chuan';
      const kyHocListObj = await ThoiKhoaBieu.getKyHocList(NamHoc);
      const kyHocList = kyHocListObj.map(k => k.KyHoc);
      if (!KyHoc || !kyHocList.includes(KyHoc)) KyHoc = kyHocList[0] || '';
      const selectedNamHocStart =
        kyHocListObj.find(k => k.KyHoc === KyHoc)?.NgayBatDau || '2025-08-01';

      const subjects = await ThoiKhoaBieu.getSubjectsWithTeacherByClass(MaLop, NamHoc, KyHoc);
      const timetable = await ThoiKhoaBieu.getGrid(MaLop, LoaiTKB, NamHoc, KyHoc);

      res.json({ timetable, subjects, selectedNamHocStart, statusMessage: 'Đã tải dữ liệu' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi tải TKB' });
    }
  }

  async saveAll(req, res) {
    try {
      const { timetable = [], selectedNamHocStart } = req.body; 
      if (!selectedNamHocStart) 
        return res.status(400).json({ error: 'Thiếu ngày bắt đầu học kỳ' });

      // Gọi luôn updateMultiple, kể cả timetable rỗng
      await ThoiKhoaBieu.updateMultiple(timetable, selectedNamHocStart);

      res.json({ message: 'Lưu thời khóa biểu thành công!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lưu TKB' });
    }
  }

  async resetWeek(req, res) {
    try {
      const { MaLop, NamHoc, KyHoc, LoaiTKB } = req.body;
      if(!LoaiTKB || LoaiTKB==='Chuan') return res.status(400).json({ error:'Không thể reset TKB chuẩn' });
      await ThoiKhoaBieu.resetWeek(MaLop, NamHoc, KyHoc, LoaiTKB);
      res.json({ message:`Đã reset ${LoaiTKB} về TKB chuẩn` });
    } catch(err) {
      console.error(err);
      res.status(500).json({ error:'Lỗi khi reset tuần' });
    }
  }

  async deleteCell(req, res) {
    try {
      const { MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc, TenMonHoc } = req.body;
      const result = await ThoiKhoaBieu.deleteCell(MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc);

      if (!result.affectedRows || result.affectedRows === 0) {
        return res.json({ error: 0, message: 'Không có dữ liệu để xóa, cell đã trống' });
      }

      const SoTietTuan = TenMonHoc
        ? await ThoiKhoaBieu.countSubjectWeeklyInDB(MaLop, NamHoc, KyHoc, TenMonHoc, LoaiTKB)
        : 0;

      res.json({ error: 0, message: 'Đã xóa môn học khỏi CSDL', SoTietTuan });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 1, message: 'Lỗi khi xóa cell' });
    }
  }

  async checkSubjectLimit(req, res) {
    try {
      const { cells } = req.body;

      const cellCount = {};
      for (const c of cells) {
        if (!c.TenMonHoc) continue;
        cellCount[c.TenMonHoc] = (cellCount[c.TenMonHoc] || 0) + 1;
      }

      const warnings = [];

      for (const [TenMonHoc, soHienTai] of Object.entries(cellCount)) {
        const soToiDa = await ThoiKhoaBieu.getSubjectWeeklyLimit(TenMonHoc);
        warnings.push({ TenMonHoc, soHienTai, soToiDa });
      }

      return res.json({
        status: 'ok',
        warnings
      });
    } catch (err) {
      console.error("Lỗi checkSubjectLimit:", err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new ThoiKhoaBieuController();