const PhanLopModel = require('../models/PhanLopModel');

class PhanLopController {
  // Render trang phân lớp
  async renderPage(req, res) {
    try {
      const khoiList = await PhanLopModel.getKhoiList();
      const selectedKhoi = 'K01';
      res.render('pages/phanlophocsinh', { khoiList, selectedKhoi });
    } catch (err) {
      console.error('❌ Error rendering page:', err);
      res.status(500).send('Lỗi server');
    }
  }

  // API lấy học sinh theo khối
  async getStudentsByKhoi(req, res) {
    try {
      const { MaKhoi = 'K01' } = req.body;
      console.log('📥 Request get students for khoi:', MaKhoi, 'Body:', req.body);
      const students = await PhanLopModel.getStudentsByKhoi(MaKhoi);
      console.log(`📤 Returning ${students.length} students for khoi ${MaKhoi}`);
      res.json({ success: true, students });
    } catch (err) {
      console.error('❌ Error getting students:', err);
      res.status(500).json({ success: false, message: 'Lỗi lấy danh sách học sinh: ' + err.message });
    }
  }

  // API lấy danh sách lớp theo khối
  async getClassesByKhoi(req, res) {
    try {
      const { MaKhoi = 'K01' } = req.body;
      console.log('📥 Request get classes for khoi:', MaKhoi, 'Body:', req.body);
      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);
      console.log(`📤 Returning ${classes.length} classes for khoi ${MaKhoi}`);
      res.json({ success: true, classes });
    } catch (err) {
      console.error('❌ Error getting classes:', err);
      res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lớp: ' + err.message });
    }
  }

  // Các method khác giữ nguyên (autoAssign, saveAssignment, getStudentsInClass, manualAssign)
  async autoAssign(req, res) {
    try {
      const { MaKhoi, MaxSize } = req.body;
      const max = parseInt(MaxSize) || 35;
      console.log('⚡ Auto assign request:', { MaKhoi, MaxSize: max });

      if (max < 20 || max > 50) {
        return res.json({ success: false, message: 'Sĩ số tối đa phải từ 20-50 học sinh' });
      }

      const allStudents = await PhanLopModel.getStudentsByKhoi(MaKhoi);
      console.log(`📊 Total students in khoi: ${allStudents.length}`);

      const studentsToAssign = allStudents.filter(s => !s.MaLop || s.MaLop.trim() === '');
      console.log(`📊 Students to assign: ${studentsToAssign.length}`);

      const classes = await PhanLopModel.getClassesByKhoi(MaKhoi);
      console.log(`📊 Classes available: ${classes.length}`);

      if (studentsToAssign.length === 0) {
        return res.json({ success: false, message: 'Không có học sinh chưa phân lớp trong khối này' });
      }
      if (classes.length === 0) {
        return res.json({ success: false, message: 'Không có lớp nào trong khối này' });
      }

      const normalizeToHop = (str) => {
        if (!str || str.trim() === '' || str.trim() === 'Chưa chọn') {
          return null;
        }
        return str.trim();
      };

      const groups = {};
      studentsToAssign.forEach(s => {
        const key = normalizeToHop(s.MaToHop) || 'KHONG_TO_HOP';
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });
      console.log('📊 Student groups by ToHop:', Object.keys(groups).map(k => `${k}: ${groups[k].length}`));

      const classMap = {};
      classes.forEach(c => {
        classMap[c.MaLop] = {
          ...c,
          maxSize: c.SiSo > 0 ? c.SiSo : max,
          current: parseInt(c.CurrentCount) || 0,
          students: [],
          toHop: normalizeToHop(c.MaToHop)
        };
      });
      const classList = Object.values(classMap);
      console.log('📊 Class capacity:', classList.map(c => `${c.MaLop}: ${c.current}/${c.maxSize}`));

      let totalAssigned = 0;
      let notAssigned = [];
      for (const toHop in groups) {
        const hsList = groups[toHop];
        console.log(`\n🔄 Processing group ${toHop} (${hsList.length} students)...`);

        const suitableClasses = classList
          .filter(c => {
            if (c.toHop === toHop) return true;
            if (c.toHop === null) return true;
            if (toHop === 'KHONG_TO_HOP') return true;
            return false;
          })
          .sort((a, b) => {
            if (a.toHop === toHop && b.toHop !== toHop) return -1;
            if (b.toHop === toHop && a.toHop !== toHop) return 1;
            return (a.current + a.students.length) - (b.current + b.students.length);
          });

        hsList.forEach(student => {
          let assigned = false;
          for (let cls of suitableClasses) {
            if (cls.current + cls.students.length < cls.maxSize) {
              cls.students.push(student);
              assigned = true;
              totalAssigned++;
              console.log(` ✅ ${student.MaHocSinh} -> ${cls.MaLop}`);
              break;
            }
          }

          if (!assigned) {
            const anyClass = classList
              .filter(c => c.current + c.students.length < c.maxSize)
              .sort((a, b) => (a.current + a.students.length) - (b.current + b.students.length))[0];
            if (anyClass) {
              anyClass.students.push(student);
              assigned = true;
              totalAssigned++;
              console.log(` ⚠️ ${student.MaHocSinh} -> ${anyClass.MaLop} (fallback)`);
            }
          }

          if (!assigned) {
            console.warn(` ❌ Cannot assign: ${student.MaHocSinh} - ${student.TenHocSinh}`);
            notAssigned.push(student);
          }
        });
      }

      const distribution = {};
      for (const cls of classList) {
        if (cls.students.length > 0) {
          distribution[cls.MaLop] = {
            TenLop: cls.TenLop,
            students: cls.students
          };
        }
      }

      console.log(`\n✅ Assignment complete: ${totalAssigned}/${studentsToAssign.length} students assigned`);
      res.json({
        success: true,
        distribution,
        totalAssigned,
        totalStudents: studentsToAssign.length,
        notAssigned: notAssigned.length,
        message: `Đã phân bổ ${totalAssigned}/${studentsToAssign.length} học sinh${notAssigned.length > 0 ? ` (${notAssigned.length} không phân được)` : ''}`
      });
    } catch (err) {
      console.error('❌ Error auto assign:', err);
      res.status(500).json({ success: false, message: 'Lỗi phân lớp tự động: ' + err.message });
    }
  }

  async saveAssignment(req, res) {
    try {
      const { distribution } = req.body;
      const assignments = [];
      for (const maLop in distribution) {
        const students = distribution[maLop].students || [];
        students.forEach(s => {
          assignments.push({ MaHocSinh: s.MaHocSinh, MaLop: maLop });
        });
      }
      console.log(`💾 Saving ${assignments.length} assignments...`);
      if (assignments.length === 0) {
        return res.json({ success: false, message: 'Không có học sinh nào để lưu' });
      }
      await PhanLopModel.saveAssignments(assignments);
      res.json({ success: true, message: `✅ Đã lưu phân lớp thành công cho ${assignments.length} học sinh!` });
    } catch (err) {
      console.error('❌ Error saving assignment:', err);
      res.status(500).json({ success: false, message: 'Lỗi lưu phân lớp: ' + err.message });
    }
  }

  async getStudentsInClass(req, res) {
    try {
      const { MaLop } = req.body;
      console.log('📥 Request students in class:', MaLop);
      const students = await PhanLopModel.getStudentsInClass(MaLop);
      res.json({ success: true, students });
    } catch (err) {
      console.error('❌ Error getting students in class:', err);
      res.status(500).json({ success: false, message: 'Lỗi lấy danh sách học sinh: ' + err.message });
    }
  }

  async manualAssign(req, res) {
    try {
      const { MaHocSinh, MaLop } = req.body;
      console.log('✏️ Manual assign:', { MaHocSinh, MaLop });
      if (!MaHocSinh) {
        return res.json({ success: false, message: 'Thiếu mã học sinh' });
      }
      const updated = await PhanLopModel.updateStudentClass(MaHocSinh, MaLop);
      if (updated) {
        res.json({ success: true, message: '✅ Cập nhật lớp thành công' });
      } else {
        res.json({ success: false, message: '❌ Không tìm thấy học sinh' });
      }
    } catch (err) {
      console.error('❌ Error manual assign:', err);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật: ' + err.message });
    }
  }
}

module.exports = new PhanLopController();