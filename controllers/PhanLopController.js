// controllers/PhanLopController.js
const PhanLopModel = require('../models/PhanLopModel');

class PhanLopController {
  async renderPage(req, res) {
    try {
      const khoiList = await PhanLopModel.getKhoiList();
      const namHocList = await PhanLopModel.getNamHocList();
      const selectedNamHoc = namHocList[0] || '2025-2026';
      const selectedKhoi = 'K01'; // Khối 10 mặc định

      res.render('pages/phanlophocsinh', {
        khoiList,
        namHocList,
        selectedNamHoc,
        selectedKhoi
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async getUnassignedStudents(req, res) {
    try {
      const { NamHoc, MaKhoi } = req.body;
      const students = await PhanLopModel.getUnassignedStudents(NamHoc, MaKhoi);
      res.json({ success: true, students });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  }

  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi } = req.body;
      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);
      res.json({ success: true, classes });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  }

  async autoAssign(req, res) {
    try {
      const { NamHoc, MaKhoi, MaxSize } = req.body;
      const max = parseInt(MaxSize) || 35;

      const students = await PhanLopModel.getUnassignedStudents(NamHoc, MaKhoi);
      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);

      if (!students.length) return res.json({ success: false, message: 'Không có học sinh để phân lớp' });
      if (!classes.length) return res.json({ success: false, message: 'Không có lớp nào trong khối này' });

      // Nhóm học sinh theo tổ hợp (lấy từ GhiChu hoặc MaToHop của lớp)
      const groups = {};
      students.forEach(s => {
        let key = s.ToHop?.trim() || 'KHONG_XAC_DINH';
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });

      // Tạo bản đồ lớp
      const classMap = {};
      classes.forEach(c => {
        classMap[c.MaLop] = {
          MaLop: c.MaLop,
          TenLop: c.TenLop,
          MaToHop: c.MaToHop,
          SiSo: c.SiSo || max,
          CurrentCount: c.CurrentCount || 0,
          students: []
        };
      });

      const classList = Object.values(classMap);

      // Phân bổ theo tổ hợp trước
      for (const toHop in groups) {
        const hsList = groups[toHop];
        const suitableClasses = classList.filter(c => 
          !c.MaToHop || c.MaToHop === toHop || toHop === 'KHONG_XAC_DINH'
        );

        if (suitableClasses.length === 0) continue;

        hsList.forEach(student => {
          // Tìm lớp còn chỗ
          let assigned = false;
          for (let cls of suitableClasses) {
            if (cls.students.length < max) {
              cls.students.push(student);
              assigned = true;
              break;
            }
          }
          // Nếu không tìm được lớp phù hợp → tìm lớp bất kỳ còn chỗ
          if (!assigned) {
            for (let cls of classList) {
              if (cls.students.length < max) {
                cls.students.push(student);
                break;
              }
            }
          }
        });
      }

      res.json({
        success: true,
        distribution: classMap,
        totalAssigned: students.length
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi phân lớp tự động' });
    }
  }

  async saveAssignment(req, res) {
    try {
      const { distribution } = req.body;
      const assignments = [];

      for (const maLop in distribution) {
        const students = distribution[maLop].students || [];
        students.forEach(s => {
          assignments.push({
            MaHocSinh: s.MaHocSinh,
            MaLop: maLop
          });
        });
      }

      if (!assignments.length) {
        return res.json({ success: false, message: 'Không có học sinh nào để lưu' });
      }

      await PhanLopModel.saveAssignments(assignments);
      res.json({ success: true, message: 'Phân lớp thành công!' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi lưu phân lớp' });
    }
  }

  async getStudentsInClass(req, res) {
    try {
      const { MaLop } = req.body;
      const students = await PhanLopModel.getStudentsInClass(MaLop);
      res.json({ success: true, students });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  }
}

module.exports = new PhanLopController();