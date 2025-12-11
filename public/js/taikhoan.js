// public/js/taikhoan.js – HOÀN HẢO TUYỆT ĐỐI, CÓ DẤU ĐẸP, KHÔNG NHÂN ĐÔI, TẠO MỚI CÓ LOẠI

const modal         = document.getElementById('modal-account');
const modalTitle    = document.getElementById('modal-title');
const modalForm     = document.getElementById('modal-form');
const tbody         = document.querySelector('#account-table tbody');
const maInput       = document.getElementById('ma');
const loaiTKInput   = document.getElementById('loaiTK');
const passwordInput = document.getElementById('password');
const btnThem       = document.getElementById('btn-them');

let editId = null;

// TOAST
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.offsetHeight;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3500);
}

// HIỂN THỊ TÊN ĐẸP DÙ DB CÓ DẤU HAY KHÔNG
function roleName(code) {
  const map = {
    'HieuTruong': 'Hiệu trưởng',
    'GiaoVien': 'Giáo viên',
    'HocSinh': 'Học sinh',
    'GiaoVu': 'Giáo vụ',
    'ThiSinh': 'Thí sinh',
    'CanBoSGD': 'Cán bộ SGD',
    'QuanTriVien': 'Quản trị hệ thống',
    'Hiệu trưởng': 'Hiệu trưởng',
    'Giáo viên': 'Giáo viên',
    'Học sinh': 'Học sinh',
    'Giáo vụ': 'Giáo vụ',
    'Thí sinh': 'Thí sinh',
    'Cán bộ SGD': 'Cán bộ SGD',
    'Quản trị hệ thống': 'Quản trị hệ thống'
  };
  return map[code] || code;
}

// MỞ MODAL + TỰ ĐỘNG LOAD LOẠI TK KHI TẠO MỚI (SỬA Ở ĐÂY!)
async function openModal(isEdit = false, data = null) {
  modal.style.display = 'flex';
  modalTitle.textContent = isEdit ? 'Sửa Tài khoản' : 'Tạo Tài khoản mới';
  editId = isEdit ? data.TenTaiKhoan : null;

  maInput.value = data?.TenTaiKhoan || '';
  maInput.disabled = isEdit;
  passwordInput.value = '';

  if (!isEdit) {
    // TỰ ĐỘNG LOAD LOẠI TÀI KHOẢN VÀO SELECT KHI TẠO MỚI
    try {
      const res = await fetch('/api/taotk/loai');
      const json = await res.json();
      if (json.success && json.loaiList) {
        loaiTKInput.innerHTML = json.loaiList.map(l => 
          `<option value="${l}">${roleName(l)}</option>`
        ).join('');
      }
    } catch (err) {
      console.error('Lỗi load loại tài khoản:', err);
    }
  } else {
    loaiTKInput.value = data?.LoaiTaiKhoan || '';
  }

  setTimeout(() => isEdit ? loaiTKInput.focus() : maInput.focus(), 100);
}

function closeModal() {
  modal.style.display = 'none';
  modalForm.reset();
  editId = null;
  maInput.disabled = false;
}

document.querySelector('.modal-close').onclick = closeModal;
document.getElementById('btn-cancel').onclick = closeModal;
window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// LOAD DANH SÁCH + TÌM KIẾM + LỌC
async function loadAccounts() {
  try {
    const search    = document.getElementById('search-taikhoan')?.value.trim() || '';
    const loaiEl    = document.querySelector('#filter-loai, #filter-loaitk, #loaiTK');
    const loai      = loaiEl?.value || '';
    const trangthai = document.getElementById('filter-trangthai')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (loai) params.append('loai', loai);
    if (trangthai) params.append('trangthai', trangthai);

    const res = await fetch(`/api/taotk/list?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi server');

    const accounts = json.accounts || [];

    if (accounts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:50px; color:#7f8c8d;">
        Không tìm thấy tài khoản nào.<br><br>
        ${search || loai || trangthai ? 'Thử thay đổi bộ lọc.' : 'Nhấn <strong style="color:#27ae60;">+ Tạo Tài khoản mới</strong> để bắt đầu.'}
      </td></tr>`;
      return;
    }

   tbody.innerHTML = accounts.map(acc => `
  <tr>
    <td><strong>${acc.TenTaiKhoan}</strong></td>
   <td>${acc.MatKhauGoc || '(không có)'}</td> <!-- cột mật khẩu gốc -->
    <td>${roleName(acc.LoaiTaiKhoan)}</td>
    
    <td><span class="badge ${acc.TrangThai == 1 ? 'active' : 'locked'}">
      ${acc.TrangThai == 1 ? 'Hoạt động' : 'Đã khóa'}
    </span></td>
    <td>
      <button class="btn-edit" data-id="${acc.TenTaiKhoan}">Sửa</button>
      <button class="btn-delete" data-id="${acc.TenTaiKhoan}">Xóa</button>
    </td>
  </tr>
`).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => openModal(true, accounts.find(a => a.TenTaiKhoan === btn.dataset.id));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async () => {
        const ma = btn.dataset.id;
        if (!confirm(`XÓA tài khoản "${ma}"?\nKhông thể khôi phục!`)) return;
        const delRes = await fetch('/api/taotk/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ma })
        });
        const delJson = await delRes.json();
        showToast(delJson.message || (delJson.success ? 'Xóa thành công' : 'Lỗi xóa'), delJson.success ? 'success' : 'error');
        if (delJson.success) loadAccounts();
      };
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e74c3c; padding:40px;">Lỗi: ${err.message}</td></tr>`;
  }
}

// LƯU (TẠO / SỬA)
modalForm.onsubmit = async e => {
  e.preventDefault();
  const payload = { 
    ma: maInput.value.trim(), 
    loaiTK: loaiTKInput.value, 
    password: passwordInput.value 
  };

  if (!payload.ma || !payload.loaiTK || (!editId && !payload.password)) {
    return showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
  }

  const isEdit = !!editId;
  const url = isEdit ? '/api/taotk/update' : '/api/taotk/taotk';
  const method = isEdit ? 'PUT' : 'POST';
  if (isEdit) payload.ma = editId;

  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const json = await res.json();
  showToast(json.message || (json.success ? (isEdit ? 'Cập nhật thành công!' : 'Tạo tài khoản thành công!') : 'Có lỗi xảy ra'), json.success ? 'success' : 'error');
  if (json.success) { closeModal(); loadAccounts(); }
};

// NÚT THÊM + TÌM KIẾM + LỌC
btnThem.onclick = () => openModal(false);

const debounce = (func, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => func.apply(this, args), delay); };
};

document.getElementById('search-taikhoan')?.addEventListener('input', debounce(loadAccounts, 400));
document.querySelector('#filter-loai, #filter-loaitk, #loaiTK')?.addEventListener('change', loadAccounts);
document.getElementById('filter-trangthai')?.addEventListener('change', loadAccounts);

// LOAD BỘ LỌC
async function loadFilters() {
  try {
    const res = await fetch('/api/taotk/loai');
    const json = await res.json();
    const selectLoai = document.querySelector('#filter-loai, #filter-loaitk, #loaiTK');
    if (selectLoai && json.success && json.loaiList) {
      selectLoai.innerHTML = `<option value="">Tất cả loại tài khoản</option>`;
      json.loaiList.forEach(loai => {
        selectLoai.innerHTML += `<option value="${loai}">${roleName(loai)}</option>`;
      });
    }
    const selectTT = document.getElementById('filter-trangthai');
    if (selectTT) {
      selectTT.innerHTML = `<option value="">Tất cả trạng thái</option><option value="1">Hoạt động</option><option value="0">Đã khóa</option>`;
    }
  } catch (err) {
    console.error('Lỗi load bộ lọc:', err);
  }
}

// KHỞI ĐỘNG
(async () => {
  await loadFilters();
  loadAccounts();
})();