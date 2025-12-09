// ==========================
// JS Quản lý Duyệt Yêu Cầu Sửa Điểm
// ==========================

// DOM elements
const modal = document.getElementById('detail-modal');
const modalContent = document.getElementById('detail-content');
const table = document.getElementById('requests-table');
// current filter code (accessible globally)
let currentFilterCode = null;

// ==========================
// Tạo modal xác nhận
// ==========================
const confirmationModal = document.createElement('div');
confirmationModal.className = 'modal confirmation-modal';
confirmationModal.innerHTML = `
  <div class="modal-content">
    <h3 id="confirm-title"></h3>
    <p id="confirm-message"></p>
    <div class="modal-actions">
      <button id="confirm-yes" class="btn">Đồng ý</button>
      <button id="confirm-no" class="btn">Hủy</button>
    </div>
  </div>
`;
document.body.appendChild(confirmationModal);

// ==========================
// Helper: render alert
// ==========================
function renderAlert(message, type = 'info') {
  return `<div class="modal-alert modal-alert-${type}">${message}</div>`;
}

// ==========================
// Helper: update row status sau khi approve/reject
// ==========================
function updateRowStatus(tr, status) {
  if (!tr) return;

  const cells = tr.querySelectorAll('td');
  // Trạng thái ở cột 11 (0-based index 10)
  const statusCell = cells[10];
  if (statusCell) {
    const display = status === 'DaDuyet' ? 'Đã duyệt' : status === 'BiTuChoi' ? 'Bị từ chối' : 'Đang xử lý';
    statusCell.textContent = display;
    // Keep both machine and display values where possible
    statusCell.dataset.status = status; // code e.g., DaDuyet
    statusCell.dataset.statusDisplay = display;
    // Also keep raw status code in row dataset (we pass the code in `status` param)
    tr.dataset.trangthai = status;
    // Apply classes for styling
    statusCell.classList.remove('status-done', 'status-rejected');
    if (display === 'Đã duyệt') statusCell.classList.add('status-done');
    if (display === 'Bị từ chối') statusCell.classList.add('status-rejected');
  }
  // Cập nhật action (cột cuối)
  const actionCell = cells[cells.length - 1];
  if (actionCell) actionCell.innerHTML = '<em>Đã xử lý</em>';

  // Hiệu ứng visual
  tr.classList.add('updated');
  setTimeout(() => tr.classList.remove('updated'), 2000);

  // Re-apply active filter so rows that changed status get hidden/shown correctly
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) filterRequests(activeBtn.dataset.statusCode);
}

// ==========================
// Fetch chi tiết yêu cầu
// ==========================
async function fetchRequestDetails(id) {
  modalContent.innerHTML = renderAlert('Đang tải chi tiết...', 'info');
  try {
    const res = await fetch(`/api/duyetyeucausuadiem/details/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data || !data.success) throw new Error(data?.message || 'Lỗi khi lấy dữ liệu');

    const yc = data.request;

    // Render chi tiết modal
    modalContent.innerHTML = `
      <p><strong>Giáo viên:</strong> ${yc.TenGiaoVien || '—'}</p>
      <p><strong>Học sinh:</strong> ${yc.TenHocSinh || '—'} (${yc.MaHocSinh || '—'})</p>
      <p><strong>Lớp:</strong> ${yc.TenLop || '—'}</p>
      <p><strong>Môn:</strong> ${yc.TenMonHoc || '—'}</p>
      <p><strong>Năm học:</strong> ${yc.NamHoc || '—'}</p>
      <p><strong>Học kỳ:</strong> ${yc.HocKi || '—'}</p>
      <p><strong>Điểm cũ:</strong> ${yc.DiemCu ?? '—'}</p>
      <p><strong>Điểm đề xuất:</strong> ${yc.DiemMoi ?? '—'}</p>
      <p><strong>Lý do:</strong> ${yc.LyDo || '—'}</p>
      ${yc.MinhChung?.length ? `
        <p>
          <strong>Minh chứng:</strong>
          <button class="view-proof btn" data-image="${yc.MinhChung[0]}">Xem minh chứng</button>
        </p>` : ''}
      <div class="modal-actions">
        ${yc.TrangThai === 'DangXuLy' ? `
          <button class="modal-approve btn" data-id="${id}">Duyệt</button>
          <button class="modal-reject btn" data-id="${id}">Từ chối</button>` : ''}
        <button class="modal-close btn">Đóng</button>
      </div>
    `;

    // Xử lý modal
    const approveBtn = modalContent.querySelector('.modal-approve');
    const rejectBtn = modalContent.querySelector('.modal-reject');
    const closeBtn = modalContent.querySelector('.modal-close');
    const viewProofBtn = modalContent.querySelector('.view-proof');

    // Xem minh chứng
    if (viewProofBtn) {
      viewProofBtn.addEventListener('click', () => {
        const imageModal = document.createElement('div');
        imageModal.className = 'modal';
        imageModal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <img src="/minhchung/${viewProofBtn.dataset.image}" alt="Minh chứng" style="width:100%; max-height:80vh; object-fit:contain;">
          </div>
        `;
        document.body.appendChild(imageModal);
        imageModal.style.display = 'block';

        imageModal.querySelector('.close').onclick = () => imageModal.remove();
        window.onclick = e => { if (e.target === imageModal) imageModal.remove(); };
      });
    }

    // Duyệt/Từ chối
    approveBtn && (approveBtn.onclick = async () => await doApproveReject(id, 'approve', true));
    rejectBtn && (rejectBtn.onclick = async () => {
      const reason = await showReasonModal('Lý do từ chối', 'Nhập lý do từ chối...');
      if (reason) await doApproveReject(id, 'reject', true, reason);
    });

    // Đóng modal
    closeBtn && closeBtn.addEventListener('click', () => modal.style.display = 'none');

  } catch (err) {
    console.error(err);
    modalContent.innerHTML = renderAlert('Không thể tải chi tiết: ' + (err.message || err), 'danger');
  }
}

// ==========================
// Confirmation Modal
// ==========================
function showConfirmationModal(title, message) {
  return new Promise(resolve => {
    const modal = document.querySelector('.confirmation-modal');
    modal.querySelector('#confirm-title').textContent = title;
    modal.querySelector('#confirm-message').textContent = message;
    modal.style.display = 'block';

    const yesBtn = modal.querySelector('#confirm-yes');
    const noBtn = modal.querySelector('#confirm-no');

    const cleanup = (result) => {
      modal.style.display = 'none';
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      resolve(result);
    };

    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

// ==========================
// Reason modal (for rejection input)
// ==========================
function showReasonModal(title = 'Lý do từ chối', placeholder = '') {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal reason-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${title}</h3>
        <textarea id="reason-input" placeholder="${placeholder}" style="width:100%; min-height:80px; margin-top:8px;"></textarea>
        <div class="modal-actions" style="margin-top:8px;">
          <button id="reason-confirm" class="btn">Từ chối</button>
          <button id="reason-cancel" class="btn">Hủy</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    const confirm = modal.querySelector('#reason-confirm');
    const cancel = modal.querySelector('#reason-cancel');
    const input = modal.querySelector('#reason-input');

    const cleanup = (val) => {
      modal.remove();
      resolve(val);
    };

    confirm.onclick = () => {
      const val = input.value.trim();
      if (!val) {
        alert('Vui lòng nhập lý do từ chối');
        return;
      }
      cleanup(val);
    };
    cancel.onclick = () => cleanup(null);
  });
}

// ==========================
// Approve / Reject
// ==========================
async function doApproveReject(id, action, isFromModal = false, ghiChu = '') {
  const endpoint = `/api/duyetyeucausuadiem/${action}`;
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  const allButtons = [...tr?.querySelectorAll('button') || [], ...modalContent?.querySelectorAll('button') || []];

  const confirmed = await showConfirmationModal(
    action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối',
    action === 'approve'
      ? 'Bạn có chắc muốn duyệt yêu cầu này?'
      : 'Bạn có chắc muốn từ chối yêu cầu này?'
  );

  if (!confirmed) return;

  allButtons.forEach(b => b.disabled = true);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ghiChu })
    });

    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Thao tác thất bại');

    updateRowStatus(tr, action === 'approve' ? 'DaDuyet' : 'BiTuChoi');

    if (isFromModal) {
      modalContent.innerHTML = renderAlert(data.message, 'success');
      setTimeout(() => modal.style.display = 'none', 800);
    } else {
      const alertEl = document.createElement('div');
      alertEl.className = 'floating-alert success';
      alertEl.textContent = data.message;
      document.body.appendChild(alertEl);
      setTimeout(() => alertEl.remove(), 1000);
    }

    // Re-fetch list for current filter to get authoritative data from server
    if (currentFilterCode) {
      await fetchAndRender(currentFilterCode);
    }
  } catch (err) {
    console.error(err);
    allButtons.forEach(b => b.disabled = false);
    modalContent.insertAdjacentHTML('afterbegin', renderAlert(err.message, 'danger'));
  }
}

// ==========================
// Event delegation cho table
// ==========================
if (modal && table) {
  // current filter code (already defined globally)
  // Apply initial filter based on active button (will fetch from server)
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) {
    currentFilterCode = activeBtn.dataset.statusCode;
    fetchAndRender(currentFilterCode);
  }
  table.addEventListener('click', async e => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;

    if (e.target.classList.contains('view-btn')) {
      modal.style.display = 'block';
      await fetchRequestDetails(id);
    }

    if (e.target.classList.contains('approve-btn')) {
      await doApproveReject(id, 'approve', false);
    }

    if (e.target.classList.contains('reject-btn')) {
        const reason = await showReasonModal('Lý do từ chối', 'Nhập lý do từ chối...');
        if (reason) await doApproveReject(id, 'reject', false, reason);
    }

    if (e.target.classList.contains('note-btn')) {
      const note = e.target.getAttribute('title') || 'Không có lý do';
      alert(note);
    }

    // previous filter handling moved to separate handler on .filter-buttons
  });

  // Đóng modal
  const closeModal = modal.querySelector('.close');
  if (closeModal) closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
}

// Filter buttons handler: these are outside the table, so handle them here
const filterContainer = document.querySelector('.filter-buttons');
if (filterContainer) {
  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilterCode = btn.dataset.statusCode;
    fetchAndRender(currentFilterCode);
  });
}

// Apply initial filter based on active button (fallback if not inside table block)
const initialBtn = document.querySelector('.filter-btn.active');
if (initialBtn) filterRequests(initialBtn.dataset.statusCode);

// ==========================
// Hàm filter yêu cầu (client-side)
// ==========================
function filterRequests(status) {
  const trs = table.querySelectorAll('tbody tr');
  const displayToCode = {
    'Đang xử lý': 'DangXuLy',
    'Đã duyệt': 'DaDuyet',
    'Bị từ chối': 'BiTuChoi'
  };
  trs.forEach(tr => {
    // Try dataset, then specific column (11th), then .status element
    // Prefer the row code, then the status cell code or status-display, then the text content
    let trStatus = tr.dataset.trangthai;
    const cell = tr.querySelector('td[data-status]') || tr.querySelector('td:nth-child(11)');
    if (!trStatus && cell) trStatus = cell.dataset.status || cell.dataset.statusDisplay || cell.textContent?.trim();
    if (!trStatus) {
      const statusEl = tr.querySelector('.status') || tr.querySelector('.status-done');
      trStatus = statusEl?.textContent?.trim();
    }
    if (!trStatus) trStatus = '';

    if (!status || status === 'All' || status === 'Tất cả' || status === 'All') {
      tr.style.display = '';
      return;
    }
    // If status is a display string, map to code for comparison
    const normalized = displayToCode[trStatus] || trStatus;
    if (normalized === status) {
      tr.style.display = '';
    } else {
      tr.style.display = 'none';
    }
  });
}

// ==========================
// Fetch list from server and render
// ==========================
async function fetchAndRender(statusCode) {
  try {
    // POST body expects 'status', controller will translate aliases
    const res = await fetch('/api/duyetyeucausuadiem/list', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusCode })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.success) throw new Error(data?.message || 'Lỗi server');
    renderRequestRows(data.requests || []);
  } catch (err) {
    console.error('Lỗi khi fetch danh sách theo trạng thái:', err);
    // optionally show error to user
  }
}

function renderRequestRows(requests) {
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  if (!requests.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="12" class="text-center">Không có yêu cầu</td>';
    tbody.appendChild(tr);
    return;
  }
  requests.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.dataset.id = r.MaYeuCau;
    tr.dataset.trangthai = r.TrangThai;
    // Build actions based on status
    let actions = `<button class="view-btn">Xem chi tiết</button>`;
    if (r.TrangThai === 'DangXuLy') {
      actions += ` <button class="approve-btn">✅ Duyệt</button> <button class="reject-btn">❌ Từ chối</button>`;
    } else {
      if (r.TrangThai === 'BiTuChoi' && r.GhiChu) {
        actions += ` <button class="note-btn" title="${r.GhiChu}">👁️ Lý do từ chối</button>`;
      }
      if (r.TrangThai === 'DaDuyet') {
        actions += ` <em class="status-done">✔️ Đã duyệt</em>`;
      }
    }

    const statusDisplay = r.TrangThai === 'DangXuLy' ? 'Đang xử lý' : (r.TrangThai === 'DaDuyet' ? 'Đã duyệt' : 'Bị từ chối');

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.MaYeuCau}</td>
      <td>${r.MaHocSinh}</td>
      <td>${r.TenHocSinh || ''}</td>
      <td>${r.TenMonHoc || r.Mon || ''}</td>
      <td>${r.LoaiDiem || ''}</td>
      <td class="text-red">${r.DiemCu ?? ''}</td>
      <td class="text-green">${r.DiemMoi ?? ''}</td>
      <td>${r.LyDo || ''}</td>
      <td>${r.TenGiaoVien || ''}</td>
      <td data-status="${r.TrangThai}" data-status-display="${statusDisplay}">${statusDisplay}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}
