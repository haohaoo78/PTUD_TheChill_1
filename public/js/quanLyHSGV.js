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

// ========== MODAL ==========
const modal = document.getElementById('modal');
const modalFields = document.getElementById('modal-fields');
const modalForm = document.getElementById('modal-form');
const modalClose = document.getElementById('modal-close');
let currentType = 'hs';

function openModal(type, data = null) {
  currentType = type;
  modal.style.display = 'flex';
  document.getElementById('modal-title').innerText = data
    ? `Sửa ${type === 'hs' ? 'Học sinh' : 'Giáo viên'}`
    : `Thêm ${type === 'hs' ? 'Học sinh' : 'Giáo viên'}`;
  document.getElementById('modal-id').value = data
    ? type === 'hs' ? data.MaHocSinh : data.MaGiaoVien
    : '';

  modalFields.innerHTML =
    type === 'hs'
      ? `
      <label>Họ tên:</label><input type="text" id="modal-ten" value="${data?.TenHocSinh || ''}">
      <label>Ngày sinh:</label><input type="date" id="modal-ngaysinh" value="${data?.Birthday || ''}">
      <label>Mã lớp:</label><input type="text" id="modal-malop" value="${data?.MaLop || ''}">
      <label>Giới tính:</label>
      <select id="modal-gioitinh">
        <option ${data?.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
        <option ${data?.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
      </select>
      <label>Trạng thái:</label>
      <select id="modal-trangthai">
        <option ${data?.TrangThai === 'Đang học' ? 'selected' : ''}>Đang học</option>
        <option ${data?.TrangThai === 'Ngưng học' ? 'selected' : ''}>Ngưng học</option>
      </select>
    `
      : `
      <label>Họ tên:</label><input type="text" id="modal-ten" value="${data?.TenGiaoVien || ''}">
      <label>Ngày sinh:</label><input type="date" id="modal-ngaysinh" value="${data?.NgaySinh || ''}">
      <label>Email:</label><input type="email" id="modal-email" value="${data?.Email || ''}">
      <label>SĐT:</label><input type="text" id="modal-sdt" value="${data?.SDT || ''}">
      <label>Bộ môn:</label><input type="text" id="modal-bomon" value="${data?.TenMonHoc || ''}">
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

document.getElementById('btn-add-hs').onclick = () => openModal('hs');
document.getElementById('btn-add-gv').onclick = () => openModal('gv');

// ============ LOAD DỮ LIỆU ============
async function loadHS() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/hocsinh');
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
        <button onclick='openModal("hs", ${JSON.stringify(hs)})'>Sửa</button>
        <button onclick='deleteHS("${hs.MaHocSinh}")'>Xóa</button>
      </td>
    </tr>`).join('');
}

async function loadGV() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/giaovien');
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
        <button onclick='openModal("gv", ${JSON.stringify(gv)})'>Sửa</button>
        <button onclick='deleteGV("${gv.MaGiaoVien}")'>Xóa</button>
      </td>
    </tr>`).join('');
}

async function deleteHS(id){ 
  if(confirm('Xóa học sinh này?')){ 
    await fetch(`/api/quanlygiaovien_hocsinh/hocsinh/${id}`,{method:'DELETE'}); 
    loadHS();
  }
}
async function deleteGV(id){ 
  if(confirm('Xóa giáo viên này?')){ 
    await fetch(`/api/quanlygiaovien_hocsinh/giaovien/${id}`,{method:'DELETE'}); 
    loadGV();
  }
}

// ============ FORM SUBMIT ============
modalForm.onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('modal-id').value;
  const payload = currentType==='hs' ? {
    TenHS: document.getElementById('modal-ten').value,
    NgaySinh: document.getElementById('modal-ngaysinh').value,
    GioiTinh: document.getElementById('modal-gioitinh').value,
    MaLop: document.getElementById('modal-malop').value,
    TrangThai: document.getElementById('modal-trangthai').value
  } : {
    TenGiaoVien: document.getElementById('modal-ten').value,
    NgaySinh: document.getElementById('modal-ngaysinh').value,
    GioiTinh: document.getElementById('modal-gioitinh').value,
    Email: document.getElementById('modal-email').value,
    SDT: document.getElementById('modal-sdt').value,
    TenMonHoc: document.getElementById('modal-bomon').value,
    TrangThai: document.getElementById('modal-trangthai').value
  };

  const url = `/api/quanlygiaovien_hocsinh/${currentType==='hs'?'hocsinh':'giaovien'}${id?'/'+id:''}`;
  await fetch(url, {method:id?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  modal.style.display='none';
  currentType==='hs'?loadHS():loadGV();
};

// ============ BỘ LỌC ============
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

// Khi đổi khối => load lớp
document.getElementById('filter-khoi-hs').addEventListener('change', e => loadLop(e.target.value));

// Khi khởi tạo trang
loadNamHoc();
loadKhoi();
loadLop();
loadHS();
loadGV();
