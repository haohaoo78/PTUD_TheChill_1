// ================= MODAL HỌC SINH =================
const modalHS = document.getElementById('modal-hs');
const modalHSFields = document.getElementById('modal-hs-fields');
const modalHSForm = document.getElementById('modal-hs-form');
const modalHSClose = document.getElementById('modal-hs-close');

async function openModalHS(data = {}) {
  modalHS.style.display = 'flex';
  document.getElementById('modal-hs-title').innerText = data.MaHocSinh ? 'Sửa Học sinh' : 'Thêm Học sinh';
  document.getElementById('modal-hs-id').value = data.MaHocSinh || '';

  let classOptions = '';
  if (data.NamHoc) {
    const res = await fetch(`/api/xetdiemrenluyen/lop?namHoc=${data.NamHoc}${data.MaGiaoVien ? `&maGiaoVien=${data.MaGiaoVien}` : ''}`);
    const classData = await res.json();
    if (classData.success) {
      classOptions = classData.data.map(l => `<option value="${l.MaLop}" ${data.MaLop===l.MaLop?'selected':''}>${l.TenLop}</option>`).join('');
    }
  }

  modalHSFields.innerHTML = `
    <label>Họ tên:</label>
    <input type="text" id="modal-hs-ten" value="${data.TenHocSinh || ''}">
    <label>Ngày sinh:</label>
    <input type="date" id="modal-hs-ngaysinh" value="${data.Birthday?.split('T')[0] || ''}">
    <label>Giới tính:</label>
    <select id="modal-hs-gioitinh">
      <option ${data.GioiTinh==='Nam'?'selected':''}>Nam</option>
      <option ${data.GioiTinh==='Nữ'?'selected':''}>Nữ</option>
    </select>
    <label>Lớp:</label>
    <select id="modal-hs-lop">
      <option value="">-- Chọn lớp --</option>
      ${classOptions}
    </select>
    <label>Trạng thái:</label>
    <select id="modal-hs-trangthai">
      <option ${data.TrangThai==='Đang học'?'selected':''}>Đang học</option>
      <option ${data.TrangThai==='Nghỉ học'?'selected':''}>Nghỉ học</option>
    </select>
  `;
}

modalHSClose.onclick = () => modalHS.style.display='none';

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

  // filters hiện tại
  const filters = {
    namHoc: document.getElementById('filter-namhoc-hs').value || '',
    maGiaoVien: document.getElementById('filter-giaovien-hs').value || '',
    maLop: document.getElementById('filter-lop-hs').value || ''
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/xetdiemrenluyen/hocsinh/${id}` : '/api/xetdiemrenluyen/hocsinh';
    const res = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if(result.success){ modalHS.style.display='none'; loadHS(filters); }
    else alert(result.message||'Thao tác thất bại');
  } catch(err){ console.error(err); alert('Lỗi server'); }
};

// ================= LOAD HỌC SINH =================
async function loadHS(filters={}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/xetdiemrenluyen/hocsinh?${query}`);
  const data = await res.json();
  if(!data.success) return;

  document.querySelector('#hs-table tbody').innerHTML = data.data.map(hs => `
    <tr>
      <td>${hs.MaHocSinh}</td>
      <td>${hs.TenHocSinh}</td>
      <td>${hs.Birthday?.split('T')[0]||''}</td>
      <td>${hs.TenLop||''}</td>
      <td>${hs.GioiTinh}</td>
      <td>${hs.TrangThai}</td>
      <td>${hs.HanhKiem||''}</td>
      <td>${hs.RenLuyen||''}</td>
      <td>
        <button class="table-btn hk" onclick='openModalHKRL("${hs.MaHocSinh}")'>Hạnh kiểm / Rèn luyện</button>
      </td>
    </tr>
  `).join('');
}

// ================= MODAL HẠNH KIỂM / RÈN LUYỆN =================
const modalHKRL = document.getElementById('modal-hk-rl');
const modalHKRLClose = document.getElementById('modal-hk-rl-close');
const modalHKRLForm = document.getElementById('modal-hk-rl-form');

modalHKRLClose.onclick = () => modalHKRL.style.display='none';

async function openModalHKRL(maHS){
  modalHKRL.style.display='flex';
  document.getElementById('modal-hk-rl-hs').value = maHS;

  const hocKy = document.getElementById('modal-hk-rl-hocky').value || '1';
  const namHoc = document.getElementById('filter-namhoc-hs').value || '';
  const res = await fetch(`/api/xetdiemrenluyen/hocba?maHS=${maHS}&hocKy=${hocKy}&namHoc=${namHoc}`);
  const data = await res.json();
  if(data.success && data.data){
    document.getElementById('modal-hk-rl-hocky').value = data.data.HocKy || '1';
    document.getElementById('modal-hk-rl-hanhkiem').value = data.data.HanhKiem || 'Tốt';
    document.getElementById('modal-hk-rl-renluyen').value = data.data.RenLuyen || 'Tốt';
    document.getElementById('modal-hk-rl-ghichu').value = data.data.NhanXet || '';
  }
}

modalHKRLForm.onsubmit = async e => {
  e.preventDefault();
  const payload = {
    maHS: document.getElementById('modal-hk-rl-hs').value,
    hocKy: document.getElementById('modal-hk-rl-hocky').value,
    namHoc: document.getElementById('filter-namhoc-hs').value,
    HanhKiem: document.getElementById('modal-hk-rl-hanhkiem').value,
    RenLuyen: document.getElementById('modal-hk-rl-renluyen').value,
    NhanXet: document.getElementById('modal-hk-rl-ghichu').value || ''
  };

  const filters = {
    namHoc: document.getElementById('filter-namhoc-hs').value || '',
    maGiaoVien: document.getElementById('filter-giaovien-hs').value || '',
    maLop: document.getElementById('filter-lop-hs').value || ''
  };

  try {
    const res = await fetch('/api/xetdiemrenluyen/hocba', {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if(result.success){ modalHKRL.style.display='none'; loadHS(filters); }
    else alert(result.message||'Lưu thất bại');
  } catch(err){ console.error(err); alert('Lỗi server'); }
};

// ================= BỘ LỌC =================
async function loadNamHoc(){
  const res = await fetch('/api/xetdiemrenluyen/namhoc');
  const data = await res.json();
  if(!data.success) return;
  document.getElementById('filter-namhoc-hs').innerHTML =
    '<option value="">-- Chọn năm học --</option>' + data.data.map(n=>`<option value="${n.NamHoc}">${n.NamHoc}</option>`).join('');
}

async function loadTeachers(){
  const namHoc = document.getElementById('filter-namhoc-hs').value||'';
  const res = await fetch(`/api/quanlygiaovien_hocsinh/giaovien?namHoc=${namHoc}`);
  const data = await res.json();
  if(!data.success) return;
  document.getElementById('filter-giaovien-hs').innerHTML =
    '<option value="">-- Chọn giáo viên --</option>' + data.data.map(t=>`<option value="${t.MaGiaoVien}">${t.TenGiaoVien}</option>`).join('');
}

async function loadClasses(){
  const maGiaoVien = document.getElementById('filter-giaovien-hs').value||'';
  const namHoc = document.getElementById('filter-namhoc-hs').value||'';
  if(!namHoc) return;
  const res = await fetch(`/api/xetdiemrenluyen/lop?namHoc=${namHoc}${maGiaoVien?`&maGiaoVien=${maGiaoVien}`:''}`);
  const data = await res.json();
  if(!data.success) return;
  document.getElementById('filter-lop-hs').innerHTML =
    '<option value="">-- Chọn lớp --</option>' + data.data.map(l=>`<option value="${l.MaLop}">${l.TenLop}</option>`).join('');
}

// ================= EVENT LISTENERS =================
document.getElementById('filter-namhoc-hs').addEventListener('change', ()=>{
  loadTeachers();
  document.getElementById('filter-lop-hs').innerHTML='<option value="">-- Chọn lớp --</option>';
});
document.getElementById('filter-giaovien-hs').addEventListener('change', loadClasses);
document.getElementById('btn-xem-hs').addEventListener('click', ()=>{
  const namHoc = document.getElementById('filter-namhoc-hs').value||'';
  const maGiaoVien = document.getElementById('filter-giaovien-hs').value||'';
  const maLop = document.getElementById('filter-lop-hs').value||'';
  loadHS({namHoc, maGiaoVien, maLop});
});

// ================= KHỞI TẠO =================
loadNamHoc();
loadTeachers();
loadClasses();
