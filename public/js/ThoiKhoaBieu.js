// public/js/thoikhoabieu.js
(function () {
  if (window.thoiKhoaBieuInitialized) return;
  window.thoiKhoaBieuInitialized = false;

  console.log('thoikhoabieu.js loaded');

  // ========================
// BIẾN DOM CHÍNH
// ========================
const FilterForm = document.getElementById('filter-form');
const KhoiSelect = document.getElementById('Khoi');
const LopSelect = document.getElementById('MaLop');
const NamHocSelect = document.getElementById('NamHoc');
const KyHocSelect = document.getElementById('KyHoc');
const LoaiTKBSelect = document.getElementById('LoaiTKB');
const NamHocStartInput = document.getElementById('NamHocStart');
let subjectsByClass = [];

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
// LOAD LỚP THEO KHỐI
// ========================
KhoiSelect.addEventListener('change', async () => {
  LopSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';
  if (!KhoiSelect.value) return;

  try {
    const res = await fetch('/api/thoikhoabieu/getLopTheoKhoi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaKhoi: KhoiSelect.value })
    });
    const data = await res.json();
    const options = data.map(l => `<option value="${l.MaLop}">${l.TenLop}</option>`).join('');
    LopSelect.innerHTML = '<option value="">-- Chọn lớp --</option>' + options;

    if (data.length === 0) {
      showMessage('Không có lớp nào trong khối này.', 'warn');
    }

  } catch (err) {
    showMessage('Lỗi khi tải danh sách lớp.', 'error');
    console.error(err);
  }
});

// ========================
// LOAD HỌC KỲ THEO NĂM HỌC
// ========================
NamHocSelect.addEventListener('change', async () => {
  const res = await fetch('/api/thoikhoabieu/getKyHocList', {
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
  if (!fData.Khoi || !fData.MaLop || !fData.NamHoc || !fData.KyHoc) {
    showMessage('Vui lòng chọn đầy đủ khối, lớp, năm học và học kỳ.', 'error'); 
    return;
  }

  const res = await fetch('/api/thoikhoabieu/getAll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fData)
  });
  const json = await res.json();
  if (!json || json.error) { 
    showMessage('Không thể tải dữ liệu.', 'error'); 
    return; 
  }

  subjectsByClass = json.subjects || [];
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
    const msg = fData.LoaiTKB === 'Chuan'
      ? 'Chưa có thời khóa biểu chuẩn.'
      : 'Chưa có thời khóa biểu tuần này.';
    showMessage(msg, 'warn');
  } else { 
    showMessage('Đã tải TKB thành công.', 'success'); 
  }

  NamHocStartInput.value = json.selectedNamHocStart || '2025-08-01';
  const weekNumber = fData.LoaiTKB === 'Chuan' ? 1 : parseInt(fData.LoaiTKB.replace('Tuan',''));
  const weekStart = getWeekStartDate(NamHocStartInput.value, weekNumber);
  renderTimetable(timetable, weekStart);
}

// ========================
// RENDER BẢNG TKB
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
  attachSubjectChangeEvents();
}

// ========================
// TẠO DÒNG TIẾT
// ========================
function createRow(tt, p) {
  let row = `<tr><td>${p}</td>`;
  for (let d = 2; d <= 8; d++) {
    const cell = tt[d]?.[p] || {};
    // 🔹 Lọc bỏ môn EMPTY_WEEK
    const validSubjects = subjectsByClass.filter(s => s.TenMonHoc !== 'EMPTY_WEEK');

    row += `<td>
      <select class="subject-select" data-thu="${d}" data-tiet="${p}">
        <option value="">-- Môn học --</option>
        ${validSubjects.map(s => `<option value="${s.TenMonHoc}" ${cell.subject === s.TenMonHoc ? 'selected' : ''}>${s.TenMonHoc}</option>`).join('')}
      </select>
      <div class="teacher" id="teacher-${d}-${p}">${cell.teacher || ''}</div>
      <div class="conflict-warning" id="conflict-${d}-${p}" style="display:none;"></div>
    </td>`;
  }
  return row + '</tr>';
}

// ========================
// SỰ KIỆN CHỌN MÔN
// ========================
function attachSubjectChangeEvents() {
  document.querySelectorAll('.subject-select').forEach(sel => {
    sel.addEventListener('change', async function () {
      const TenMonHoc = this.value;
      const Thu = this.dataset.thu;
      const Tiet = this.dataset.tiet;
      const div = document.getElementById(`teacher-${Thu}-${Tiet}`);
      const conflictDiv = document.getElementById(`conflict-${Thu}-${Tiet}`);
      const f = FilterForm;

      // Ẩn cảnh báo cũ
      if (conflictDiv) {
        conflictDiv.style.display = 'none';
        conflictDiv.innerText = '';
      }

      // ===== Nếu xóa môn khỏi cell =====
      if (!TenMonHoc) {
        try {
          await fetch('/api/thoikhoabieu/deleteCell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              MaLop: f.MaLop.value,
              NamHoc: f.NamHoc.value,
              KyHoc: f.KyHoc.value,
              LoaiTKB: f.LoaiTKB.value,
              Thu: Thu === "8" ? "CN" : Thu,
              TietHoc: Tiet
            })
          });
          showMessage('Đã xóa tiết.', 'success');
        } catch {
          showMessage('Lỗi khi xóa tiết', 'error');
        }
        showMessage('Đã xóa tiết.', 'success');
        div.innerText = '';
        div.classList.remove('missing');
        this.classList.remove('warning');
        this.classList.remove('conflict-block');
        await updateSubjectIndicators();
        return;
      }

      // ===== Kiểm tra trùng tiết =====
      try {
        const conflictRes = await fetch('/api/thoikhoabieu/checkSubjectConflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            MaLop: f.MaLop.value,
            NamHoc: f.NamHoc.value,
            KyHoc: f.KyHoc.value,
            LoaiTKB: f.LoaiTKB.value,
            Thu: Thu === "8" ? "CN" : Thu,
            TietHoc: Tiet,
            TenMonHoc
          })
        });

        const conflictData = await conflictRes.json();

        if (conflictData.conflict) {
          if (conflictData.blockSelection) {
            // Trùng với TKB chuẩn -> Không cho chọn
            showMessage(conflictData.message, 'error');
            this.value = ''; // Reset lại về trống
            div.innerText = '';
            return;
          } else {
            // Trùng với TKB tuần -> Hiển thị cảnh báo nhưng vẫn cho chọn
            if (conflictDiv) {
              conflictDiv.innerText = conflictData.message;
              conflictDiv.style.display = 'block';
              conflictDiv.style.color = '#ff9800';
              conflictDiv.style.fontSize = '11px';
              conflictDiv.style.marginTop = '3px';
            }
            showMessage(conflictData.message, 'warn');
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trùng tiết:', err);
      }

      // ===== Lấy giáo viên cho môn =====
      try {
        const resGV = await fetch('/api/thoikhoabieu/getTeacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaLop: f.MaLop.value, TenMonHoc })
        });
        const dataGV = await resGV.json();
        div.innerText = dataGV?.TenGiaoVien || 'Chưa phân công';
        div.classList.toggle('missing', !dataGV?.TenGiaoVien);
      } catch {
        div.innerText = 'Lỗi lấy GV';
        div.classList.add('missing');
      }

      // ===== Cập nhật lại toàn bộ chỉ số tiết =====
      await updateSubjectIndicators();
    });
  });
}

// ========================
// CẬP NHẬT CHỈ SỐ TIẾT CHO TẤT CẢ CELL
// ========================
async function updateSubjectIndicators() {
  const f = FilterForm;
  const selects = document.querySelectorAll('.subject-select');
  const cells = Array.from(selects).map(s => ({
    TenMonHoc: s.value,
    Thu: s.dataset.thu,
    TietHoc: s.dataset.tiet
  }));

  try {
    const res = await fetch('/api/thoikhoabieu/checkSubjectLimit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MaLop: f.MaLop.value,
        NamHoc: f.NamHoc.value,
        KyHoc: f.KyHoc.value,
        LoaiTKB: f.LoaiTKB.value,
        cells
      })
    });

    const data = await res.json();
    const warnings = data?.warnings || [];

    // 🔹 Dọn sạch hiển thị cũ
    selects.forEach(sel => {
      const Thu = sel.dataset.thu;
      const Tiet = sel.dataset.tiet;
      const div = document.getElementById(`teacher-${Thu}-${Tiet}`);
      sel.classList.remove('warning');
      if (div && div.innerText) {
        div.innerText = div.innerText.replace(/\s*\(\d+\/\d+\)\s*$/, '');
      }
    });

    // 🔹 Hiển thị (x/x) và tô đỏ nếu vượt
    warnings.forEach(info => {
      const { TenMonHoc, soHienTai, soToiDa } = info;
      document.querySelectorAll('.subject-select').forEach(sel => {
        if (sel.value === TenMonHoc) {
          const Thu = sel.dataset.thu;
          const Tiet = sel.dataset.tiet;
          const div = document.getElementById(`teacher-${Thu}-${Tiet}`);
          const teacherName = (div.innerText || 'Chưa phân công').replace(/\s*\(\d+\/\d+\)\s*$/, '');
          div.innerText = `${teacherName} (${soHienTai}/${soToiDa})`;
          if (soHienTai > soToiDa) sel.classList.add('warning');
        }
      });
    });

  } catch (err) {
    console.error('Lỗi khi cập nhật số tiết:', err);
  }
}

// ========================
// LƯU TKB
// ========================
document.getElementById('save-timetable').addEventListener('click', async () => {
  const f = FilterForm;
  const timetableData = [];
  const namHocStart = f.NamHocStart.value;

  if (!namHocStart || isNaN(new Date(namHocStart))) {
    showMessage('Ngày bắt đầu năm học không hợp lệ.', 'error');
    return;
  }

  document.querySelectorAll('.subject-select').forEach(sel => {
    const Thu = sel.dataset.thu === "8" ? "CN" : sel.dataset.thu;
    const Tiet = sel.dataset.tiet;
    const TenMonHoc = sel.value;

    // 🔹 Giữ nguyên cell hiện có
    if (TenMonHoc) {
      timetableData.push({
        MaLop: f.MaLop.value,
        NamHoc: f.NamHoc.value,
        KyHoc: f.KyHoc.value,
        LoaiTKB: f.LoaiTKB.value,
        Thu,
        TietHoc: Tiet,
        TenMonHoc
      });
    } else {
      // 🔹 Tạo cell ảo để server nhận, nhưng không thay đổi thứ tự
      timetableData.push({
        MaLop: f.MaLop.value,
        NamHoc: f.NamHoc.value,
        KyHoc: f.KyHoc.value,
        LoaiTKB: f.LoaiTKB.value,
        Thu,
        TietHoc: Tiet,
        TenMonHoc: '' // cell trống
      });
    }
  });

  try {
    const res = await fetch('/api/thoikhoabieu/saveAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timetable: timetableData, selectedNamHocStart: namHocStart })
    });
    const result = await res.json();

    if (result.error) showMessage('Lưu thất bại.', 'error');
    else {
      showMessage('Lưu TKB thành công.', 'success');
      setTimeout(() => loadTKB(), 3000);
    }
  } catch (err) {
    console.error(err);
    showMessage('Lỗi khi lưu TKB.', 'error');
  }
});

// ========================
// RESET TKB
// ========================
const resetBox = document.getElementById('reset-confirm');
const yesBtn = document.getElementById('confirm-yes');
const noBtn = document.getElementById('confirm-no');

document.getElementById('reset-week').addEventListener('click', () => {
  const f = FilterForm;
  if (f.LoaiTKB.value === 'Chuan') { 
    showMessage('Không thể đặt lại TKB chuẩn.', 'error'); 
    return; 
  }
  resetBox.style.display = 'flex';
});

noBtn.addEventListener('click', () => resetBox.style.display = 'none');
yesBtn.addEventListener('click', async () => {
  resetBox.style.display = 'none';
  const f = FilterForm;
  const res = await fetch('/api/thoikhoabieu/resetWeek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      MaLop: f.MaLop.value,
      NamHoc: f.NamHoc.value,
      KyHoc: f.KyHoc.value,
      LoaiTKB: f.LoaiTKB.value
    })
  });
  const data = await res.json();
  if (data.error) showMessage('Đặt lại thất bại.', 'error');
  else showMessage('Đặt lại tuần thành công.', 'success');
  loadTKB();
});
})();