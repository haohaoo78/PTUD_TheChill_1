// ========== CHUYỂN GIỮA HỌC SINH / GIÁO VIÊN ==========
const hsSection = document.getElementById('hs-section');
const gvSection = document.getElementById('gv-section');

document.getElementById('manage-hs').onclick = () => {
  hsSection.style.display = '';
  gvSection.style.display = 'none';
  document.getElementById('manage-hs').classList.add('active');
  document.getElementById('manage-gv').classList.remove('active');
};
document.getElementById('manage-gv').onclick = () => {
  gvSection.style.display = '';
  hsSection.style.display = 'none';
  document.getElementById('manage-gv').classList.add('active');
  document.getElementById('manage-hs').classList.remove('active');
};

// ================= MODAL GIÁO VIÊN =================
const modal = document.getElementById('modal');
const modalFields = document.getElementById('modal-fields');
const modalForm = document.getElementById('modal-form');
const modalClose = document.getElementById('modal-close');

async function openModalGV(data = null) {
  modal.style.display = 'flex';
  document.getElementById('modal-title').innerText = data ? 'Sửa Giáo viên' : 'Thêm Giáo viên';
  document.getElementById('modal-id').value = data ? data.MaGiaoVien : '';

  // Lấy danh sách môn học
  const res = await fetch('/api/quanlygiaovien_hocsinh/monhoc');
  const monHocData = await res.json();
  const monHocOptions = monHocData.success
    ? monHocData.data.map(m => `<option value="${m}" ${data?.TenMonHoc === m ? 'selected' : ''}>${m}</option>`).join('')
    : '';

  modalFields.innerHTML = `
    <label>Họ tên:</label><input type="text" id="modal-ten" value="${data?.TenGiaoVien || ''}">
    <label>Ngày sinh:</label><input type="date" id="modal-ngaysinh" value="${data?.NgaySinh || ''}">
    <label>Email:</label><input type="email" id="modal-email" value="${data?.Email || ''}">
    <label>SĐT:</label><input type="text" id="modal-sdt" value="${data?.SDT || ''}">
    <label>Bộ môn:</label>
    <select id="modal-bomon">
      <option value="">-- Chọn môn học --</option>
      ${monHocOptions}
    </select>
    <label>Giới tính:</label>
    <select id="modal-gioitinh">
      <option ${data?.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
      <option ${data?.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
    </select>
    <label>Trạng thái:</label>
    <select id="modal-trangthai">
      <option ${data?.TrangThai === 'Đang công tác' ? 'selected' : ''}>Đang công tác</option>
      <option ${data?.TrangThai === 'Nghỉ việc' ? 'selected' : ''}>Nghỉ việc</option>
    </select>
  `;
}

modalClose.onclick = () => (modal.style.display = 'none');
window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

modalForm.onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('modal-id').value;
  const payload = {
    TenGiaoVien: document.getElementById('modal-ten').value,
    NgaySinh: document.getElementById('modal-ngaysinh').value,
    GioiTinh: document.getElementById('modal-gioitinh').value,
    Email: document.getElementById('modal-email').value,
    SDT: document.getElementById('modal-sdt').value,
    TenMonHoc: document.getElementById('modal-bomon').value,
    TrangThai: document.getElementById('modal-trangthai').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = `/api/quanlygiaovien_hocsinh/giaovien/${id || ''}`;
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  modal.style.display = 'none';
  loadGV();
};

// ================= MODAL HỌC SINH =================
const modalHS = document.getElementById('modal-hs');
const modalHSFields = document.getElementById('modal-hs-fields');
const modalHSForm = document.getElementById('modal-hs-form');
const modalHSClose = document.getElementById('modal-hs-close');

function openModalHS(data = null) {
  modalHS.style.display = 'flex';
  document.getElementById('modal-hs-title').innerText = data ? 'Sửa Học sinh' : 'Thêm Học sinh';
  document.getElementById('modal-hs-id').value = data ? data.MaHocSinh : '';

  modalHSFields.innerHTML = `
    <label>Họ tên:</label><input type="text" id="modal-hs-ten" value="${data?.TenHocSinh || ''}">
    <label>Ngày sinh:</label><input type="date" id="modal-hs-ngaysinh" value="${data?.Birthday || ''}">
    <label>Giới tính:</label>
    <select id="modal-hs-gioitinh">
      <option ${data?.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
      <option ${data?.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
    </select>
    <label>Trạng thái:</label>
    <select id="modal-hs-trangthai">
      <option ${data?.TrangThai === 'Đang học' ? 'selected' : ''}>Đang học</option>
      <option ${data?.TrangThai === 'Nghỉ học' ? 'selected' : ''}>Nghỉ học</option>
    </select>
  `;
}

modalHSClose.onclick = () => modalHS.style.display = 'none';
window.onclick = e => { if (e.target === modalHS) modalHS.style.display = 'none'; };

modalHSForm.onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('modal-hs-id').value;
  const payload = {
    TenHocSinh: document.getElementById('modal-hs-ten').value,
    Birthday: document.getElementById('modal-hs-ngaysinh').value,
    GioiTinh: document.getElementById('modal-hs-gioitinh').value,
    TrangThai: document.getElementById('modal-hs-trangthai').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = `/api/quanlygiaovien_hocsinh/hocsinh/${id || ''}`;
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  modalHS.style.display = 'none';
  loadHS();
};

// ================= LOAD DỮ LIỆU =================
async function loadHS(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/quanlygiaovien_hocsinh/hocsinh?${query}`);
  const data = await res.json();
  if (!data.success) return;

  document.querySelector('#hs-table tbody').innerHTML = data.data.map(hs => `
    <tr>
      <td>${hs.MaHocSinh}</td>
      <td>${hs.TenHocSinh}</td>
      <td>${hs.Birthday}</td>
      <td>${hs.TenKhoi}</td>
      <td>${hs.TenLop}</td>
      <td>${hs.GioiTinh}</td>
      <td>${hs.TrangThai}</td>
      <td>
        <button onclick='deleteHS("${hs.MaHocSinh}")'>Xóa</button>
        <button onclick='openModalHS(${JSON.stringify(hs)})'>Sửa</button>
      </td>
    </tr>`).join('');
}

async function loadGV(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/quanlygiaovien_hocsinh/giaovien?${query}`);
  const data = await res.json();
  if (!data.success) return;

  document.querySelector('#gv-table tbody').innerHTML = data.data.map(gv => `
    <tr>
      <td>${gv.MaGiaoVien}</td>
      <td>${gv.TenGiaoVien}</td>
      <td>${gv.NgaySinh}</td>
      <td>${gv.Email}</td>
      <td>${gv.SDT}</td>
      <td>${gv.TenMonHoc}</td>
      <td>${gv.GioiTinh}</td>
      <td>${gv.TrangThai}</td>
      <td>
        <button onclick='openModalGV(${JSON.stringify(gv)})'>Sửa</button>
        <button onclick='deleteGV("${gv.MaGiaoVien}")'>Xóa</button>
      </td>
    </tr>`).join('');
}

// ================= XÓA =================
async function deleteHS(id){ 
  if(confirm('Xóa học sinh này?')){ 
    await fetch(`/api/quanlygiaovien_hocsinh/hocsinh/${id}`, { method:'DELETE' }); 
    loadHS();
  }
}
async function deleteGV(id){ 
  if(confirm('Xóa giáo viên này?')){ 
    await fetch(`/api/quanlygiaovien_hocsinh/giaovien/${id}`, { method:'DELETE' }); 
    loadGV();
  }
}

// ================= BỘ LỌC HỌC SINH =================
async function loadNamHoc() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/namhoc');
  const data = await res.json();
  if (!data.success) return;
  const select = document.getElementById('filter-namhoc-hs');
  select.innerHTML = '<option value="">-- Chọn năm học --</option>' + data.data.map(n => `<option value="${n.NamHoc}">${n.NamHoc}</option>`).join('');
}

async function loadKhoi() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/khoi');
  const data = await res.json();
  if (!data.success) return;
  const select = document.getElementById('filter-khoi-hs');
  select.innerHTML = '<option value="">-- Chọn khối --</option>' + data.data.map(k => `<option value="${k.MaKhoi}">${k.TenKhoi}</option>`).join('');
}

async function loadLop(maKhoi = '') {
  const res = await fetch(`/api/quanlygiaovien_hocsinh/lop?makhoi=${maKhoi}`);
  const data = await res.json();
  if (!data.success) return;
  const select = document.getElementById('filter-lop-hs');
  select.innerHTML = '<option value="">-- Chọn lớp --</option>' + data.data.map(l => `<option value="${l.MaLop}">${l.TenLop}</option>`).join('');
}

document.getElementById('filter-khoi-hs').addEventListener('change', e => loadLop(e.target.value));
document.getElementById('btn-xem-hs').addEventListener('click', () => {
  const namHoc = document.getElementById('filter-namhoc-hs').value;
  const khoi = document.getElementById('filter-khoi-hs').value;
  const lop = document.getElementById('filter-lop-hs').value;
  loadHS({ namHoc, khoi, lop });
});

// ================= BỘ LỌC GIÁO VIÊN =================
async function loadMonHoc() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/monhoc');
  const data = await res.json();
  if (!data.success) return;

  const select = document.getElementById('filter-monhoc-gv');
  select.innerHTML = '<option value="">-- Tất cả --</option>' +
    data.data.map(m => `<option value="${m}">${m}</option>`).join('');
}

document.getElementById('btn-xem-gv').addEventListener('click', () => {
  const monHoc = document.getElementById('filter-monhoc-gv').value;
  loadGV({ monHoc });
});

// Nút thêm giáo viên
document.getElementById('btn-them-gv').addEventListener('click', () => openModalGV());

// ================= KHỞI TẠO =================
loadNamHoc();
loadKhoi();
loadLop();
loadHS();
loadMonHoc();
loadGV();
