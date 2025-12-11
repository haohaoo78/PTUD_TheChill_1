// public/js/dangkynguyenvong.js
(function () {
  if (window.dangKyNguyenVongInitialized) return;
  window.dangKyNguyenVongInitialized = true;

  console.log('dangkynguyenvong.js loaded');

  const truongSelect = document.getElementById('truong-select');
  const toHopSelect = document.getElementById('tohop-select');
  const form = document.getElementById('form-dangky-nguyenvong');
  const tableBody = document.querySelector('.table-section tbody');

  if (!form && !tableBody) return; // Không có form thì bỏ qua

  // ============================
  // LOAD TRƯỜNG & TỔ HỢP
  // ============================
  fetch('/api/dangkytuyensinh/data')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      data.truong?.forEach(t => {
        if (!truongSelect.querySelector(`option[value="${t.MaTruong}"]`)) {
          truongSelect.add(new Option(t.TenTruong, t.MaTruong));
        }
      });
      data.toHop?.forEach(th => {
        if (!toHopSelect.querySelector(`option[value="${th.MaToHop}"]`)) {
          toHopSelect.add(new Option(th.TenToHop, th.MaToHop));
        }
      });
    })
    .catch(err => console.error('Lỗi load dữ liệu trường/tổ hợp:', err));

  // ============================
  // MENU 3 CHẤM
  // ============================
  document.addEventListener('click', (e) => {
    const dots = e.target.closest('.btn-action-dots');
    if (dots) {
      const menu = dots.parentElement;
      document.querySelectorAll('.action-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });
      menu.classList.toggle('show');
      return;
    }
    if (!e.target.closest('.action-menu')) {
      document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
    }
  });

  // ============================
  // HỦY NGUYỆN VỌNG
  // ============================
  document.addEventListener('click', async (e) => {
    const item = e.target.closest('.action-item.huy');
    if (!item) return;

    if (!confirm('Bạn có chắc muốn hủy nguyện vọng này?')) return;

    const maNguyenVong = item.dataset.mangv;

    try {
      const res = await fetch('/api/dangkytuyensinh/huy-nguyen-vong', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maNguyenVong })
      });

      const json = await res.json();
      if (json.success) {
        alert('Đã hủy nguyện vọng!');
        location.reload();
      } else {
        alert(json.message || 'Lỗi hệ thống');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối!');
    }
  });

  // ============================
  // XEM THÔNG TIN PHÒNG THI
  // ============================
  function formatDateVN(isoString) {
    if (!isoString) return 'Chưa có';
    const d = new Date(isoString);
    if (isNaN(d)) return 'Chưa có';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  document.addEventListener('click', async (e) => {
    const item = e.target.closest('.action-item.xem');
    if (!item) return;

    const maTruong = item.dataset.matruong;

    try {
      const res = await fetch('/api/dangkytuyensinh/thong-tin-phong-thi?maTruong=' + maTruong, {
        credentials: 'include'
      });

      const json = await res.json();
      if (!json.success) {
        alert('Không tìm thấy thông tin phòng thi!');
        return;
      }

      const pt = json.data;
      alert(
        `THÔNG TIN PHÒNG THI\n\n` +
        `Trường: ${pt.TenTruong || 'Chưa có'}\n` +
        `Địa điểm thi: ${pt.DiaDiemThi || 'Chưa có'}\n` +
        `Phòng thi: ${pt.MaPhongThi || 'Chưa có'}\n` +
        `Ngày thi: ${formatDateVN(pt.NgayThi)}`
      );
    } catch (err) {
      console.error(err);
      alert('Lỗi tải dữ liệu phòng thi!');
    }
  });

  // ============================
  // LƯU NGUYỆN VỌNG
  // ============================
  if (form) {
    form.addEventListener('submit', async (e) => {
   e.preventDefault();

   const MaTruong = truongSelect?.value;
   const ToHopMon = toHopSelect?.value;

   if (!MaTruong || !ToHopMon) {
     return alert('Vui lòng chọn đầy đủ trường và tổ hợp!');
   }

   if (tableBody && tableBody.children.length >= 3) {
     return alert('Chỉ được đăng ký tối đa 3 nguyện vọng!');
   }

   try {
     const res = await fetch('/api/dangkytuyensinh/luu-nguyen-vong', {
       method: 'POST',
       credentials: 'include',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ nguyenVong: [{ MaTruong, ToHopMon }] })
     });

     const json = await res.json();
     if (json.success) {
       alert('Lưu nguyện vọng thành công!');
       location.reload();
     } else {
       alert(json.message || 'Lỗi khi lưu');
     }
   } catch (err) {
     console.error(err);
     alert('Lỗi kết nối server!');
   }
 });
  }
})();