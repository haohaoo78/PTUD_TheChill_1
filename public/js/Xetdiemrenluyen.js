// Cache danh sách học sinh đã tải để mở modal nhanh
const studentCache = new Map();

// ================= MODAL HẠNH KIỂM / RÈN LUYỆN =================
const modalHKRL = document.getElementById('modal-hk-rl');
const modalHKRLClose = document.getElementById('modal-hk-rl-close');
const modalHKRLForm = document.getElementById('modal-hk-rl-form');

modalHKRLClose.onclick = () => (modalHKRL.style.display = 'none');

async function openModalHKRL(maHS) {
  const hs = studentCache.get(maHS);
  if (!hs) return;
  modalHKRL.style.display = 'flex';
  document.getElementById('modal-hk-rl-hs').value = maHS;
  document.getElementById('modal-hk-rl-mahs').value = maHS;
  document.getElementById('modal-hk-rl-tenhs').value = hs.TenHocSinh || '';

  // Gắn dữ liệu đã lưu (nếu có), mặc định để trống
  document.getElementById('modal-hk-rl-hanhkiem').value = hs.HanhKiem || '';
  document.getElementById('modal-hk-rl-renluyen').value = hs.RenLuyen || '';
  document.getElementById('modal-hk-rl-ghichu').value = hs.NhanXet || '';
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

  if (!payload.maHS || !payload.namHoc || !payload.hocKy) {
    alert('Thiếu thông tin bắt buộc (mã HS, năm học, học kỳ)');
    return;
  }

  try {
    const res = await fetch('/api/xetdiemrenluyen/hocba', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      // Cập nhật cache và UI
      const hs = studentCache.get(payload.maHS) || {};
      hs.HanhKiem = payload.HanhKiem || '';
      hs.RenLuyen = payload.RenLuyen || '';
      hs.NhanXet = payload.NhanXet || '';
      studentCache.set(payload.maHS, hs);
      modalHKRL.style.display = 'none';
      loadHS({ namHoc: payload.namHoc });
    } else {
      alert(result.message || 'Lưu thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi server');
  }
};

// ================= LOAD HỌC SINH =================
async function loadHS(filters = {}) {
  const namHocSelect = document.getElementById('filter-namhoc-hs');
  const effectiveNamHoc = filters.namHoc || namHocSelect.value || '';
  const query = new URLSearchParams({ namHoc: effectiveNamHoc }).toString();
  const res = await fetch(`/api/xetdiemrenluyen/hocsinh?${query}`);
  const data = await res.json();
  if (!data.success) {
    alert(data.message || 'Không lấy được danh sách học sinh');
    return;
  }

  // Cập nhật năm học và lớp đang dùng (server quyết định)
  if (data.namHoc) namHocSelect.value = data.namHoc;
  if (data.maLop) {
    const lopSelect = document.getElementById('filter-lop-hs');
    if (lopSelect) lopSelect.value = data.maLop;
  }

  studentCache.clear();
  data.data.forEach(hs => studentCache.set(hs.MaHocSinh, hs));

  document.querySelector('#hs-table tbody').innerHTML = data.data
    .map(
      hs => `
    <tr>
      <td>${hs.MaHocSinh}</td>
      <td>${hs.TenHocSinh}</td>
      <td>${hs.Birthday ? hs.Birthday.split('T')[0] : ''}</td>
      <td>${hs.TenLop || ''}</td>
      <td>${hs.GioiTinh || ''}</td>
      <td>${hs.TrangThai || ''}</td>
      <td>${hs.HanhKiem || ''}</td>
      <td>${hs.RenLuyen || ''}</td>
      <td>
        <button class="table-btn hk" onclick='openModalHKRL("${hs.MaHocSinh}")'>Đánh giá</button>
      </td>
    </tr>
  `
    )
    .join('');
}

// ================= NĂM HỌC =================
async function loadNamHoc() {
  const res = await fetch('/api/xetdiemrenluyen/namhoc');
  const data = await res.json();
  if (!data.success) return;
  const select = document.getElementById('filter-namhoc-hs');
  select.innerHTML =
    '<option value="">-- Chọn năm học --</option>' +
    data.data.map(n => `<option value="${n.NamHoc}">${n.NamHoc}</option>`).join('');

  // Auto-select năm học mới nhất và tải danh sách học sinh
  if (data.data.length > 0) {
    select.value = data.data[0].NamHoc;
    await loadHS({ namHoc: select.value });
  }
}

// ================= EVENT LISTENERS =================
document.getElementById('filter-namhoc-hs').addEventListener('change', () => {
  const namHoc = document.getElementById('filter-namhoc-hs').value || '';
  loadHS({ namHoc });
});

document.getElementById('btn-xem-hs').addEventListener('click', () => {
  const namHoc = document.getElementById('filter-namhoc-hs').value || '';
  loadHS({ namHoc });
});

// ================= KHỞI TẠO =================
loadNamHoc();
