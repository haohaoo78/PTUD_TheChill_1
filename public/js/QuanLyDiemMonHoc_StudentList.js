// UI danh sách học sinh + nhập điểm (Trung bình lấy từ CSDL)
(function () {
  const main = document.getElementById('main-content');
  const table = document.getElementById('qldm-score-table');
  const emptyNote = document.getElementById('qldm-empty-note');
  const btnSave = document.getElementById('qldm-btn-save-scores');
  const data = window.qldmData || { selectedClass: '', selectedClassName: '', selectedNamHoc: '', selectedHocKy: '', mode: 'add', students: [] };

  async function loadIntoMain(url) {
    if (!main) {
      window.location.href = url;
      return;
    }
    const res = await fetch(url);
    const html = await res.text();
    main.innerHTML = html;
    main.querySelectorAll('script').forEach(s => {
      const n = document.createElement('script');
      if (s.src) n.src = s.src;
      else n.textContent = s.textContent;
      document.body.appendChild(n);
      s.remove();
    });
  }

  function bindInternalNav() {
    document.querySelectorAll('[data-qldm-nav]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const url = a.getAttribute('data-qldm-nav');
        if (url) loadIntoMain(url);
      });
    });
  }

  async function loadStudentsIfNeeded() {
    if (!data.selectedClass) return;
    if (Array.isArray(data.students) && data.students.length > 0) return;
    try {
      const params = new URLSearchParams({ maLop: data.selectedClass });
      const res = await fetch(`/api/quanlydiem/students?${params.toString()}`);
      const result = await res.json();
      if (!result.success) return;
      data.students = result.students || [];
      data.selectedNamHoc = result.namHoc || data.selectedNamHoc || '';
      data.selectedHocKy = result.hocKy || data.selectedHocKy || '';
      renderStudents(data.students);
    } catch (err) {
      console.error(err);
    }
  }

  function renderStudents(students) {
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;
    if (!students || students.length === 0) {
      tbody.innerHTML = '';
      if (emptyNote) emptyNote.classList.remove('hidden');
      if (btnSave) btnSave.disabled = true;
      return;
    }
    if (emptyNote) emptyNote.classList.add('hidden');
    if (btnSave) btnSave.disabled = false;
    tbody.innerHTML = students
      .map((hs, idx) => {
        const birthday = hs.Birthday ? hs.Birthday.toString().slice(0, 10) : '';
        const lockIfHasValue = value => {
          // mode=add chỉ được nhập ô trống (NULL); mode=edit thì luôn cho nhập
          if (data.mode !== 'add') return '';
          return value !== null && value !== undefined && value !== '' ? 'disabled' : '';
        };
        const tx1 = hs.ThuongXuyen1 ?? '';
        const tx2 = hs.ThuongXuyen2 ?? '';
        const tx3 = hs.ThuongXuyen3 ?? '';
        const d151 = hs.Diem15_1 ?? '';
        const d152 = hs.Diem15_2 ?? '';
        const gk = hs.GK ?? '';
        const ck = hs.CK ?? '';
        const tbm = hs.TrungBinhMon ?? '';
        return `
          <tr>
            <td class="hidden-col">${hs.MaHocSinh || ''}</td>
            <td>${idx + 1}</td>
            <td>${hs.TenHocSinh || ''}</td>
            <td>${birthday}</td>
            <td>${hs.GioiTinh || ''}</td>
            <td>${data.selectedClassName || data.selectedClass || ''}</td>
            <td>${data.selectedNamHoc || ''}</td>
            <td>${data.selectedHocKy || ''}</td>
            <td><input class="qldm-score" data-field="ThuongXuyen1" type="number" step="0.1" min="0" max="10" value="${tx1}" ${lockIfHasValue(tx1)}></td>
            <td><input class="qldm-score" data-field="ThuongXuyen2" type="number" step="0.1" min="0" max="10" value="${tx2}" ${lockIfHasValue(tx2)}></td>
            <td><input class="qldm-score" data-field="ThuongXuyen3" type="number" step="0.1" min="0" max="10" value="${tx3}" ${lockIfHasValue(tx3)}></td>
            <td><input class="qldm-score" data-field="Diem15_1" type="number" step="0.1" min="0" max="10" value="${d151}" ${lockIfHasValue(d151)}></td>
            <td><input class="qldm-score" data-field="Diem15_2" type="number" step="0.1" min="0" max="10" value="${d152}" ${lockIfHasValue(d152)}></td>
            <td><input class="qldm-score" data-field="GK" type="number" step="0.1" min="0" max="10" value="${gk}" ${lockIfHasValue(gk)}></td>
            <td><input class="qldm-score" data-field="CK" type="number" step="0.1" min="0" max="10" value="${ck}" ${lockIfHasValue(ck)}></td>
            <td><input class="qldm-tbm" type="text" readonly value="${tbm}"></td>
          </tr>
        `;
      })
      .join('');
    initTableState();
  }

  function validateScore(num) {
    if (num === null) return null;
    if (num < 0 || num > 10) return NaN;
    return num;
  }

  function collectScores() {
    const rows = table?.querySelectorAll('tbody tr') || [];
    const items = [];
    rows.forEach(row => {
      const maHocSinh = row.querySelector('td.hidden-col')?.textContent?.trim() || '';
      if (!maHocSinh) return;

      const inputs = row.querySelectorAll('input.qldm-score');
      const payload = { maHocSinh };
      let hasAny = false;
      for (const input of inputs) {
        if (input.disabled) continue;
        const field = input.dataset.field;
        const num = validateScore(toNumber(input.value));
        if (Number.isNaN(num)) {
          throw new Error('Điểm phải nằm trong khoảng 0 đến 10');
        }
        payload[field] = num;
        if (num !== null) hasAny = true;
      }
      if (hasAny) items.push(payload);
    });
    return items;
  }

  function bindSaveScores() {
    if (!btnSave) return;
    btnSave.addEventListener('click', async () => {
      if (!data.selectedClass) return;
      try {
        const scores = collectScores();
        if (scores.length === 0) {
          alert('Chưa có điểm nào để lưu.');
          return;
        }
        btnSave.disabled = true;
        const res = await fetch('/api/quanlydiem/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maLop: data.selectedClass, mode: data.mode || 'add', scores })
        });
        const result = await res.json();
        if (!result.success) {
          alert(result.message || (data.mode === 'add' ? 'Không thể thêm điểm' : 'Lưu điểm thất bại'));
          btnSave.disabled = false;
          return;
        }
        alert(data.mode === 'add' ? 'Cập nhật thêm điểm thành công' : 'Cập nhật điểm thành công');
        const params = new URLSearchParams({ maLop: data.selectedClass, tenLop: data.selectedClassName || '' });
        if (data.mode) params.set('mode', data.mode);
        await loadIntoMain(`/api/quanlydiem/render/students?${params.toString()}`);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Lưu điểm thất bại');
        btnSave.disabled = false;
      }
    });
  }

  function toNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function initTableState() {
    const rows = table?.querySelectorAll('tbody tr') || [];
    if (emptyNote) emptyNote.classList.toggle('hidden', rows.length > 0);
    if (btnSave) btnSave.disabled = rows.length === 0;
  }

  loadStudentsIfNeeded();
  initTableState();
  bindInternalNav();
  bindSaveScores();
})();
