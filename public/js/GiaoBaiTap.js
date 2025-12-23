// Basic client-side interactions for giao bài tập page
(function () {
  function initGiaoBaiTap() {
    const root = document.querySelector('.gbt-container');
    if (!root || root.dataset.gbtInit === '1') return;
    root.dataset.gbtInit = '1';

    const data = window.gbtData || { classList: [], assignments: [], selectedClass: '' };
    const classGrid = document.getElementById('class-grid');
    const assignList = document.getElementById('assign-list');
    const selectedLabel = document.getElementById('selected-class-label');
    const form = document.getElementById('assign-form');
    const modal = document.getElementById('assign-modal');
    const modalClose = document.getElementById('assign-modal-close');
    const modalForm = document.getElementById('assign-modal-form');
    const confirmModal = document.getElementById('assign-confirm-modal');
    const confirmClose = document.getElementById('assign-confirm-close');
    const confirmCancel = document.getElementById('assign-confirm-cancel');
    const confirmOk = document.getElementById('assign-confirm-ok');
    const assignSection = document.querySelector('.assign-section');
    let pendingAddPayload = null;

  async function loadClasses() {
    try {
      const res = await fetch('/api/giaobaitap/classes');
      const result = await res.json();
      if (!result.success) {
        classGrid.innerHTML = '<div class="empty-note">Không tải được danh sách lớp.</div>';
        return;
      }
      data.classList = result.classList || [];
      if (!data.classList.length) {
        classGrid.innerHTML = '<div class="empty-note">Chưa có lớp nào.</div>';
        return;
      }
      classGrid.innerHTML = data.classList
        .map(
          c => `
          <div class="class-card" data-malop="${c.MaLop}">
            <div class="class-name">${c.TenLop || c.MaLop}</div>
            <div class="class-meta">Mã lớp: ${c.MaLop}</div>
          </div>
        `
        )
        .join('');
      // Chỉ hiển thị danh sách lớp; chờ người dùng chọn lớp
      setSelectedClass('', true);
    } catch (err) {
      console.error(err);
      classGrid.innerHTML = '<div class="empty-note">Lỗi tải danh sách lớp.</div>';
    }
  }

  async function loadAssignments(maLop) {
    try {
      const res = await fetch(`/api/giaobaitap/assignments?maLop=${encodeURIComponent(maLop)}`);
      const result = await res.json();
      if (!result.success) {
        assignList.innerHTML = '<div class="empty-note">Không tải được bài tập.</div>';
        return;
      }
      data.assignments = result.assignments || [];
      renderAssignments(data.assignments);
    } catch (err) {
      console.error(err);
      assignList.innerHTML = '<div class="empty-note">Lỗi tải bài tập.</div>';
    }
  }

  function renderAssignments(list) {
    if (!assignList) return;
    if (!list || list.length === 0) {
      assignList.innerHTML = '<div class="empty-note">Chưa có bài tập.</div>';
      return;
    }
    assignList.innerHTML = list
      .map(
        bt => `
        <div class="assign-card">
          <div class="assign-title">Mã bài tập: ${bt.MaBaiTap || '—'}</div>
          <div class="assign-body">${bt.NoiDung || '—'}</div>
          <div class="assign-meta">
            <span>Ngày giao: ${bt.NgayGiao || '—'}</span>
            <span>Hạn: ${bt.NgayHetHan || bt.HanNop || '—'}</span>
            <span>Mã GV: ${bt.MaGiaoVien || '—'}</span>
            <span>Mã lớp: ${bt.MaLop || '—'}</span>
          </div>
          <div class="assign-actions">
            <button class="btn-secondary assign-add" data-action="add" data-malop="${bt.MaLop}">Thêm</button>
            <button class="btn-primary assign-edit" data-action="edit" data-id="${bt.MaBaiTap}">Sửa</button>
          </div>
        </div>
      `
      )
      .join('');
    bindCardButtons();
  }

  function setSelectedClass(maLop, resetAssignments = true) {
    data.selectedClass = maLop;
    if (selectedLabel) {
      selectedLabel.innerText = maLop ? `Lớp: ${maLop}` : 'Chọn một lớp để xem bài tập';
    }
    if (assignSection) assignSection.classList.toggle('hidden', !maLop);
    // Gắn sẵn mã lớp vào form và modal
    const quickFormClass = document.getElementById('assign-class');
    if (quickFormClass) quickFormClass.value = maLop || '';
    const modalClassInput = document.getElementById('modal-assign-class');
    if (modalClassInput) modalClassInput.value = maLop || '';
    if (resetAssignments) renderAssignments([]);
  }

  function normalizeDateInput(d) {
    if (!d) return '';
    // Accept Date object or string, return yyyy-mm-dd
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return d.toString().slice(0, 10);
  }

  function openModal(mode, dataAssign = {}) {
    if (!modal) return;
    document.getElementById('modal-assign-id').value = mode === 'edit' ? dataAssign.MaBaiTap || '' : '';
    document.getElementById('modal-assign-content').value = dataAssign.NoiDung || '';
    document.getElementById('modal-assign-duedate').value = normalizeDateInput(dataAssign.NgayHetHan || dataAssign.HanNop || '');
    document.getElementById('modal-assign-class').value = dataAssign.MaLop || data.selectedClass || '';
    document.getElementById('assign-modal-title').innerText = mode === 'edit' ? 'Sửa bài tập' : 'Thêm bài tập';
    modal.style.display = 'flex';
  }

  function bindCardButtons() {
    if (!assignList) return;
    assignList.querySelectorAll('.assign-add').forEach(btn => {
      btn.onclick = () => openModal('add', { MaLop: btn.dataset.malop });
    });
    assignList.querySelectorAll('.assign-edit').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const assign = data.assignments.find(a => a.MaBaiTap === id) || {};
        openModal('edit', assign);
      };
    });
  }

  modalClose?.addEventListener('click', () => (modal.style.display = 'none'));

  async function saveAssignment(payload, isEdit) {
    const url = isEdit ? `/api/giaobaitap/assignments/${payload.MaBaiTap}` : '/api/giaobaitap/assignments';
    const method = isEdit ? 'PUT' : 'POST';
    const body = {
      NoiDung: payload.NoiDung,
      NgayHetHan: payload.NgayHetHan,
      MaLop: payload.MaLop
    };
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || 'Lưu thất bại');
        return;
      }
      if (confirmModal) confirmModal.style.display = 'none';
      if (modal) modal.style.display = 'none';
      pendingAddPayload = null;
      await loadAssignments(payload.MaLop);
    } catch (err) {
      console.error(err);
      alert('Lỗi server');
    }
  }

  modalForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      MaBaiTap: document.getElementById('modal-assign-id')?.value || '',
      NoiDung: document.getElementById('modal-assign-content')?.value || '',
      NgayHetHan: document.getElementById('modal-assign-duedate')?.value || '',
      MaLop: document.getElementById('modal-assign-class')?.value || data.selectedClass || ''
    };
    if (!payload.NoiDung || !payload.NgayHetHan || !payload.MaLop) {
      alert('Vui lòng nhập đủ nội dung, hạn nộp và mã lớp.');
      return;
    }
    const isEdit = !!payload.MaBaiTap;
    if (isEdit) {
      await saveAssignment(payload, true);
      return;
    }
    pendingAddPayload = payload;
    if (confirmModal) confirmModal.style.display = 'flex';
  });

  confirmClose?.addEventListener('click', () => {
    if (confirmModal) confirmModal.style.display = 'none';
  });
  confirmCancel?.addEventListener('click', () => {
    if (confirmModal) confirmModal.style.display = 'none';
  });
  confirmOk?.addEventListener('click', async () => {
    if (!pendingAddPayload) {
      if (confirmModal) confirmModal.style.display = 'none';
      return;
    }
    await saveAssignment(pendingAddPayload, false);
  });

  function initClassClick() {
    if (!classGrid) return;
    classGrid.addEventListener('click', e => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      const maLop = card.dataset.malop || '';
      setSelectedClass(maLop);
      loadAssignments(maLop);
    });
  }

  function initForm() {
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const content = document.getElementById('assign-content')?.value || '';
      const due = document.getElementById('assign-duedate')?.value || '';
      const maLop = document.getElementById('assign-class')?.value || data.selectedClass || '';
      if (!content || !due || !maLop) {
        alert('Vui lòng nhập đủ nội dung, hạn nộp và mã lớp.');
        return;
      }
      // Sử dụng form dưới để thêm nhanh
      openModal('add', { NoiDung: content, NgayHetHan: due, MaLop: maLop });
    });
  }

    // Initial render with server data
    renderAssignments(data.assignments || []);
    setSelectedClass(data.selectedClass || '', false);
    initClassClick();
    initForm();
    loadClasses();
  }

  window.initGiaoBaiTap = initGiaoBaiTap;
  initGiaoBaiTap();
})();
