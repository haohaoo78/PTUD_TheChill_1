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

// ================= MODAL HỌC SINH (CHỈ SỬA) =================
const modalHS = document.getElementById('modal-hs');
const modalHSFields = document.getElementById('modal-hs-fields');
const modalHSForm = document.getElementById('modal-hs-form');
const modalHSClose = document.getElementById('modal-hs-close');

async function openModalHS(data) {
  modalHS.style.display = 'flex';
  document.getElementById('modal-hs-title').innerText = 'Sửa Học sinh';
  document.getElementById('modal-hs-id').value = data.MaHocSinh;

  const res = await fetch(`/api/quanlygiaovien_hocsinh/lop?makhoi=${data.MaKhoi}`);
  const classData = await res.json();
  const classOptions = classData.success
    ? classData.data.map(l => `<option value="${l.MaLop}" ${data.MaLop === l.MaLop ? 'selected' : ''}>${l.TenLop}</option>`).join('')
    : '';

  modalHSFields.innerHTML = `
    <label>Họ tên:</label>
    <input type="text" id="modal-hs-ten" value="${data.TenHocSinh || ''}">
    <label>Ngày sinh:</label>
    <input type="date" id="modal-hs-ngaysinh" value="${data.Birthday?.split('T')[0] || ''}">
    <label>Giới tính:</label>
    <select id="modal-hs-gioitinh">
      <option ${data.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
      <option ${data.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
    </select>
    <label>Lớp:</label>
    <select id="modal-hs-lop">
      <option value="">-- Chọn lớp --</option>
      ${classOptions}
    </select>
    <label>Trạng thái:</label>
    <select id="modal-hs-trangthai">
      <option ${data.TrangThai === 'Đang học' ? 'selected' : ''}>Đang học</option>
      <option ${data.TrangThai === 'Nghỉ học' ? 'selected' : ''}>Nghỉ học</option>
    </select>
  `;
}

modalHSClose.onclick = () => (modalHS.style.display = 'none');

modalHSForm.onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('modal-hs-id').value;
  const payload = {
    TenHocSinh: document.getElementById('modal-hs-ten').value || null,
    Birthday: document.getElementById('modal-hs-ngaysinh').value || null,
    GioiTinh: document.getElementById('modal-hs-gioitinh').value || null,
    MaLop: document.getElementById('modal-hs-lop').value || null,
    TrangThai: document.getElementById('modal-hs-trangthai').value || 'Đang học'
  };

  try {
    const res = await fetch(`/api/quanlygiaovien_hocsinh/hocsinh/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      modalHS.style.display = 'none';
      loadHS();
    } else {
      alert(result.message || 'Cập nhật thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi server');
  }
};

// ================= MODAL GIÁO VIÊN (THÊM/SỬA) =================
const modalGV = document.getElementById('modal');
const modalGVFields = document.getElementById('modal-fields');
const modalGVForm = document.getElementById('modal-form');
const modalGVClose = document.getElementById('modal-close');

async function openModalGV(data = null) {
  modalGV.style.display = 'flex';
  const isEdit = !!data;
  document.getElementById('modal-title').innerText = isEdit ? 'Sửa Giáo viên' : 'Thêm Giáo viên';
  document.getElementById('modal-id').value = data?.MaGiaoVien || '';
  modalGVForm.dataset.isEdit = isEdit;

  // Lấy danh sách môn học
  const monHocRes = await fetch('/api/quanlygiaovien_hocsinh/monhoc');
  const monHocData = await monHocRes.json();
  const monHocOptions = monHocData.success
    ? monHocData.data.map(m => `<option value="${m}" ${data?.TenMonHoc === m ? 'selected' : ''}>${m}</option>`).join('')
    : '';

  // Lấy danh sách trường
  const truongRes = await fetch('/api/quanlygiaovien_hocsinh/truong');
  const truongData = await truongRes.json();
  const truongOptions = truongData.success
    ? truongData.data.map(t => `<option value="${t.MaTruong}" ${data?.MaTruong === t.MaTruong ? 'selected' : ''}>${t.TenTruong}</option>`).join('')
    : '';

  modalGVFields.innerHTML = `
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    <div><label>Họ tên:</label><input type="text" id="modal-ten" value="${data?.TenGiaoVien || ''}"></div>
    <div><label>Ngày sinh:</label><input type="date" id="modal-ngaysinh" value="${data?.NgaySinh?.split('T')[0] || ''}"></div>
    <div><label>Email:</label><input type="email" id="modal-email" value="${data?.Email || ''}"></div>
    <div><label>SĐT:</label><input type="text" id="modal-sdt" value="${data?.SDT || ''}"></div>
    <div><label>Bộ môn:</label><select id="modal-bomon"><option value="">-- Chọn môn học --</option>${monHocOptions}</select></div>
    <div><label>Giới tính:</label><select id="modal-gioitinh"><option ${data?.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option><option ${data?.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option></select></div>
    <div><label>Địa chỉ:</label><input type="text" id="modal-diachi" value="${data?.DiaChi || ''}"></div>
    <div><label>Ngày vào trường:</label><input type="date" id="modal-ngayvaotruong" value="${data?.NgayVaoTruong?.split('T')[0] || ''}"></div>
    <div><label>Trạng thái:</label><select id="modal-trangthai"><option ${data?.TrangThai === 'Đang công tác' ? 'selected' : ''}>Đang công tác</option><option ${data?.TrangThai === 'Nghỉ việc' ? 'selected' : ''}>Nghỉ việc</option></select></div>
    <div><label>Tình trạng hôn nhân:</label><select id="modal-honnhan"><option value="">-- Chọn tình trạng --</option><option ${data?.TinhTrangHonNhan === 'Độc Thân' ? 'selected' : ''}>Độc Thân</option><option ${data?.TinhTrangHonNhan === 'Đã Kết Hôn' ? 'selected' : ''}>Đã Kết Hôn</option></select></div>
    <div><label>Chức vụ:</label><input type="text" id="modal-chucvu" value="${data?.ChucVu || ''}"></div>
    <div><label>Bộ môn chuyên môn:</label><input type="text" id="modal-trinhdochuyenmon" value="${data?.TrinhDoChuyenMon || ''}"></div>
    <div><label>Kinh nghiệm (tham niên):</label><input type="text" id="modal-thamnien" value="${data?.ThamNien || ''}"></div>
    <div><label>Trường:</label><select id="modal-matruong"><option value="">-- Chọn trường --</option>${truongOptions}</select></div>
  </div>
  `;
}

modalGVClose.onclick = () => (modalGV.style.display = 'none');

modalGVForm.onsubmit = async e => {
  e.preventDefault();
  const MaGiaoVien = document.getElementById('modal-id').value || null;
  const isEdit = modalGVForm.dataset.isEdit === 'true';

  const payload = {
    TenGiaoVien: document.getElementById('modal-ten').value.trim(),
    NgaySinh: document.getElementById('modal-ngaysinh').value.trim(),
    GioiTinh: document.getElementById('modal-gioitinh').value,
    Email: document.getElementById('modal-email').value.trim(),
    SDT: document.getElementById('modal-sdt').value.trim(),
    DiaChi: document.getElementById('modal-diachi').value.trim(),
    NgayVaoTruong: document.getElementById('modal-ngayvaotruong').value.trim(),
    TenMonHoc: document.getElementById('modal-bomon').value,
    TrangThai: document.getElementById('modal-trangthai').value,
    TinhTrangHonNhan: document.getElementById('modal-honnhan').value,
    ChucVu: document.getElementById('modal-chucvu').value.trim(),
    TrinhDoChuyenMon: document.getElementById('modal-trinhdochuyenmon').value.trim(),
    ThamNien: document.getElementById('modal-thamnien').value.trim(),
    MaTruong: document.getElementById('modal-matruong').value
  };

  // Kiểm tra bắt buộc
  for (const key in payload) {
    if (!payload[key]) {
      alert(`Trường ${key} không được để trống`);
      return;
    }
  }

  try {
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit
      ? `/api/quanlygiaovien_hocsinh/giaovien/${MaGiaoVien}`
      : `/api/quanlygiaovien_hocsinh/giaovien`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      modalGV.style.display = 'none';
      loadGV();
    } else {
      alert(result.message || 'Thao tác thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi server: ' + err.message);
  }
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
        <button onclick='openModalHS(${JSON.stringify(hs)})'>Sửa</button>
        <button onclick='deleteHS("${hs.MaHocSinh}")'>Xóa</button>
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

// ================= BỘ LỌC =================
async function loadNamHoc() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/namhoc');
  const data = await res.json();
  if (!data.success) return;
  document.getElementById('filter-namhoc-hs').innerHTML =
    '<option value="">-- Chọn năm học --</option>' +
    data.data.map(n => `<option value="${n.NamHoc}">${n.NamHoc}</option>`).join('');
}

async function loadKhoi() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/khoi');
  const data = await res.json();
  if (!data.success) return;
  document.getElementById('filter-khoi-hs').innerHTML =
    '<option value="">-- Chọn khối --</option>' +
    data.data.map(k => `<option value="${k.MaKhoi}">${k.TenKhoi}</option>`).join('');
}

async function loadLop(maKhoi = '') {
  const res = await fetch(`/api/quanlygiaovien_hocsinh/lop?makhoi=${maKhoi}`);
  const data = await res.json();
  if (!data.success) return;
  document.getElementById('filter-lop-hs').innerHTML =
    '<option value="">-- Chọn lớp --</option>' +
    data.data.map(l => `<option value="${l.MaLop}">${l.TenLop}</option>`).join('');
}

document.getElementById('filter-khoi-hs').addEventListener('change', e => loadLop(e.target.value));
document.getElementById('btn-xem-hs').addEventListener('click', () => {
  const namHoc = document.getElementById('filter-namhoc-hs').value;
  const khoi = document.getElementById('filter-khoi-hs').value;
  const lop = document.getElementById('filter-lop-hs').value;
  loadHS({ namHoc, khoi, lop });
});

async function loadMonHoc() {
  const res = await fetch('/api/quanlygiaovien_hocsinh/monhoc');
  const data = await res.json();
  if (!data.success) return;
  document.getElementById('filter-monhoc-gv').innerHTML =
    '<option value="">-- Tất cả --</option>' +
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
