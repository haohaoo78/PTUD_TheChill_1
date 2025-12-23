// public/js/PhanLop.js
(function () {
  // Ngăn chạy nhiều lần khi inject lại
  if (window.PhanLopInitialized) return;
  window.PhanLopInitialized = false;

  console.log('PhanLop.js initialized');

  // Elements
  const khoiSelect = document.getElementById('khoi-select');
  const maxSizeInput = document.getElementById('max-size');
  const loadBtn = document.getElementById('load-students');
  const autoBtn = document.getElementById('auto-assign');
  const saveBtn = document.getElementById('save-assign');
  const studentsTbody = document.querySelector('#students-table tbody');
  const classesTbody = document.querySelector('#classes-table tbody');
  const studentsCount = document.getElementById('students-count');
  const classesCount = document.getElementById('classes-count');

  // Data
  let distribution = {};
  let currentStudents = [];
  let currentClasses = [];

  // ======================
  // Load dữ liệu
  // ======================
  const loadData = async () => {
    const MaKhoi = khoiSelect.value;
    if (!MaKhoi) {
      showMessage('Vui lòng chọn khối!', 'error');
      return;
    }

    console.log('Loading data for khoi:', MaKhoi);
    showTableLoading(studentsTbody, 7, 'Đang tải học sinh...');
    showTableLoading(classesTbody, 5, 'Đang tải lớp...');

    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/phanlophocsinh/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        }),
        fetch('/api/phanlophocsinh/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        })
      ]);

      if (!res1.ok || !res2.ok) throw new Error('Lỗi server');

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!data1.success || !data2.success) {
        throw new Error(data1.message || data2.message || 'Lỗi tải dữ liệu');
      }

      currentStudents = data1.students || [];
      currentClasses = data2.classes || [];
      distribution = {};

      renderStudents();
      renderClasses();

      const unassigned = currentStudents.filter(s => !s.MaLop || s.MaLop.trim() === '').length;
      studentsCount.textContent = `${currentStudents.length} học sinh (${unassigned} chưa phân lớp)`;
      classesCount.textContent = `${currentClasses.length} lớp`;

    } catch (err) {
      console.error(err);
      showMessage('Lỗi tải dữ liệu: ' + err.message, 'error');
      showTableEmpty(studentsTbody, 7, 'Lỗi tải dữ liệu');
      showTableEmpty(classesTbody, 5, 'Lỗi tải dữ liệu');
    }
  };

  // ======================
  // Render
  // ======================
  const renderStudents = () => {
    if (currentStudents.length === 0) {
      showTableEmpty(studentsTbody, 7, 'Không có học sinh');
      return;
    }
    studentsTbody.innerHTML = currentStudents.map((s, i) => {
      const tempClass = getAssignedClass(s.MaHocSinh);
      const currentClass = s.MaLop && s.MaLop.trim() !== '' ? s.MaLop : null;
      const displayClass = tempClass || currentClass || '—';
      const clickable = tempClass || currentClass ? `ondblclick="window.editStudent('${s.MaHocSinh}', '${tempClass || currentClass}')" style="cursor:pointer;"` : '';
      const rowClass = tempClass ? 'row-highlight' : '';
      return `
        <tr data-id="${s.MaHocSinh}" ${clickable} class="${rowClass}">
          <td>${i + 1}</td>
          <td><strong>${s.MaHocSinh}</strong></td>
          <td>${s.TenHocSinh}</td>
          <td>${s.GioiTinh}</td>
          <td>${s.TenToHop || 'Chưa chọn'}</td>
          <td>${s.TrangThai}</td>
          <td class="assigned-class">
            ${displayClass === '—' ? '—' : `<span class="badge ${tempClass ? 'badge-new' : 'badge-current'}">${displayClass}</span>`}
          </td>
        </tr>
      `;
    }).join('');
  };

  const renderClasses = () => {
    if (currentClasses.length === 0) {
      showTableEmpty(classesTbody, 5, 'Không có lớp');
      return;
    }
    classesTbody.innerHTML = currentClasses.map((c, i) => {
      const totalCount = getClassCount(c.MaLop);
      const maxSize = c.SiSo || 35;
      const percentage = (totalCount / maxSize) * 100;
      let statusClass = 'status-ok';
      if (percentage >= 100) statusClass = 'status-full';
      else if (percentage >= 80) statusClass = 'status-warning';
      const newCount = distribution[c.MaLop]?.students.length || 0;
      return `
        <tr data-id="${c.MaLop}" ondblclick="window.showClassStudents('${c.MaLop}')" style="cursor:pointer;">
          <td>${i + 1}</td>
          <td><strong>${c.MaLop}</strong></td>
          <td>${c.TenLop}${newCount > 0 ? ` <span class="badge-new-count">+${newCount}</span>` : ''}</td>
          <td>${maxSize}</td>
          <td class="current-count"><span class="${statusClass}">${totalCount}</span> / ${maxSize}</td>
        </tr>
      `;
    }).join('');
  };

  const getAssignedClass = (id) => {
    for (const lop in distribution) {
      if (distribution[lop].students.some(s => s.MaHocSinh === id)) return lop;
    }
    return null;
  };

  const getClassCount = (maLop) => {
    const cls = currentClasses.find(c => c.MaLop === maLop);
    const current = cls ? (parseInt(cls.CurrentCount) || 0) : 0;
    const added = distribution[maLop]?.students.length || 0;
    return current + added;
  };

  // ======================
  // Phân bổ tự động
  // ======================
  const autoAssign = async () => {
    const MaKhoi = khoiSelect.value;
    const MaxSize = parseInt(maxSizeInput.value) || 35;
    if (!MaKhoi) return showMessage('Chọn khối!', 'error');
    if (MaxSize < 20 || MaxSize > 50) return showMessage('Sĩ số từ 20-50', 'error');

    try {
      const res = await fetch('/api/phanlophocsinh/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi, MaxSize })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      distribution = data.distribution;
      renderStudents();
      renderClasses();
      showMessage(data.message, 'success');
    } catch (err) {
      showMessage('Lỗi phân bổ: ' + err.message, 'error');
    }
  };

  // ======================
  // Lưu phân bổ
  // ======================
  const saveAssign = async () => {
    const total = Object.values(distribution).reduce((s, d) => s + d.students.length, 0);
    if (total === 0) return showMessage('Chưa có học sinh nào được phân!', 'error');
    if (!confirm(`Lưu phân lớp cho ${total} học sinh?`)) return;

    try {
      const res = await fetch('/api/phanlophocsinh/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distribution })
      });
      const data = await res.json();
      showMessage(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        distribution = {};
        loadData();
      }
    } catch (err) {
      showMessage('Lỗi lưu!', 'error');
    }
  };

  // ======================
  // Global functions (gọi từ inline onclick)
  // ======================
  window.editStudent = (maHS, currentLop) => {
    const modal = document.getElementById('edit-modal');
    const select = document.getElementById('edit-class-select');
    const maxSize = parseInt(maxSizeInput.value) || 35;

    select.innerHTML = `<option value="">-- Bỏ phân lớp --</option>` +
      currentClasses.map(c => {
        const count = getClassCount(c.MaLop);
        const available = count < (c.SiSo || maxSize) || c.MaLop === currentLop;
        return available ? `<option value="${c.MaLop}" ${c.MaLop === currentLop ? 'selected' : ''}>${c.TenLop} (${count}/${c.SiSo || maxSize})</option>` : '';
      }).join('');

    modal.classList.add('show');

    document.getElementById('edit-confirm').onclick = () => {
      const newLop = select.value;
      if (newLop === currentLop) {
        modal.classList.remove('show');
        return;
      }
      // Xóa cũ
      if (currentLop && distribution[currentLop]) {
        distribution[currentLop].students = distribution[currentLop].students.filter(s => s.MaHocSinh !== maHS);
        if (distribution[currentLop].students.length === 0) delete distribution[currentLop];
      }
      // Thêm mới
      if (newLop) {
        if (!distribution[newLop]) {
          const cls = currentClasses.find(c => c.MaLop === newLop);
          distribution[newLop] = { TenLop: cls.TenLop, students: [] };
        }
        const student = currentStudents.find(s => s.MaHocSinh === maHS);
        if (student) distribution[newLop].students.push(student);
      }
      renderStudents();
      renderClasses();
      modal.classList.remove('show');
      showMessage('Đã cập nhật!', 'info');
    };
  };

  window.showClassStudents = async (maLop) => {
    const modal = document.getElementById('class-modal');
    const title = document.getElementById('class-modal-title');
    const body = document.getElementById('class-modal-body');
    title.textContent = `Học sinh lớp ${maLop}`;
    body.innerHTML = '<p>Đang tải...</p>';
    modal.classList.add('show');

    try {
      const res = await fetch('/api/phanlophocsinh/class-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaLop: maLop })
      });
      const data = await res.json();
      const existing = data.students || [];
      const added = distribution[maLop]?.students || [];

      let html = '<ul>';
      [...existing, ...added].forEach((s, i) => {
        const isNew = added.some(a => a.MaHocSinh === s.MaHocSinh);
        html += `<li>${i + 1}. ${s.MaHocSinh} - ${s.TenHocSinh} ${isNew ? '<span style="color:green;">(Mới)</span>' : ''}</li>`;
      });
      html += '</ul>';
      body.innerHTML = html || '<p>Chưa có học sinh</p>';
    } catch (err) {
      body.innerHTML = '<p style="color:red;">Lỗi tải dữ liệu</p>';
    }
  };

  window.closeModal = (id) => document.getElementById(id)?.classList.remove('show');

  // ======================
  // Utility
  // ======================
  const showTableLoading = (tbody, col, msg) => {
    tbody.innerHTML = `<tr><td colspan="${col}" style="text-align:center;padding:20px;">${msg}</td></tr>`;
  };
  const showTableEmpty = (tbody, col, msg) => {
    tbody.innerHTML = `<tr><td colspan="${col}" style="text-align:center;padding:20px;color:#666;">${msg}</td></tr>`;
  };
  const showMessage = (msg, type = 'info') => {
    const icon = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info';
    alert(`${icon}: ${msg}`);
  };

  // ======================
  // Events
  // ======================
  loadBtn?.addEventListener('click', loadData);
  autoBtn?.addEventListener('click', autoAssign);
  saveBtn?.addEventListener('click', saveAssign);
  khoiSelect?.addEventListener('change', () => {
    distribution = {};
    loadData();
  });

  // Load ngay khi script chạy (SPA)
  if (khoiSelect && khoiSelect.value) {
    loadData();
  }
})();