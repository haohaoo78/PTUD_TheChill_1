// public/js/quanlyMonHoc.js
(function () {
  if (window.quanLyMonHocInitialized) return;
  window.quanLyMonHocInitialized = false;

  console.log('quanlyMonHoc.js initialized');

  const modal = document.getElementById('modal-monhoc');
  const modalClose = document.querySelector('#modal-monhoc .modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalFields = document.getElementById('modal-fields');
  const modalForm = document.getElementById('modal-form');
  const btnThem = document.getElementById('btn-them');

  if (!modal || !modalForm) return;

  let searchTimeout;

  // MỞ MODAL
  window.openModal = function (data = null) {
    modal.style.display = 'flex';
    modalTitle.textContent = data ? 'Sửa Môn học' : 'Thêm Môn học';

    modalFields.innerHTML = `
      <div class="form-group">
        <label>Mã môn học</label>
        <input type="text" value="${data?.MaMonHoc || 'Tự động sinh'}" disabled style="background:#f5f5f5; color:#666;">
      </div>
      <div class="form-group">
        <label>Tên môn học <span style="color:red">*</span></label>
        <input type="text" id="tenMon" value="${data?.TenMonHoc || ''}" required placeholder="VD: Toán học">
      </div>
      <div class="form-group">
        <label>Số tiết/tuần <span style="color:red">*</span></label>
        <input type="number" id="soTiet" value="${data?.SoTiet || ''}" min="1" max="20" required>
      </div>
      <div class="form-group">
        <label>Mã tổ hợp</label>
        <input type="text" id="maToHop" value="${data?.MaToHop || ''}" placeholder="VD: A00, D01" style="text-transform:uppercase;">
      </div>
      <div class="form-group">
        <label>Khối áp dụng <span style="color:red">*</span></label>
        <select id="khoi" required>
          <option value="">-- Chọn khối --</option>
          <option value="10" ${data?.Khoi == 10 ? 'selected' : ''}>Khối 10</option>
          <option value="11" ${data?.Khoi == 11 ? 'selected' : ''}>Khối 11</option>
          <option value="12" ${data?.Khoi == 12 ? 'selected' : ''}>Khối 12</option>
        </select>
      </div>
      <div class="form-group">
        <label>Trạng thái</label>
        <select id="trangthai">
          <option value="1" ${data?.TrangThai == 1 ? 'selected' : ''}>Đang dạy</option>
          <option value="0" ${data?.TrangThai == 0 ? 'selected' : ''}>Dừng dạy</option>
        </select>
      </div>
    `;

    const idInput = document.getElementById('modal-id');
    if (idInput) idInput.value = data ? data.TenMonHoc : '';
  };

  // ĐÓNG MODAL
  modalClose && (modalClose.onclick = () => modal.style.display = 'none');
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  // SUBMIT FORM
  modalForm.onsubmit = async e => {
    e.preventDefault();
    const id = document.getElementById('modal-id')?.value || '';
    const tenMon = document.getElementById('tenMon').value.trim();
    const soTiet = parseInt(document.getElementById('soTiet').value);
    const maToHop = document.getElementById('maToHop').value.trim().toUpperCase() || null;
    const khoi = document.getElementById('khoi').value;
    const trangThai = document.getElementById('trangthai').value === '1' ? 1 : 0;

    if (!tenMon || !soTiet || !khoi) return alert('Vui lòng điền đầy đủ thông tin bắt buộc!');

    const payload = { TenMonHoc: tenMon, SoTiet: soTiet, MaToHop: maToHop, Khoi: parseInt(khoi), TrangThai: trangThai };

    // KIỂM TRA TRÙNG TÊN
    if (!id || tenMon !== id) {
      const check = await fetch(`/api/quanlymonhoc/check?name=${encodeURIComponent(tenMon)}`).then(r => r.json());
      if (check.exists) return alert('Tên môn học đã tồn tại!');
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/quanlymonhoc/${encodeURIComponent(id)}` : '/api/quanlymonhoc';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        modal.style.display = 'none';
        loadMonHoc();
        alert(id ? 'Cập nhật thành công!' : 'Thêm môn học thành công!');
      } else {
        alert(result.message || 'Lỗi server');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    }
  };

  // LOAD BẢNG + TÌM KIẾM
  window.loadMonHoc = async function () {
    const khoi = document.getElementById('filter-khoi')?.value || '';
    const trangthai = document.getElementById('filter-trangthai')?.value || '';
    const search = document.getElementById('search-monhoc')?.value.trim() || '';

    const query = new URLSearchParams({ khoi, trangthai, search }).toString();
    const res = await fetch(`/api/quanlymonhoc?${query}`);
    const { success, data } = await res.json();

    if (!success) return alert('Lỗi tải dữ liệu');

    const tbody = document.querySelector('#monhoc-table tbody');
    if (!tbody) return;

    tbody.innerHTML = data.map(m => `
      <tr>
        <td><strong>${m.MaMonHoc}</strong></td>
        <td><strong>${m.TenMonHoc}</strong></td>
        <td>${m.SoTiet}</td>
        <td><span class="badge-mathop">${m.MaToHop || '—'}</span></td>
        <td><span class="badge-khoi">Khối ${m.Khoi}</span></td>
        <td><span class="badge ${m.TrangThai == 1 ? 'dangday' : 'dungday'}">
          ${m.TrangThai == 1 ? 'Đang dạy' : 'Dừng dạy'}
        </span></td>
        <td>
          <button class="table-btn edit" onclick='openModal(${JSON.stringify(m)})'>Sửa</button>
          <button class="table-btn delete" onclick='toggleMon("${m.TenMonHoc}", ${m.TrangThai})'>
            ${m.TrangThai == 1 ? 'Dừng' : 'Kích hoạt'}
          </button>
        </td>
      </tr>
    `).join('');
  };

  window.toggleMon = async function (tenMon, status) {
    if (!confirm(`Bạn có chắc muốn ${status == 1 ? 'DỪNG' : 'KÍCH HOẠT'} môn học này?`)) return;

    const res = await fetch(`/api/quanlymonhoc/${encodeURIComponent(tenMon)}/toggle`, { method: 'PATCH' });
    const result = await res.json();
    if (result.success) {
      loadMonHoc();
      alert('Thao tác thành công!');
    }
  };

  // SỰ KIỆN TÌM KIẾM + LỌC
  document.getElementById('search-monhoc')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadMonHoc, 300);
  });
  document.getElementById('filter-khoi')?.addEventListener('change', loadMonHoc);
  document.getElementById('filter-trangthai')?.addEventListener('change', loadMonHoc);

  // NÚT THÊM
  btnThem && (btnThem.onclick = () => openModal());

  // Load ngay khi script chạy
  loadMonHoc();
})();