document.addEventListener('DOMContentLoaded', () => {
  const namHocSelect = document.getElementById('namhoc-select');
  const khoiSelect = document.getElementById('khoi-select');
  const loadStudentsBtn = document.getElementById('load-students');
  const autoAssignBtn = document.getElementById('auto-assign');
  const saveAssignBtn = document.getElementById('save-assign');
  const maxSizeInput = document.getElementById('max-size');
  const studentsTable = document.querySelector('#students-table tbody');
  const classesTable = document.querySelector('#classes-table tbody');

  let students = [];
  let classes = [];
  let distribution = {}; // mapping MaLop -> array of students

  loadStudentsBtn.onclick = loadStudents;
  autoAssignBtn.onclick = autoAssign;
  saveAssignBtn.onclick = saveAssign;

  // initial load
  loadStudents();

  async function loadStudents() {
    studentsTable.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
    classesTable.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    try {
      const NamHoc = namHocSelect.value;
      const MaKhoi = khoiSelect.value;
      // students
      const resS = await fetch('/api/phanlophocsinh/students', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ NamHoc, MaKhoi }) });
      const dataS = await resS.json();
      if (!dataS.success) throw new Error(dataS.message || 'Lỗi tải danh sách học sinh');
      students = dataS.students;

      // classes
      const resC = await fetch('/api/phanlophocsinh/classes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaKhoi }) });
      const dataC = await resC.json();
      if (!dataC.success) throw new Error(dataC.message || 'Lỗi tải lớp');
      classes = dataC.classes;

      if (!students.length) studentsTable.innerHTML = '<tr><td colspan="6">Không có học sinh để phân lớp</td></tr>';
      else {
        studentsTable.innerHTML = students.map((s,i)=>`<tr data-id="${s.MaHocSinh}"><td>${i+1}</td><td>${s.MaHocSinh}</td><td>${s.TenHocSinh}</td><td>${s.GhiChu||'—'}</td><td>${s.TrangThai}</td><td>${s.MaLop||'—'}</td></tr>`).join('');
        // add manual assign click
        studentsTable.querySelectorAll('tr').forEach(r => r.addEventListener('dblclick', openManualAssignModal));
      }
      

      if (!classes.length) classesTable.innerHTML = '<tr><td colspan="5">Không có lớp</td></tr>';
      else classesTable.innerHTML = classes.map((c,i)=>`<tr data-id="${c.MaLop}"><td>${i+1}</td><td>${c.MaLop}</td><td>${c.TenLop}</td><td>${c.SiSo||0}</td><td class="class-students">0</td></tr>`).join('');
      // add double click to show class students
      classesTable.querySelectorAll('tr').forEach(r => r.addEventListener('dblclick', openClassStudentsModal));

      // populate current count for each class
      try {
        const resCounts = await fetch('/api/phanlophocsinh/class-counts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaKhoi }) });
        const dataCounts = await resCounts.json();
        if (dataCounts.success) {
          dataCounts.counts.forEach(c => {
            const tr = classesTable.querySelector(`tr[data-id="${c.MaLop}"]`);
            if (tr) tr.querySelector('.class-students').textContent = c.CurrentCount || 0;
          });
        }
      } catch (err) { console.error("Couldn't get counts", err); }

    } catch (err) {
      console.error(err);
      studentsTable.innerHTML = '<tr><td colspan="6">Lỗi khi tải dữ liệu</td></tr>';
      classesTable.innerHTML = '<tr><td colspan="5">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  async function autoAssign() {
    try {
      const NamHoc = namHocSelect.value;
      const MaKhoi = khoiSelect.value;
      const MaxSize = parseInt(maxSizeInput.value, 10) || 0;
      if (!MaxSize) return alert('Vui lòng nhập sĩ số tối đa');
      if (!classes.length) return alert('Không có lớp để phân bổ');
      const res = await fetch('/api/phanlophocsinh/auto-assign', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ NamHoc, MaKhoi, MaxSize }) });
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Lỗi phân lớp');
      distribution = data.distribution;
      // refresh UI: show count per class and the assigned students order
      Object.keys(distribution).forEach(cl => {
        const tr = classesTable.querySelector(`tr[data-id="${cl}"]`);
        if (tr) {
          tr.querySelector('.class-students').textContent = distribution[cl].length;
        }
      });

      // optionally show assigned class next to each student row
      studentsTable.querySelectorAll('tr').forEach(r => {
        const id = r.dataset.id;
        let assigned = '—';
        for (const cl in distribution) {
          if (distribution[cl].some(s => s.MaHocSinh === id)) { assigned = cl; break; }
        }
        r.children[5].textContent = assigned;
      });

      alert('Phân lớp tự động hoàn thành (chưa lưu). Kiểm tra và bấm Lưu để cập nhật.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi phân lớp');
    }
  }

  async function openManualAssignModal(e) {
    const tr = e.target.closest('tr');
    const MaHocSinh = tr.dataset.id;
    // show choose class modal (simple prompt for now)
    const classOptions = classes.map(c => `${c.MaLop} (${c.SiSo || 0})`);
    const selected = prompt(`Chọn lớp (mã):\n${classOptions.join('\n')}`);
    if (!selected) return;
    // validate selected class
    const found = classes.find(c => c.MaLop === selected);
    if (!found) return alert('Lớp không hợp lệ');
    // ensure capacity: count current assigned + distribution assigned
    const assignedCount = (distribution[found.MaLop] || []).length;
    const currentCount = await getClassCurrentCount(found.MaLop);
    const MaxSize = parseInt(maxSizeInput.value, 10) || 0;
    if (currentCount + assignedCount + 1 > MaxSize) return alert('Sĩ số lớp vượt quá giới hạn');
    // move student: remove from previous assigned class (if any)
    for (const cl in distribution) {
      distribution[cl] = distribution[cl].filter(s => s.MaHocSinh !== MaHocSinh);
    }
    if (!distribution[found.MaLop]) distribution[found.MaLop] = [];
    // find student object
    const sObj = students.find(s => s.MaHocSinh === MaHocSinh);
    distribution[found.MaLop].push(sObj);
    // update UI
    tr.children[5].textContent = found.MaLop;
    const trClass = classesTable.querySelector(`tr[data-id="${found.MaLop}"]`);
    if (trClass) trClass.querySelector('.class-students').textContent = distribution[found.MaLop].length;
    alert('Chuyển lớp tạm thời thành công (chưa lưu)');
  }

  async function getClassCurrentCount(MaLop) {
    try {
      const res = await fetch('/api/phanlophocsinh/class-counts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaKhoi: khoiSelect.value }) });
      const data = await res.json();
      if (!data.success) return 0;
      const r = data.counts.find(rc => rc.MaLop === MaLop);
      return r?.CurrentCount || 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  async function saveAssign() {
    try {
      const assignments = [];
      for (const MaLop in distribution) {
        for (const s of distribution[MaLop]) {
          assignments.push({ MaHocSinh: s.MaHocSinh, MaLop });
        }
      }
      if (!assignments.length) return alert('Không có phân lớp để lưu');
      const res = await fetch('/api/phanlophocsinh/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ assignments }) });
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Lỗi khi lưu');
      alert('Lưu phân lớp thành công');
      await loadStudents();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi khi lưu phân lớp');
    }
  }

  // class modal
  const classModal = document.getElementById('class-modal');
  const classModalBody = document.getElementById('class-modal-body');
  const classModalTitle = document.getElementById('class-modal-title');
  if (classModal) {
    const classModalClose = classModal.querySelector('.close');
    if (classModalClose) classModalClose.onclick = () => (classModal.style.display = 'none');
  }

  async function openClassStudentsModal(e) {
    const tr = e.target.closest('tr');
    const MaLop = tr?.dataset?.id;
    if (!MaLop) return;
    if (classModalTitle) classModalTitle.textContent = MaLop;
    classModalBody.innerHTML = 'Đang tải...';
    if (classModal) classModal.style.display = 'block';
    try {
      const res = await fetch('/api/phanlophocsinh/class-students', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaLop }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi');
      if (!data.students.length) classModalBody.innerHTML = '<p>Không có học sinh trong lớp</p>';
      else {
        classModalBody.innerHTML = `<ul>${data.students.map(s => `<li>${s.MaHocSinh} - ${s.TenHocSinh} - ${s.TrangThai}</li>`).join('')}</ul>`;
      }
    } catch (err) {
      console.error(err);
      classModalBody.innerHTML = `Lỗi: ${err.message}`;
    }
  }

});