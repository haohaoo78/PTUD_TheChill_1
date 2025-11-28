document.addEventListener('DOMContentLoaded', () => {
  const tabChunhiem = document.getElementById('tab-chunhiem');
  const tabBomon = document.getElementById('tab-bomon');
  const chunhiemPanel = document.getElementById('chunhiem-panel');
  const bomonPanel = document.getElementById('bomon-panel');

  tabChunhiem.addEventListener('click', () => {
    tabChunhiem.classList.add('active');
    tabBomon.classList.remove('active');
    chunhiemPanel.classList.remove('hide');
    bomonPanel.classList.add('hide');
  });

  tabBomon.addEventListener('click', () => {
    tabBomon.classList.add('active');
    tabChunhiem.classList.remove('active');
    bomonPanel.classList.remove('hide');
    chunhiemPanel.classList.add('hide');
  });

  const namHocSelect = document.getElementById('namhoc-select');
  const kyHocSelect = document.getElementById('kyhoc-select');
  const loadClassesBtn = document.getElementById('load-classes');
  const classesTableTbody = document.querySelector('#classes-table tbody');

  const khoiSelect = document.getElementById('khoi-select');
  const monSelect = document.getElementById('mon-select');
  const gvSelect = document.getElementById('gv-select');
  const loadBomonClasses = document.getElementById('load-bomon-classes');
  const classesBomonTbody = document.querySelector('#classes-bomon-table tbody');
  const assignBomonBtn = document.getElementById('assign-bomon');

  const modal = document.getElementById('assign-modal');
  const modalClose = modal.querySelector('.close');
  const modalBody = document.getElementById('modal-body');

  modalClose.onclick = () => modal.style.display = 'none';

  loadClassesBtn.addEventListener('click', loadClasses);

  async function loadClasses() {
    const NamHoc = namHocSelect.value;
    classesTableTbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    try {
      const res = await fetch('/api/phancongchunhiembomon/classes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NamHoc })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi truy vấn');
      const rows = data.classes;
      if (!rows.length) {
        classesTableTbody.innerHTML = '<tr><td colspan="5">Không có lớp</td></tr>';
        return;
      }
      classesTableTbody.innerHTML = rows.map((r, idx) => `
        <tr data-id="${r.MaLop}">
          <td>${idx+1}</td>
          <td>${r.MaLop}</td>
          <td>${r.TenLop}</td>
          <td>${r.TenGVCN || 'Chưa phân công'}</td>
          <td><button class="assign-chunhiem">Phân công</button></td>
        </tr>
      `).join('');

      classesTableTbody.querySelectorAll('.assign-chunhiem').forEach(btn => {
        btn.addEventListener('click', openAssignChunhiemModal);
      });
    } catch (err) {
      console.error(err);
      classesTableTbody.innerHTML = '<tr><td colspan="5">Lỗi khi tải danh sách</td></tr>';
    }
  }

  async function openAssignChunhiemModal(e) {
    const tr = e.target.closest('tr');
    const MaLop = tr.dataset.id;
    const NamHoc = namHocSelect.value;

    // get available teachers
    try {
      const res = await fetch('/api/phancongchunhiembomon/teachers-available', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NamHoc, MaLop })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi');
      const teachers = data.teachers;
      // fetch current gvcn
      const curRes = await fetch('/api/phancongchunhiembomon/current-gvcn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaLop, NamHoc })
      });
      const curData = await curRes.json();
      const cur = curData.current;

      modalBody.innerHTML = `
        <div>Phân công lớp: <strong>${MaLop}</strong> cho năm học <strong>${NamHoc}</strong></div>
        ${cur && cur.TenGiaoVien ? `<div>Giáo viên hiện tại: <strong>${cur.TenGiaoVien}</strong></div>` : ''}
        <div>Chọn giáo viên: <select id="modal-teacher-select">${teachers.map(t=>`<option value="${t.MaGiaoVien}">${t.TenGiaoVien}</option>`).join('')}</select></div>
        <div class="actions"><button id="confirm-assign" class="btn">Xác nhận</button></div>
      `;
      modal.style.display = 'block';
      document.getElementById('confirm-assign').onclick = async () => {
        const MaGVCN = document.getElementById('modal-teacher-select').value;
        await assignChunhiem(MaLop, NamHoc, MaGVCN);
        modal.style.display = 'none';
      };
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', err.message || 'Lỗi khi lấy danh sách giáo viên', 'error');
    }
  }

  async function assignChunhiem(MaLop, NamHoc, MaGVCN) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/assign-chunhiem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaLop, NamHoc, KyHoc: kyHocSelect.value, MaGVCN })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi phân công');
      Swal.fire('Thành công', data.message, 'success');
      await loadClasses();
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', err.message || 'Lỗi khi phân công', 'error');
    }
  }

  // BOMON logic
  getKhoiList();
  async function getKhoiList() {
    try {
      const res = await fetch('/api/phancongchunhiembomon/khoi-list', {
        method: 'POST', headers: {'Content-Type': 'application/json'}
      });
      const data = await res.json();
      if (!data.success) throw new Error('Lỗi');
      const rows = data.khoiList;
      khoiSelect.innerHTML = rows.map(k => `<option value="${k.MaKhoi}">${k.TenKhoi}</option>`).join('');
      if (rows.length) { updateSubjects(rows[0].MaKhoi); }

      khoiSelect.onchange = () => updateSubjects(khoiSelect.value);
      monSelect.onchange = () => updateTeachersBySubject(monSelect.value);
      loadBomonClasses.onclick = () => loadClassesByKhoi(khoiSelect.value);
      assignBomonBtn.onclick = () => doAssignBomon();
    } catch (err) {
      console.error(err);
    }
  }

  async function updateSubjects(MaKhoi) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/subjects', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ MaKhoi })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      monSelect.innerHTML = data.subjects.map(s => `<option value="${s}">${s}</option>`).join('');
      if(data.subjects.length) updateTeachersBySubject(data.subjects[0]);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTeachersBySubject(TenMonHoc) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/teachers-by-subject', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ TenMonHoc })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      gvSelect.innerHTML = data.teachers.map(g => `<option value="${g.MaGiaoVien}">${g.TenGiaoVien}</option>`).join('');
    } catch (err) {
      console.error(err);
    }
  }

  async function loadClassesByKhoi(MaKhoi) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/classes-by-khoi', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ MaKhoi })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const rows = data.classes;
      if (!rows.length) {
        classesBomonTbody.innerHTML = '<tr><td colspan="4">Không có lớp</td></tr>';
        return;
      }
      classesBomonTbody.innerHTML = rows.map((r, idx) => `
        <tr data-id="${r.MaLop}">
          <td>${idx+1}</td>
          <td>${r.MaLop}</td>
          <td>${r.TenLop}</td>
          <td><input type="checkbox" class="bomon-check"></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
      classesBomonTbody.innerHTML = '<tr><td colspan="4">Lỗi khi tải lớp</td></tr>';
    }
  }

  async function doAssignBomon() {
    const MaGiaoVien = gvSelect.value;
    const TenMonHoc = monSelect.value;
    const NamHoc = namHocSelect.value;
    const KyHoc = kyHocSelect.value;

    const checks = Array.from(classesBomonTbody.querySelectorAll('.bomon-check'));
    const classList = checks.filter(c => c.checked).map(c => c.closest('tr').dataset.id);
    if (!classList.length) return Swal.fire('Thông báo', 'Chưa chọn lớp', 'warning');

    try {
      const res = await fetch('/api/phancongchunhiembomon/assign-bomon', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ MaGiaoVien, ClassList: classList, NamHoc, KyHoc, TenMonHoc })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi phân công');
      Swal.fire('Thành công', 'Phân công giáo viên bộ môn thành công', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', err.message || 'Lỗi khi phân công', 'error');
    }
  }

});
