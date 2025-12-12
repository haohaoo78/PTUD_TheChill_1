// public/js/taikhoan.js – SỬA LỖI TẠO & LỌC LOẠI TÀI KHOẢN

const modal         = document.getElementById('modal-account');
const modalTitle    = document.getElementById('modal-title');
const modalForm     = document.getElementById('modal-form');
const tbody         = document.querySelector('#account-table tbody');
const maInput       = document.getElementById('ma');
const loaiTKInput   = document.getElementById('loaiTK');
const passwordInput = document.getElementById('password');
const btnThem       = document.getElementById('btn-them');

let editId = null;
let LOAI_LIST = []; // cached list of account types

// TOAST
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  // force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// TÊN ĐẸP
function roleName(code) {
  const map = {
    'HieuTruong': 'Hiệu trưởng',
    'GiaoVien': 'Giáo viên',
    'HocSinh': 'Học sinh',
    'GiaoVu': 'Giáo vụ',
    'ThiSinh': 'Thí sinh',
    'CanBoSGD': 'Cán bộ SGD',
    'QuanTriVien': 'Quản trị hệ thống'
  };
  return map[code] || code;
}

// Load danh sách loại tài khoản 1 lần và cache
async function loadLoaiTaiKhoan() {
  if (LOAI_LIST.length) return LOAI_LIST;
  try {
    const res = await fetch('/api/taotk/loai');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi load loại');
    LOAI_LIST = Array.isArray(json.loaiList) ? json.loaiList : [];
  } catch (err) {
    console.error('Lỗi loadLoaiTaiKhoan:', err);
    LOAI_LIST = [];
  }

  // Fill select filter
  const filterEl = document.getElementById('filter-loai');
  if (filterEl) {
    filterEl.innerHTML = `<option value="">-- Tất cả --</option>` +
      LOAI_LIST.map(l => `<option value="${l}">${roleName(l)}</option>`).join('');
  }

  // Fill modal select (if exists)
  if (loaiTKInput) {
    loaiTKInput.innerHTML = `<option value="">-- Chọn loại --</option>` +
      LOAI_LIST.map(l => `<option value="${l}">${roleName(l)}</option>`).join('');
  }

  return LOAI_LIST;
}

// MỞ MODAL
function openModal(isEdit = false, data = null) {
  modal.style.display = 'flex';
  modalTitle.textContent = isEdit ? 'Sửa Tài khoản' : 'Tạo Tài khoản mới';
  editId = isEdit ? data.TenTaiKhoan : null;

  maInput.value = isEdit ? data.TenTaiKhoan : '';
  maInput.disabled = isEdit;
  passwordInput.value = '';

  // Nếu là sửa, set loại; nếu là tạo thì đảm bảo select đã load
  if (isEdit) {
    // đảm bảo select đã load trước khi set value (nếu chưa load thì load rồi set)
    if (!LOAI_LIST.length) {
      loadLoaiTaiKhoan().then(() => {
        loaiTKInput.value = data.LoaiTaiKhoan || '';
      });
    } else {
      loaiTKInput.value = data.LoaiTaiKhoan || '';
    }
  } else {
    // tạo mới: nếu chưa load loại thì load; nếu đã load thì reset về placeholder
    if (!LOAI_LIST.length) {
      loadLoaiTaiKhoan();
    } else {
      loaiTKInput.value = '';
    }
  }

  // focus
  setTimeout(() => (isEdit ? loaiTKInput.focus() : maInput.focus()), 120);
}

// ĐÓNG MODAL
function closeModal() {
  modal.style.display = 'none';
  modalForm.reset();
  maInput.disabled = false;
  editId = null;
}

document.querySelector('.modal-close').onclick = closeModal;
document.getElementById('btn-cancel').onclick = closeModal;
window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// LOAD DANH SÁCH TÀI KHOẢN
async function loadAccounts() {
  try {
    const search = (document.getElementById('search-taikhoan')?.value || '').trim();
    const loai = document.getElementById('filter-loai')?.value || '';
    const trangthai = document.getElementById('filter-trangthai')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (loai) params.append('loai', loai);
    if (trangthai !== '') params.append('trangthai', trangthai);

    const res = await fetch(`/api/taotk/list?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi server');

    const accounts = Array.isArray(json.accounts) ? json.accounts : [];

    if (accounts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#666;">
        Không tìm thấy tài khoản.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = accounts.map(acc => `
      <tr>
        <td><strong>${acc.TenTaiKhoan}</strong></td>
        <td>${roleName(acc.LoaiTaiKhoan)}</td>
        <td>
          <span class="badge ${acc.TrangThai == 1 ? 'active' : 'locked'}">
            ${acc.TrangThai == 1 ? 'Hoạt động' : 'Đã khóa'}
          </span>
        </td>
        <td>
          <button class="btn-edit" data-id="${acc.TenTaiKhoan}">Sửa</button>
          <button class="btn-delete" data-id="${acc.TenTaiKhoan}">Xóa</button>
        </td>
      </tr>
    `).join('');

    // attach events
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const acc = accounts.find(a => a.TenTaiKhoan === id);
        if (acc) openModal(true, acc);
      };
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm(`XÓA tài khoản "${id}"?\nĐiều này KHÔNG thể khôi phục!`)) return;
        try {
          const res = await fetch('/api/taotk/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ma: id })
          });
          const json = await res.json();
          showToast(json.message || (json.success ? 'Xóa thành công' : 'Lỗi'), json.success ? 'success' : 'error');
          if (json.success) loadAccounts();
        } catch (err) {
          showToast('Lỗi xóa', 'error');
          console.error(err);
        }
      };
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#c0392b;">Lỗi: ${err.message}</td></tr>`;
    console.error('Lỗi loadAccounts:', err);
  }
}

// HANDLE SUBMIT (TẠO / SỬA)
modalForm.onsubmit = async (e) => {
  e.preventDefault();

  const payload = {
    ma: maInput.value.trim(),
    loaiTK: loaiTKInput.value,
    password: passwordInput.value
  };

  if (!payload.ma || !payload.loaiTK || (!editId && !payload.password)) {
    return showToast('Vui lòng nhập đầy đủ thông tin', 'error');
  }

  const isEdit = !!editId;
  const url = isEdit ? '/api/taotk/update' : '/api/taotk/taotk';
  const method = isEdit ? 'PUT' : 'POST';
  if (isEdit) payload.ma = editId;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    showToast(json.message || (json.success ? (isEdit ? 'Cập nhật thành công' : 'Tạo thành công') : 'Lỗi'), json.success ? 'success' : 'error');
    if (json.success) {
      closeModal();
      loadAccounts();
    }
  } catch (err) {
    console.error('Lỗi submit:', err);
    showToast('Lỗi server', 'error');
  }
};

// SỰ KIỆN LỌC + TÌM KIẾM
const debounce = (fn, delay = 400) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
};

document.getElementById('search-taikhoan')?.addEventListener('input', debounce(loadAccounts, 400));
document.getElementById('filter-loai')?.addEventListener('change', loadAccounts);
document.getElementById('filter-trangthai')?.addEventListener('change', loadAccounts);

// NÚT TẠO
btnThem.onclick = () => openModal(false);

// KHỞI ĐỘNG: nạp loại trước rồi nạp danh sách
(async () => {
  await loadLoaiTaiKhoan(); // đảm bảo cả filter + modal đều có option
  await loadAccounts();
})();
