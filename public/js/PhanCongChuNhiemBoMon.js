// public/js/PhanCongChuNhiemBoMon.js
function initPhanCong() {
  if (window.initPhanCongDone) return;
  window.initPhanCongDone = true;

  // ==================== DOM References ====================
  const tabChunhiem = document.getElementById('tab-chunhiem');
  const tabBomon = document.getElementById('tab-bomon');
  const tabDanhsach = document.getElementById('tab-danhsach');
  const chunhiemPanel = document.getElementById('chunhiem-panel');
  const bomonPanel = document.getElementById('bomon-panel');
  const danhsachPanel = document.getElementById('danhsach-panel');

  const namHocSelect = document.getElementById('namhoc-select');
  const kyHocSelect = document.getElementById('kyhoc-select');
  const classesTableTbody = document.querySelector('#classes-table tbody');

  const khoiSelect = document.getElementById('khoi-select');
  const monSelect = document.getElementById('mon-select');
  const gvSelect = document.getElementById('gv-select');
  const classesBomonTbody = document.querySelector('#classes-bomon-table tbody');
  const assignBomonBtn = document.getElementById('assign-bomon');

  // Filter references
  const filterKhoiSelect = document.getElementById('filter-khoi-select');
  const filterMonSelect = document.getElementById('filter-mon-select');
  const filterGvSelect = document.getElementById('filter-gv-select');
  const filterBtn = document.getElementById('filter-btn');
  const assignmentTableTbody = document.querySelector('#assignment-table tbody');

  const modal = document.getElementById('assign-modal');
  const modalClose = modal?.querySelector('.close');
  const modalBody = document.getElementById('modal-body');

  // ==================== Helper ====================
  const escapeHtml = (str = '') => String(str).replace(/[&<>"'`=\/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
  })[s] || s);

  const showModal = (html) => {
    if (modalBody) modalBody.innerHTML = html;
    if (modal) modal.style.display = 'block';
  };

  if (modalClose) {
    modalClose.onclick = () => modal.style.display = 'none';
  }
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // ==================== Tab Switching ====================
  tabChunhiem?.addEventListener('click', () => {
    tabChunhiem.classList.add('active');
    tabBomon.classList.remove('active');
    chunhiemPanel?.classList.remove('hide');
    bomonPanel?.classList.add('hide');
    loadClasses(); // Auto load khi vào tab Chủ nhiệm
  });

  tabBomon?.addEventListener('click', () => {
    tabBomon.classList.add('active');
    tabChunhiem.classList.remove('active');
    bomonPanel?.classList.remove('hide');
    chunhiemPanel?.classList.add('hide');
    getKhoiList(); // Load khối khi vào tab Bộ môn
    loadAssignmentFilters(); // Load danh sách bộ môn khi vào tab
  });

  tabDanhsach?.addEventListener('click', () => {
    tabDanhsach.classList.add('active');
    tabChunhiem.classList.remove('active');
    tabBomon.classList.remove('active');
    danhsachPanel?.classList.remove('hide');
    chunhiemPanel?.classList.add('hide');
    bomonPanel?.classList.add('hide');
    loadAssignmentFilters(); // Load filters khi vào tab danh sách
  });

  // ==================== Chủ nhiệm ====================
  async function loadClasses() {
    if (!namHocSelect || !classesTableTbody) return;
    const NamHoc = namHocSelect.value;
    classesTableTbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';

    try {
      const res = await fetch('/api/phancongchunhiembomon/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NamHoc })
      });
      const { success, classes = [] } = await res.json();

      if (!success || classes.length === 0) {
        classesTableTbody.innerHTML = '<tr><td colspan="5">Không có dữ liệu lớp</td></tr>';
        return;
      }

      classesTableTbody.innerHTML = classes.map((c, i) => `
        <tr data-id="${escapeHtml(c.MaLop)}">
          <td>${i + 1}</td>
          <td>${escapeHtml(c.MaLop)}</td>
          <td>${escapeHtml(c.TenLop)}</td>
          <td>${escapeHtml(c.TenGVCN || 'Chưa phân công')}</td>
          <td>
            <button class="assign-chunhiem" style="padding:5px 10px;margin-right:5px;">Phân công</button>
            <button class="delete-chunhiem" style="padding:5px 10px;background:#d9534f;">Xóa</button>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      console.error(err);
      classesTableTbody.innerHTML = '<tr><td colspan="5">Lỗi tải danh sách lớp</td></tr>';
    }
  }

  // Click phân công chủ nhiệm
  classesTableTbody?.addEventListener('click', async (e) => {
    const assignBtn = e.target.closest('.assign-chunhiem');
    const deleteBtn = e.target.closest('.delete-chunhiem');
    
    if (assignBtn) {
      const maLop = assignBtn.closest('tr').dataset.id;
      await openChunhiemModal(maLop);
      // Sau khi phân công chủ nhiệm xong, reload danh sách chủ nhiệm
      await loadClasses();
    }
    
    if (deleteBtn) {
      const tr = deleteBtn.closest('tr');
      const maLop = tr.dataset.id;
      const tenLop = tr.children[2]?.textContent || maLop;
      
      if (!confirm(`Bạn có chắc chắn muốn xóa giáo viên chủ nhiệm của lớp ${tenLop}?`)) return;
      
      try {
        const NamHoc = namHocSelect.value;
        const res = await fetch('/api/phancongchunhiembomon/delete-chunhiem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaLop: maLop, NamHoc })
        });
        const result = await res.json();
        
        if (result.success) {
          Swal.fire('Thành công', result.message, 'success');
          await loadClasses(); // Await to ensure list is reloaded before alert closes
        } else {
          Swal.fire('Lỗi', result.message, 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể xóa giáo viên chủ nhiệm', 'error');
      }
    }
  });

  async function openChunhiemModal(MaLop) {
    const NamHoc = namHocSelect.value;
    showModal('<p>Đang tải danh sách giáo viên...</p>');

    try {
      const [availRes, curRes] = await Promise.all([
        fetch('/api/phancongchunhiembomon/teachers-available', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NamHoc, MaLop })
        }),
        fetch('/api/phancongchunhiembomon/current-gvcn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaLop, NamHoc })
        })
      ]);

      const availData = await availRes.json();
      const curData = await curRes.json();

      const teachers = availData.teachers || [];
      const current = curData.current;

      if (teachers.length === 0) {
        showModal(`
          <p>Phân công lớp <strong>${escapeHtml(MaLop)}</strong></p>
          <p style="color:red;">Không còn giáo viên nào phù hợp để làm chủ nhiệm!</p>
        `);
        return;
      }

      const options = teachers.map(t => 
        `<option value="${escapeHtml(t.MaGiaoVien)}">${escapeHtml(t.TenGiaoVien)}</option>`
      ).join('');

      const currentHtml = current ? `<p>Giáo viên hiện tại: <strong>${escapeHtml(current.TenGiaoVien)}</strong></p>` : '';

      showModal(`
        <h3>Phân công chủ nhiệm - Lớp ${escapeHtml(MaLop)}</h3>
        ${currentHtml}
        <p><select id="gv-select-modal" style="width:100%;padding:8px;margin:10px 0">${options}</select></p>
        <button id="save-chunhiem" style="padding:10px 20px;background:#0a1d37;color:white;border:none;border-radius:5px;">Xác nhận</button>
      `);

      document.getElementById('save-chunhiem')?.addEventListener('click', async () => {
        const MaGVCN = document.getElementById('gv-select-modal').value;
        modal.style.display = 'none';

        try {
          const saveRes = await fetch('/api/phancongchunhiembomon/assign-chunhiem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ MaLop, NamHoc, MaGVCN, KyHoc: kyHocSelect.value })
          });
          const result = await saveRes.json();

          if (result.success) {
            Swal.fire('Thành công', result.message, 'success');
            await loadClasses(); // Await the load to ensure data is refreshed before closing alert
          } else {
            Swal.fire('Lỗi', result.message, 'error');
          }
        } catch (err) {
          console.error(err);
          Swal.fire('Lỗi', 'Lỗi khi phân công', 'error');
        }
      });

    } catch (err) {
      console.error(err);
      showModal('<p style="color:red;">Lỗi khi tải dữ liệu giáo viên</p>');
    }
  }

  // ==================== Bộ môn ====================
  async function getKhoiList() {
    try {
      const res = await fetch('/api/phancongchunhiembomon/khoi-list', { method: 'POST' });
      const { success, khoiList = [] } = await res.json();

      khoiSelect.innerHTML = khoiList.map(k => 
        `<option value="${escapeHtml(k.MaKhoi)}">${escapeHtml(k.TenKhoi)}</option>`
      ).join('');

      if (khoiList.length > 0) {
        updateSubjects(khoiList[0].MaKhoi);
      }
    } catch (err) {
      console.error('Lỗi load khối', err);
    }
  }

  async function updateSubjects(MaKhoi) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi })
      });
      const { subjects = [] } = await res.json();

      monSelect.innerHTML = subjects.map(s => 
        `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
      ).join('');

      if (subjects.length > 0) {
        updateTeachersBySubject(subjects[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTeachersBySubject(TenMonHoc) {
    try {
      const res = await fetch('/api/phancongchunhiembomon/teachers-by-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TenMonHoc,
          NamHoc: namHocSelect.value,
          KyHoc: kyHocSelect.value
        })
      });
      const { success, teachers = [] } = await res.json();

      if (!success || teachers.length === 0) {
        gvSelect.innerHTML = '<option value="">-- Không có giáo viên phù hợp --</option>';
        classesBomonTbody.innerHTML = '<tr><td colspan="5">Không có dữ liệu</td></tr>';
        return;
      }

      gvSelect.innerHTML = teachers.map(t => `
        <option value="${escapeHtml(t.MaGiaoVien)}">
          ${escapeHtml(t.TenGiaoVien)} (còn ${t.remaining || 40 - t.load} tiết)
        </option>
      `).join('');

      // Tải lớp ngay khi chọn giáo viên
      if (khoiSelect.value) {
        loadClassesByKhoi(khoiSelect.value);
      }

    } catch (err) {
      console.error(err);
    }
  }

  async function loadClassesByKhoi(MaKhoi) {
    if (!classesBomonTbody) return;
    classesBomonTbody.innerHTML = '<tr><td colspan="5">Đang tải lớp...</td></tr>';

    try {
      const res = await fetch('/api/phancongchunhiembomon/classes-by-khoi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi })
      });
      const { classes = [] } = await res.json();

      if (classes.length === 0) {
        classesBomonTbody.innerHTML = '<tr><td colspan="5">Không có lớp</td></tr>';
        return;
      }

      classesBomonTbody.innerHTML = classes.map((c, i) => `
        <tr data-id="${escapeHtml(c.MaLop)}">
          <td>${i + 1}</td>
          <td>${escapeHtml(c.MaLop)}</td>
          <td>${escapeHtml(c.TenLop)}</td>
          <td><input type="checkbox" class="bomon-check"></td>
          <td class="subject-count" data-id="${escapeHtml(c.MaLop)}">-</td>
        </tr>
      `).join('');

      updateClassSubjectCounts(); // Cập nhật số tiết môn cho từng lớp

    } catch (err) {
      classesBomonTbody.innerHTML = '<tr><td colspan="5">Lỗi tải lớp</td></tr>';
    }
  }

  async function updateClassSubjectCounts() {
    const classIds = Array.from(classesBomonTbody.querySelectorAll('tr'))
      .map(tr => tr.dataset.id)
      .filter(Boolean);

    if (classIds.length === 0) return;

    try {
      const res = await fetch('/api/phancongchunhiembomon/subject-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClassList: classIds,
          NamHoc: namHocSelect.value,
          KyHoc: kyHocSelect.value,
          TenMonHoc: monSelect.value
        })
      });
      const { counts = [] } = await res.json();

      counts.forEach(c => {
        const el = classesBomonTbody.querySelector(`.subject-count[data-id="${c.MaLop}"]`);
        if (el) el.textContent = c.count;
      });
    } catch (err) {
      console.error('Lỗi cập nhật số tiết lớp', err);
    }
  }

  // Nút phân công bộ môn
  assignBomonBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
      const MaGiaoVien = gvSelect.value;
      const TenMonHoc = monSelect.value;
      const NamHoc = namHocSelect.value;
      const KyHoc = kyHocSelect.value;

    const selectedClasses = Array.from(document.querySelectorAll('.bomon-check:checked'))
      .map(cb => cb.closest('tr').dataset.id)
      .filter(Boolean);

    console.log('Assign Bomon:', { MaGiaoVien, TenMonHoc, NamHoc, KyHoc, selectedClasses });

    if (selectedClasses.length === 0) {
      return Swal.fire('Cảnh báo', 'Vui lòng chọn ít nhất một lớp', 'warning');
    }

    try {
      assignBomonBtn.disabled = true;

      // Kiểm tra định mức trước
      const checkRes = await fetch('/api/phancongchunhiembomon/check-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
      });
      const check = await checkRes.json();

      if (!check.canAssign) {
        assignBomonBtn.disabled = false;
        return Swal.fire('Không thể phân công', 
          `Giáo viên sẽ vượt định mức ${check.MAX_LOAD} tiết! (hiện ${check.currentLoad} + thêm ${check.addedLoad})`, 'warning');
      }

      // Thực hiện phân công
      const res = await fetch('/api/phancongchunhiembomon/assign-bomon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
      });
      const result = await res.json();
      
      console.log('Assign result:', result);

      if (result.success) {
        Swal.fire('Thành công', result.message, 'success');
        // Uncheck all boxes and reload data
        document.querySelectorAll('.bomon-check').forEach(cb => cb.checked = false);
        await loadClassesByKhoi(khoiSelect.value);
        await updateTeachersBySubject(TenMonHoc);
        await loadAssignmentFilters(); // Reload danh sách bộ môn sau khi phân công
      } else {
        Swal.fire('Lỗi', result.message, 'error');
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể phân công bộ môn', 'error');
      console.error('Assign Bomon error:', err);
    } finally {
      assignBomonBtn.disabled = false;
    }
  });

  // ==================== Sự kiện thay đổi ====================
  khoiSelect && (khoiSelect.onchange = () => updateSubjects(khoiSelect.value));
  monSelect && (monSelect.onchange = () => {
    // Chỉ lấy tên môn gốc (không số lớp)
    let monValue = monSelect.value;
    // Nếu có số lớp (ví dụ: "Toán 10"), chỉ lấy "Toán"
    monValue = monValue.split(' ')[0];
    updateTeachersBySubject(monValue);
  });
  gvSelect && (gvSelect.onchange = () => {
    if (khoiSelect.value) loadClassesByKhoi(khoiSelect.value);
  });

  namHocSelect && (namHocSelect.onchange = async () => {
    await fetch('/api/thoikhoabieu/getKyHocList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NamHoc: namHocSelect.value })
    })
    .then(r => r.json())
    .then(list => {
      const opts = (Array.isArray(list) ? list : []).map(k => k.KyHoc || k);
      kyHocSelect.innerHTML = opts.map(k => `<option>${k}</option>`).join('');
      checkHocKyStatus();
    });
  });

  kyHocSelect && (kyHocSelect.onchange = checkHocKyStatus);

  // ==================== Danh sách phân công ====================
  let allAssignments = [];

  async function loadAssignmentFilters() {
    try {
      const res = await fetch('/api/phancongchunhiembomon/list-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NamHoc: namHocSelect.value, KyHoc: kyHocSelect.value })
      });
      const { success, assignments = [] } = await res.json();

      if (!success || assignments.length === 0) {
        assignmentTableTbody.innerHTML = '<tr><td colspan="8">Chưa có phân công</td></tr>';
        return;
      }

      allAssignments = assignments;

      // Populate filter dropdowns
      const khoiSet = new Set();
      const monSet = new Set();
      const gvSet = new Set();

      assignments.forEach(a => {
        if (a.Khoi) khoiSet.add(a.Khoi);
        if (a.TenMonHoc) monSet.add(a.TenMonHoc);
        if (a.TenGiaoVien) gvSet.add(a.TenGiaoVien);
      });

      filterKhoiSelect.innerHTML = '<option value="">-- Tất cả --</option>' +
        Array.from(khoiSet).sort().map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');

      filterMonSelect.innerHTML = '<option value="">-- Tất cả --</option>' +
        Array.from(monSet).sort().map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

      filterGvSelect.innerHTML = '<option value="">-- Tất cả --</option>' +
        Array.from(gvSet).sort().map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');

      displayAssignments(allAssignments);
    } catch (err) {
      console.error('Load assignments error:', err);
      assignmentTableTbody.innerHTML = '<tr><td colspan="8">Lỗi tải danh sách</td></tr>';
    }
  }

  function displayAssignments(assignments) {
    if (assignments.length === 0) {
      assignmentTableTbody.innerHTML = '<tr><td colspan="8">Không có kết quả phù hợp</td></tr>';
      return;
    }

    assignmentTableTbody.innerHTML = assignments.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(a.Khoi || '')}</td>
        <td>${escapeHtml(a.TenMonHoc || '')}</td>
        <td>${escapeHtml(a.TenGiaoVien || '')}</td>
        <td>${escapeHtml(a.MaLop || '')}</td>
        <td>${escapeHtml(a.TenLop || '')}</td>
        <td>${escapeHtml(a.NamHoc || '')}</td>
        <td>${escapeHtml(a.HocKy || '')}</td>
        <td><button class="delete-bomon" data-gv="${escapeHtml(a.MaGVBM)}" data-lop="${escapeHtml(a.MaLop)}" data-namhoc="${escapeHtml(a.NamHoc)}" data-hocky="${escapeHtml(a.HocKy)}" data-mon="${escapeHtml(a.TenMonHoc)}" style="background:#d9534f;color:#fff;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button></td>
      </tr>
    `).join('');
  }

  filterBtn?.addEventListener('click', () => {
    const selectedKhoi = filterKhoiSelect.value;
    const selectedMon = filterMonSelect.value;
    const selectedGv = filterGvSelect.value;

    const filtered = allAssignments.filter(a => {
      return (selectedKhoi === '' || a.Khoi === selectedKhoi) &&
             (selectedMon === '' || a.TenMonHoc === selectedMon) &&
             (selectedGv === '' || a.TenGiaoVien === selectedGv);
    });

    displayAssignments(filtered);
  });

  async function checkHocKyStatus() {
    const res = await fetch('/api/phancongchunhiembomon/check-hk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NamHoc: namHocSelect.value, KyHoc: kyHocSelect.value })
    });
    const { status } = await res.json();
    if (status === 'Kết thúc') {
      Swal.fire('Không thể phân công', 'Học kỳ đã kết thúc!', 'warning');
    }
  }

  // ==================== Khởi động ====================
    // Xử lý nút xóa phân công bộ môn
    assignmentTableTbody?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-bomon');
      if (!btn) return;
      const MaGVBM = btn.dataset.gv;
      const MaLop = btn.dataset.lop;
      const NamHoc = btn.dataset.namhoc;
      const HocKy = btn.dataset.hocky;
      const TenMonHoc = btn.dataset.mon;
      if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return;
      try {
        const res = await fetch('/api/phancongchunhiembomon/delete-bomon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaGVBM, MaLop, NamHoc, HocKy, TenMonHoc })
        });
        const result = await res.json();
        if (result.success) {
          Swal.fire('Thành công', 'Đã xóa phân công bộ môn!', 'success');
          await loadAssignmentFilters();
        } else {
          Swal.fire('Lỗi', result.message || 'Không thể xóa!', 'error');
        }
      } catch (err) {
        Swal.fire('Lỗi', 'Không thể xóa!', 'error');
      }
    });
  // Nếu đang ở tab chủ nhiệm → load ngay
  if (tabChunhiem?.classList.contains('active')) {
    loadClasses();
  } else {
    getKhoiList();
  }

  // Load học kỳ cho năm học hiện tại
  if (namHocSelect?.value) {
    namHocSelect.dispatchEvent(new Event('change'));
  }
}

// Chạy khi DOM sẵn sàng
if (typeof window !== 'undefined') {
  window.initPhanCong = initPhanCong;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhanCong);
  } else {
    initPhanCong();
  }
}