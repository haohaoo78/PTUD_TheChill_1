// Cache danh sách học sinh đã tải để mở modal nhanh
const studentCache = new Map();

let currentNamHoc = '';
let currentHocKy = '';

const getCacheKey = (maHS, hocKy) => `${maHS}_${hocKy}`;

// ================= MODAL HẠNH KIỂM / RÈN LUYỆN =================
let modalHKRL = null;
let modalHKRLClose = null;
let modalHKRLCancel = null;
let modalHKRLForm = null;

async function openModalHKRL(maHS, hocKy) {
  const targetHocKy = hocKy || currentHocKy;
  const hs = studentCache.get(getCacheKey(maHS, targetHocKy));
  if (!hs) return;
  modalHKRL.style.display = 'flex';
  document.getElementById('modal-hk-rl-hs').value = maHS;
  document.getElementById('modal-hk-rl-mahs').value = maHS;
  document.getElementById('modal-hk-rl-tenhs').value = hs.TenHocSinh || '';

  const hocKySelect = document.getElementById('modal-hk-rl-hocky');
  if (hocKySelect && targetHocKy) hocKySelect.value = String(targetHocKy);

  // Gắn dữ liệu đã lưu từ bảng (nếu có), mặc định để trống
  document.getElementById('modal-hk-rl-hanhkiem').value = hs.HanhKiem || '';
  document.getElementById('modal-hk-rl-renluyen').value = hs.RenLuyen || '';

  // Fallback: nếu thiếu dữ liệu thì lấy lại từ HocBa theo MaHS + NamHoc + HocKy
  if (!hs.HanhKiem && !hs.RenLuyen && currentNamHoc && targetHocKy) {
    try {
      const res = await fetch(
        `/api/xetdiemrenluyen/hocba?maHS=${encodeURIComponent(maHS)}&namHoc=${encodeURIComponent(currentNamHoc)}&hocKy=${encodeURIComponent(targetHocKy)}`
      );
      const result = await res.json();
      if (result.success && result.data) {
        document.getElementById('modal-hk-rl-hanhkiem').value = result.data.HanhKiem || '';
        document.getElementById('modal-hk-rl-renluyen').value = result.data.RenLuyen || '';
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// ================= LOAD HỌC SINH =================
async function loadHS(filters = {}) {
  const params = new URLSearchParams();
  if (filters.namHoc) params.set('namHoc', filters.namHoc);
  const query = params.toString();
  const res = await fetch(`/api/xetdiemrenluyen/hocsinh${query ? `?${query}` : ''}`);
  const data = await res.json();
  if (!data.success) {
    alert(data.message || 'Không lấy được danh sách học sinh');
    return;
  }

  if (data.namHoc) currentNamHoc = data.namHoc;
  if (data.hocKy) currentHocKy = data.hocKy;

  studentCache.clear();
  data.data.forEach(hs => studentCache.set(getCacheKey(hs.MaHocSinh, hs.HocKy), hs));

  const namHocDisplay = currentNamHoc || '';
  document.querySelector('#hs-table tbody').innerHTML = data.data
    .map(
      (hs, idx) => `
    <tr>
      <td style="display:none;">${hs.MaHocSinh}</td>
      <td>${idx + 1}</td>
      <td>${hs.TenHocSinh}</td>
      <td>${hs.Birthday ? hs.Birthday.split('T')[0] : ''}</td>
      <td>${hs.GioiTinh || ''}</td>
      <td>${hs.TenLop || ''}</td>
      <td>${namHocDisplay}</td>
      <td>${hs.HocKy || ''}</td>
      <td>${hs.TrangThai || ''}</td>
      <td>${hs.HanhKiem || ''}</td>
      <td>${hs.RenLuyen || ''}</td>
      <td>
        <button class="table-btn hk" onclick='openModalHKRL("${hs.MaHocSinh}", "${hs.HocKy}")'>Đánh giá</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function bindModalEvents() {
  modalHKRL = document.getElementById('modal-hk-rl');
  modalHKRLClose = document.getElementById('modal-hk-rl-close');
  modalHKRLCancel = document.getElementById('modal-hk-rl-cancel');
  modalHKRLForm = document.getElementById('modal-hk-rl-form');

  if (modalHKRLClose && modalHKRL) {
    modalHKRLClose.onclick = () => (modalHKRL.style.display = 'none');
  }
  if (modalHKRLCancel && modalHKRL) {
    modalHKRLCancel.onclick = () => (modalHKRL.style.display = 'none');
  }

  if (modalHKRLForm) {
    modalHKRLForm.onsubmit = async e => {
      e.preventDefault();
      const payload = {
        maHS: document.getElementById('modal-hk-rl-hs').value,
        hocKy: document.getElementById('modal-hk-rl-hocky').value,
        namHoc: currentNamHoc,
        HanhKiem: document.getElementById('modal-hk-rl-hanhkiem').value,
        RenLuyen: document.getElementById('modal-hk-rl-renluyen').value
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
          const cacheKey = getCacheKey(payload.maHS, payload.hocKy);
          const hs = studentCache.get(cacheKey) || {};
          hs.HanhKiem = payload.HanhKiem || '';
          hs.RenLuyen = payload.RenLuyen || '';
          studentCache.set(cacheKey, hs);
          if (modalHKRL) modalHKRL.style.display = 'none';
          loadHS();
        } else {
          alert(result.message || 'Lưu thất bại');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi server');
      }
    };
  }

  const hocKySelect = document.getElementById('modal-hk-rl-hocky');
  if (hocKySelect) {
    hocKySelect.addEventListener('change', async () => {
      const maHS = document.getElementById('modal-hk-rl-hs').value;
      const hocKy = hocKySelect.value;
      const hs = studentCache.get(getCacheKey(maHS, hocKy));
      document.getElementById('modal-hk-rl-hanhkiem').value = hs?.HanhKiem || '';
      document.getElementById('modal-hk-rl-renluyen').value = hs?.RenLuyen || '';
      if (!hs?.HanhKiem && !hs?.RenLuyen && currentNamHoc && hocKy) {
        try {
          const res = await fetch(
            `/api/xetdiemrenluyen/hocba?maHS=${encodeURIComponent(maHS)}&namHoc=${encodeURIComponent(currentNamHoc)}&hocKy=${encodeURIComponent(hocKy)}`
          );
          const result = await res.json();
          if (result.success && result.data) {
            document.getElementById('modal-hk-rl-hanhkiem').value = result.data.HanhKiem || '';
            document.getElementById('modal-hk-rl-renluyen').value = result.data.RenLuyen || '';
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }
}

// ================= KHỞI TẠO =================
function initXetDiemRenLuyen() {
  const container = document.querySelector('.ql-container');
  if (!container || container.dataset.xetDiemRenLuyenInit === '1') return;
  container.dataset.xetDiemRenLuyenInit = '1';
  bindModalEvents();
  loadHS();
}

window.initXetDiemRenLuyen = initXetDiemRenLuyen;
initXetDiemRenLuyen();
