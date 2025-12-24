(function () {
  if (window.xemThoiKhoaBieuInitialized) return;
  window.xemThoiKhoaBieuInitialized = true;

  console.log('xemthoikhoabieu.js loaded');

  // ========================
  // BIẾN DOM CHÍNH
  // ========================
  const FilterForm = document.getElementById('filter-form');
  const NamHocSelect = document.getElementById('NamHoc');
  const KyHocSelect = document.getElementById('KyHoc');
  const LoaiTKBSelect = document.getElementById('LoaiTKB');
  const NamHocStartInput = document.getElementById('NamHocStart');

  // ========================
  // HIỂN THỊ THÔNG BÁO
  // ========================
  function showMessage(message, type = "info") {
    let toast = document.getElementById("toast-message");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-message";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = "block";
    toast.style.opacity = "1";

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => { toast.style.display = "none"; }, 600);
    }, 3000);
  }

  // ========================
  // LOAD HỌC KỲ THEO NĂM HỌC
  // ========================
  NamHocSelect.addEventListener('change', async () => {
    const res = await fetch('/api/xemthoikhoabieu/getKyHocList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NamHoc: NamHocSelect.value })
    });
    const list = await res.json();
    KyHocSelect.innerHTML = list.map(k => `<option value="${k.KyHoc}">${k.KyHoc}</option>`).join('');
  });

  // ========================
  // TÍNH NGÀY THỨ 2 ĐẦU TUẦN
  // ========================
  function getWeekStartDate(startStr, weekNumber) {
    if (!startStr) startStr = '2025-08-01';
    const base = new Date(startStr);
    if (isNaN(base)) return new Date('2025-08-01');
    const d = base.getDay();
    const offset = d === 1 ? 0 : (d === 0 ? 1 : 8 - d);
    base.setDate(base.getDate() + offset + (weekNumber - 1) * 7);
    return base;
  }

  // ========================
  // LOAD TKB
  // ========================
  FilterForm.addEventListener('submit', e => {
    e.preventDefault();
    loadTKB();
  });

  async function loadTKB() {
    const fData = Object.fromEntries(new FormData(FilterForm).entries());
    if (!fData.NamHoc || !fData.KyHoc || !fData.LoaiTKB) {
      showMessage('Vui lòng chọn đầy đủ năm học, học kỳ và tuần.', 'error');
      return;
    }

    const res = await fetch('/api/xemthoikhoabieu/getAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fData)
    });
    const json = await res.json();
    if (!json || json.error) {
      showMessage('Không thể tải dữ liệu.', 'error');
      return;
    }

    const timetableRaw = json.timetable || {};

    // Chuẩn hóa Thu CN => 8, Thứ 2-7 giữ nguyên
    const timetable = {};
    Object.keys(timetableRaw).forEach(thuKey => {
      const d = thuKey === "CN" ? 8 : parseInt(thuKey);
      timetable[d] = timetable[d] || {};
      Object.keys(timetableRaw[thuKey]).forEach(tiet => {
        timetable[d][tiet] = timetableRaw[thuKey][tiet];
      });
    });

    if (!Object.keys(timetable).length) {
      showMessage('Chưa có thời khóa biểu cho tuần này (hiển thị TKB chuẩn).', 'warn');
    } else {
      showMessage('Đã tải TKB thành công.', 'success');
    }

    NamHocStartInput.value = json.selectedNamHocStart || '2025-08-01';
    const weekNumber = fData.LoaiTKB.replace('Tuan', '');
    const weekStart = getWeekStartDate(NamHocStartInput.value, weekNumber);
    renderTimetable(timetable, weekStart);
  }

  // ========================
  // RENDER BẢNG TKB (READ-ONLY)
  // ========================
  function renderTimetable(tt, weekStart) {
    let html = '<thead><tr><th>Tiết / Thứ</th>';
    for (let d = 2; d <= 8; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + (d - 2));
      const thuName = d === 8 ? 'Chủ nhật' : `Thứ ${d}`;
      html += `<th>${thuName}<br><small>${day.toLocaleDateString('vi-VN')}</small></th>`;
    }
    html += '</tr></thead><tbody>';

    html += `<tr class="session-header"><td colspan="8">Buổi sáng</td></tr>`;
    for (let p = 1; p <= 5; p++) html += createRow(tt, p);

    html += `<tr class="session-header"><td colspan="8">Buổi chiều</td></tr>`;
    for (let p = 6; p <= 10; p++) html += createRow(tt, p);

    html += '</tbody>';
    document.getElementById('timetable-table').innerHTML = html;
  }

  // ========================
  // TẠO DÒNG TIẾT (TEXT THAY VÌ SELECT)
  // ========================
  function createRow(tt, p) {
    let row = `<tr><td>${p}</td>`;
    for (let d = 2; d <= 8; d++) {
      const cell = tt[d]?.[p] || {};
      row += `<td>
        <div class="subject">${cell.subject || ''}</div>
        <div class="teacher">${cell.teacher || ''}</div>
      </td>`;
    }
    return row + '</tr>';
  }
})();