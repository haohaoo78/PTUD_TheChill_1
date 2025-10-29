// ==========================
// JS Quản lý Duyệt Yêu Cầu Sửa Điểm
// ==========================

// DOM elements
const modal = document.getElementById('detail-modal');
const modalContent = document.getElementById('detail-content');
const table = document.getElementById('requests-table');

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

  // Cập nhật trạng thái (cột 11)
  const statusCell = cells[11];
  if (statusCell) {
    statusCell.textContent =
      status === 'DaDuyet'
        ? 'Đã duyệt'
        : status === 'BiTuChoi'
        ? 'Bị từ chối'
        : status;
    statusCell.dataset.status = status;
  }

  // Cập nhật ngày duyệt (cột 12)
  const dateCell = cells[12];
  if (dateCell) dateCell.textContent = new Date().toLocaleDateString('vi-VN');

  // Cập nhật action (cột cuối)
  const actionCell = cells[cells.length - 1];
  if (actionCell) actionCell.innerHTML = '<em>Đã xử lý</em>';

  // Hiệu ứng visual
  tr.classList.add('updated');
  setTimeout(() => tr.classList.remove('updated'), 2000);
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
    approveBtn && approveBtn.addEventListener('click', async () => await doApproveReject(id, 'approve', true));
    rejectBtn && rejectBtn.addEventListener('click', async () => {
      const { value } = await Swal.fire({
        title: 'Lý do từ chối',
        input: 'textarea',
        inputPlaceholder: 'Nhập lý do từ chối...',
        showCancelButton: true,
        confirmButtonText: 'Từ chối',
        cancelButtonText: 'Hủy',
        inputValidator: v => !v && 'Vui lòng nhập lý do!'
      });
      if (value) await doApproveReject(id, 'reject', true, value);
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
      const { value } = await Swal.fire({
        title: 'Lý do từ chối',
        input: 'textarea',
        showCancelButton: true,
        confirmButtonText: 'Từ chối',
        cancelButtonText: 'Hủy',
        inputValidator: v => !v && 'Vui lòng nhập lý do!'
      });
      if (value) await doApproveReject(id, 'reject', false, value);
    }

    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterRequests(e.target.dataset.status);
    }
  });

  // Đóng modal
  const closeModal = modal.querySelector('.close');
  if (closeModal) closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
}

// ==========================
// Hàm filter yêu cầu (client-side)
// ==========================
function filterRequests(status) {
  const trs = table.querySelectorAll('tbody tr');
  trs.forEach(tr => {
    const trStatus = tr.querySelector('td[data-status]')?.dataset.status;
    if (status === 'All' || trStatus === status) {
      tr.style.display = '';
    } else {
      tr.style.display = 'none';
    }
  });
}
