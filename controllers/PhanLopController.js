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

      // Chuẩn hóa ToHop: nếu là "Không có" → coi như không có tổ hợp
      const normalizeToHop = (str) => (str && str.trim() !== 'Không có' && str.trim() !== '') ? str.trim() : null;

      // Nhóm học sinh theo tổ hợp
      const groups = {};
      students.forEach(s => {
        const key = normalizeToHop(s.ToHop) || 'KHONG_TO_HOP';
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });

      // Bản đồ lớp
      const classMap = {};
      classes.forEach(c => {
        classMap[c.MaLop] = {
          ...c,
          maxSize: c.SiSo > 0 ? c.SiSo : max,
          current: c.CurrentCount || 0,
          students: [],
          toHop: normalizeToHop(c.MaToHop)
        };
      });

      const classList = Object.values(classMap);

      // Ưu tiên phân học sinh có tổ hợp vào lớp đúng tổ hợp
      for (const toHop in groups) {
        const hsList = groups[toHop];
        const suitableClasses = classList.filter(c =>
          c.toHop === null || c.toHop === toHop || toHop === 'KHONG_TO_HOP'
        ).sort((a, b) => a.current - b.current); // cân bằng sĩ số

        const fallbackClasses = classList.filter(c => c.toHop === null || toHop === 'KHONG_TO_HOP'
        ).sort((a, b) => a.current - b.current);

        hsList.forEach(student => {
          let assigned = false;

          // Ưu tiên lớp đúng tổ hợp
          for (let cls of suitableClasses) {
            if (cls.current + cls.students.length < cls.maxSize) {
              cls.students.push(student);
              assigned = true;
              break;
            }
          }

          // Nếu không được → lớp không ràng buộc tổ hợp
          if (!assigned) {
            for (let cls of fallbackClasses) {
              if (cls.current + cls.students.length < cls.maxSize) {
                cls.students.push(student);
                assigned = true;
                break;
              }
            }
          }

          // Vẫn chưa được → lớp bất kỳ còn chỗ
          if (!assigned) {
            const anyClass = classList
              .filter(c => c.current + c.students.length < c.maxSize)
              .sort((a, b) => (a.current + a.students.length) - (b.current + b.students.length))[0];
            if (anyClass) {
              anyClass.students.push(student);
              assigned = true;
            }
          }
        });
      }

      // Chuẩn bị dữ liệu trả về
      const distribution = {};
      let totalAssigned = 0;
      for (const cls of classList) {
        distribution[cls.MaLop] = {
          TenLop: cls.TenLop,
          students: cls.students
        };
        totalAssigned += cls.students.length;
      }

      res.json({
        success: true,
        distribution,
        totalAssigned,
        message: `Đã phân bổ ${totalAssigned} học sinh`
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