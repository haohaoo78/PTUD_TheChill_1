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
      if (!teachers.length) {
        modalBody.innerHTML = `<div>Phân công lớp: <strong>${MaLop}</strong> cho năm học <strong>${NamHoc}</strong></div><div>Không còn giáo viên chủ nhiệm phù hợp. Vui lòng chọn lớp khác.</div>`;
        modal.style.display = 'block';
        return;
      }
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
        <div>Chọn giáo viên: <select id="modal-teacher-select">${teachers.map(t=>`<option value="${t.MaGiaoVien}">${t.TenGiaoVien}</option>`).join('')}</select> <span id="modal-gv-load" style="margin-left:10px;color:#666;font-size:12px"></span></div>
        <div class="actions"><button id="confirm-assign" class="btn">Xác nhận</button></div>
      `;
      modal.style.display = 'block';
      const modalSel = document.getElementById('modal-teacher-select');
      const modalLoad = document.getElementById('modal-gv-load');
      modalSel.onchange = async () => {
        const MaGVCN = modalSel.value;
        if (!MaGVCN) { if (modalLoad) modalLoad.textContent = ''; return; }
        try {
          const resLoad = await fetch('/api/phancongchunhiembomon/teacher-load', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaGiaoVien: MaGVCN, NamHoc, KyHoc: kyHocSelect.value }) });
          const dLoad = await resLoad.json();
          if (dLoad.success) modalLoad.textContent = `Số tiết hiện tại: ${dLoad.load}`;
        } catch (err) { console.error('Lỗi lấy số tiết GV', err); }
      };

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
      monSelect.onchange = () => { updateTeachersBySubject(monSelect.value); updateClassSubjectCounts(); };
      namHocSelect.onchange = () => checkHocKy();
      kyHocSelect.onchange = () => checkHocKy();
      // initial check for current NamHoc/KyHoc
      setTimeout(() => checkHocKy(), 150);
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
        body: JSON.stringify({ TenMonHoc, NamHoc: namHocSelect.value, KyHoc: kyHocSelect.value })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      if (!data.teachers.length) {
        gvSelect.innerHTML = '<option value="">-- Không có giáo viên phù hợp --</option>';
        document.getElementById('gv-load').textContent = '';
        return;
      }
      gvSelect.innerHTML = data.teachers.map(g => `<option value="${g.MaGiaoVien}">${g.TenGiaoVien}</option>`).join('');
      // show teacher load when selecting teacher
      const gvLoadLabel = document.getElementById('gv-load');
      if (gvLoadLabel) gvLoadLabel.textContent = '';
      gvSelect.onchange = async () => {
        const MaGiaoVien = gvSelect.value;
        if (!MaGiaoVien) { if (gvLoadLabel) gvLoadLabel.textContent = ''; return; }
        try {
          const resLoad = await fetch('/api/phancongchunhiembomon/teacher-load', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaGiaoVien, NamHoc: namHocSelect.value, KyHoc: kyHocSelect.value }) });
          const dLoad = await resLoad.json();
          if (dLoad.success) {
            if (gvLoadLabel) gvLoadLabel.textContent = `Số tiết hiện tại: ${dLoad.load}`;
          }
        } catch (err) { console.error('Lỗi lấy số tiết GV', err); }
      };
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
        classesBomonTbody.innerHTML = '<tr><td colspan="5">Không có lớp</td></tr>';
        return;
      }
      classesBomonTbody.innerHTML = rows.map((r, idx) => `
        <tr data-id="${r.MaLop}">
          <td>${idx+1}</td>
          <td>${r.MaLop}</td>
          <td>${r.TenLop}</td>
          <td><input type="checkbox" class="bomon-check"></td>
          <td class="subject-count" data-id="${r.MaLop}">-</td>
        </tr>
      `).join('');
      // populate subject counts for displayed classes
      setTimeout(() => updateClassSubjectCounts(), 100);
    } catch (err) {
      console.error(err);
      classesBomonTbody.innerHTML = '<tr><td colspan="5">Lỗi khi tải lớp</td></tr>';
    }
  }

  async function updateClassSubjectCounts() {
    try {
      const rows = Array.from(classesBomonTbody.querySelectorAll('tr')).map(tr => tr.dataset.id).filter(Boolean);
      if (!rows.length) return;
      const res = await fetch('/api/phancongchunhiembomon/subject-counts', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ClassList: rows, NamHoc: namHocSelect.value, KyHoc: kyHocSelect.value, TenMonHoc: monSelect.value })
      });
      const data = await res.json();
      if (!data.success) return;
      data.counts.forEach(c => {
        const el = classesBomonTbody.querySelector(`.subject-count[data-id="${c.MaLop}"]`);
        if (el) el.innerText = c.count || 0;
      });
    } catch (err) {
      console.error('Lỗi khi lấy số tiết của lớp', err);
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
      // pre-check assignment load
      const checkRes = await fetch('/api/phancongchunhiembomon/check-assign', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaGiaoVien, ClassList: classList, NamHoc, KyHoc, TenMonHoc })
      });
      const checkData = await checkRes.json();
      if (!checkData.success) throw new Error(checkData.message || 'Lỗi khi kiểm tra phân công');
      if (!checkData.canAssign) {
        return Swal.fire('Không thể phân công', `Số tiết sau khi gán: ${checkData.currentLoad + checkData.addedLoad} > ${checkData.MAX_LOAD}`, 'warning');
      }

      const res = await fetch('/api/phancongchunhiembomon/assign-bomon', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ MaGiaoVien, ClassList: classList, NamHoc, KyHoc, TenMonHoc })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi phân công');
      Swal.fire('Thành công', 'Phân công giáo viên bộ môn thành công', 'success');
      // reload class list and clear selections
      await loadClassesByKhoi(khoiSelect.value);
      updateTeachersBySubject(TenMonHoc);
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', err.message || 'Lỗi khi phân công', 'error');
    }
  }

});
