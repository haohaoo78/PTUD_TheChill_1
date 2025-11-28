const PhanLopModel = require('../models/PhanLopModel');

class PhanLopController {
  async renderPage(req, res) {
    try {
      const khoiList = await PhanLopModel.getKhoiList();
      const namHocList = await PhanLopModel.getNamHocList();
      const selectedNamHoc = namHocList[0] || '';
      const defaultKhoi = (khoiList.find(k => k.MaKhoi === '10') || khoiList[0] || {}).MaKhoi || '';
      res.render('pages/phanlophocsinh', { khoiList, namHocList, selectedNamHoc, selectedKhoi: defaultKhoi });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang phân lớp');
    }
  }

  async getClassStudents(req, res) {
    try {
      const { MaLop } = req.body;
      if (!MaLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });
      const rows = await PhanLopModel.getStudentsInClass(MaLop);
      res.json({ success: true, students: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy học sinh theo lớp' });
    }
  }

  async getUnassignedStudents(req, res) {
    try {
      const { NamHoc, MaKhoi } = req.body;
      if (!NamHoc) return res.status(400).json({ success: false, message: 'Thiếu năm học' });
      const students = await PhanLopModel.getUnassignedStudents(NamHoc, MaKhoi);
      res.json({ success: true, students });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy học sinh' });
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      if (!MaKhoi) return res.status(400).json({ success: false, message: 'Thiếu khối' });
      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);
      res.json({ success: true, classes });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy lớp' });
    }
  }

  async getClassCounts(req, res) {
    try {
      const { MaKhoi } = req.body;
      if (!MaKhoi) return res.status(400).json({ success: false, message: 'Thiếu khối' });
      const rows = await PhanLopModel.getClassCounts(MaKhoi);
      res.json({ success: true, counts: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi đếm sĩ số lớp' });
    }
  }

  async autoAssign(req, res) {
    try {
      const { NamHoc, MaKhoi, MaxSize } = req.body;
      if (!NamHoc || !MaKhoi || !MaxSize) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      const students = await PhanLopModel.getUnassignedStudents(NamHoc, MaKhoi);
      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);
      if (!students.length) return res.json({ success: true, result: [], message: 'Không có học sinh để phân lớp' });
      if (!classes.length) return res.json({ success: false, message: 'Không có lớp để phân đôi' });
      // simple check capacity
      if (students.length > classes.length * MaxSize) return res.json({ success: false, message: 'Sĩ số vượt quá giới hạn' });

      // Group by ToHop (if exists in student.GhiChu or other; fallback to default)
      const groups = {};
      students.forEach(s => {
        const groupKey = (s.GhiChu || 'default').toString().trim(); // attempt: store Tổ hợp in 'GhiChu' for sample
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(s);
      });

      // auto assignment across classes: create empty arrays for each class
      const assignmentMap = {};
      classes.forEach(c => assignmentMap[c.MaLop] = []);

      const classKeys = Object.keys(assignmentMap);
      let classIndex = 0;
      for (const g in groups) {
        const arr = groups[g];
        for (const s of arr) {
          // find next class that has capacity
          let placed = false;
          for (let tryCount = 0; tryCount < classKeys.length; tryCount++) {
            const cIndex = (classIndex + tryCount) % classKeys.length;
            const cl = classKeys[cIndex];
            if (assignmentMap[cl].length < MaxSize) {
              assignmentMap[cl].push(s);
              classIndex = (cIndex + 1) % classKeys.length;
              placed = true;
              break;
            }
          }
          if (!placed) {
            return res.json({ success: false, message: 'Không thể phân hết vì giới hạn sĩ số' });
          }
        }
      }

      res.json({ success: true, distribution: assignmentMap });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi phân lớp tự động' });
    }
  }

  async saveAssignment(req, res) {
    try {
      const { assignments } = req.body; // assignments = [{ MaHocSinh, MaLop }]
      if (!assignments || !assignments.length) return res.status(400).json({ success: false, message: 'Không có dữ liệu' });
      await PhanLopModel.saveAssignments(assignments);
      res.json({ success: true, message: 'Lưu phân lớp thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lưu phân lớp' });
    }
  }
}

module.exports = new PhanLopController();