(function () {
  if (window.quanLyTruongInitialized) return;
  window.quanLyTruongInitialized = true;

  console.log('quanlytruong.js initialized');

  // ====================== DOM ELEMENTS ======================
  const modal = document.getElementById('modal-truong');
  const modalHT = document.getElementById('modal-hieutruong');
  const closeBtn = document.querySelector('.modal-close');
  const closeHT = document.getElementById('close-ht');
  const cancelBtn = document.getElementById('btn-cancel');
  const form = document.getElementById('modal-form');
  const formHT = document.getElementById('form-hieutruong');
  const title = document.getElementById('modal-title');
  const maInput = document.getElementById('MaTruong');
  const tbody = document.querySelector('#truong-table tbody');

  // === FILTER INPUT ===
  const filterMaTruong = document.getElementById('filterMaTruong');
  const filterTenTruong = document.getElementById('filterTenTruong');
  const filterTrangThai = document.getElementById('filterTrangThai');
  const btnXem = document.getElementById('btn-xem');

  if (!tbody) return;

  // ====================== TOAST ======================
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // ====================== LỖI BẢNG ======================
  function showTableError(message) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:20px; color:red">
          <strong>${message}</strong><br><br>
          <button onclick="loadTruongs()" style="padding:6px 14px">Thử lại</button>
        </td>
      </tr>
    `;
  }

  // ====================== LOAD DANH SÁCH TRƯỜNG ======================
  window.loadTruongs = async function () {
    try {
      const query = new URLSearchParams({
        MaTruong: filterMaTruong?.value.trim() || '',
        TenTruong: filterTenTruong?.value.trim() || '',
        TrangThai: filterTrangThai?.value || ''
      });

      const res = await fetch(`/api/quanlytruong/getAll?${query.toString()}`);
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);

      const truongs = await res.json();
      if (!Array.isArray(truongs)) throw new Error("Dữ liệu trả về không hợp lệ");

      if (truongs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#aaa">Không có dữ liệu</td></tr>`;
        return;
      }

      tbody.innerHTML = truongs.map(t => `
        <tr>
          <td>${t.MaTruong}</td>
          <td>${t.TenTruong}</td>
          <td>${t.DiaChi}</td>
          <td>${t.Email}</td>
          <td>${t.SDT}</td>
          <td>${t.TenHieuTruong || '<span style="color:#999">Chưa có</span>'}</td>
          <td>
            <span class="status ${t.TrangThai ? "active" : "inactive"}">
              ${t.TrangThai ? "Hoạt động" : "Ngừng"}
            </span>
          </td>
          <td class="action-col">
            <button class="btn edit-btn" onclick="openEdit('${t.MaTruong}')">Sửa</button>
            <button class="btn delete-btn" onclick="confirmDelete('${t.MaTruong}')">Xóa</button>
            <button class="btn ht-btn" onclick="openHieuTruong('${t.MaTruong}')">
              Hiệu trưởng
            </button>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      console.error(err);
      showTableError(err.message || "Không thể tải dữ liệu");
    }
  };

  // ====================== OPEN EDIT TRƯỜNG ======================
  window.openEdit = async function (MaTruong) {
    try {
      const res = await fetch(`/api/quanlytruong/getAll`);
      const list = await res.json();
      const t = list.find(x => x.MaTruong === MaTruong);
      if (!t) return showToast("Không tìm thấy trường", "error");

      document.getElementById("modal-id").value = t.MaTruong;
      maInput.value = t.MaTruong;
      maInput.disabled = true;
      document.getElementById("TenTruong").value = t.TenTruong;
      document.getElementById("DiaChi").value = t.DiaChi;
      document.getElementById("Email").value = t.Email;
      document.getElementById("SDT").value = t.SDT;
      document.getElementById("TrangThai").value = t.TrangThai;

      title.textContent = "Sửa Thông Tin Trường";
      modal.style.display = "flex";

    } catch (err) {
      showToast("Lỗi tải dữ liệu trường", "error");
    }
  };

  // ====================== OPEN MODAL HIỆU TRƯỞNG - LOAD ĐẦY ĐỦ ======================
  window.openHieuTruong = async function (MaTruong) {
    document.getElementById('HT_MaTruong').value = MaTruong;

    try {
      const res = await fetch(`/api/quanlytruong/${MaTruong}/hieutruong`);
      if (res.ok) {
        const ht = await res.json();
        
        document.getElementById('ht-modal-title').textContent = 'Cập nhật Thông Tin Hiệu Trưởng';

        document.getElementById('TenHieuTruong').value = ht.TenHieuTruong || '';
        document.getElementById('GioiTinhHT').value = ht.GioiTinh || '';
        document.getElementById('NgaySinhHT').value = ht.NgaySinh ? ht.NgaySinh.slice(0, 10) : '';
        document.getElementById('NgayNhanChucHT').value = ht.NgayNhanChuc ? ht.NgayNhanChuc.slice(0, 10) : '';
        document.getElementById('EmailHT').value = ht.Email || '';
        document.getElementById('SDTHT').value = ht.SDT || '';
        document.getElementById('DiaChiHT').value = ht.DiaChi || '';
        document.getElementById('GhiChuHT').value = ht.GhiChu || '';

      } else {
        document.getElementById('ht-modal-title').textContent = 'Thêm Hiệu Trưởng Mới';
        formHT.reset();
        // Ngày nhận chức mặc định là hôm nay
        document.getElementById('NgayNhanChucHT').value = '2025-12-22';
      }

      modalHT.style.display = "flex";
    } catch (err) {
      console.error('Lỗi load hiệu trưởng:', err);
      showToast("Không thể tải thông tin hiệu trưởng", "error");
    }
  };

  // ====================== DELETE TRƯỜNG ======================
  window.confirmDelete = async function (MaTruong) {
    if (!confirm("Bạn chắc chắn muốn xóa trường này?\n\nThao tác này không thể hoàn tác.")) return;

    try {
      const res = await fetch(`/api/quanlytruong/delete/${MaTruong}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Xóa thất bại");

      showToast("Đã xóa trường thành công");
      loadTruongs();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ====================== SUBMIT FORM TRƯỜNG ======================
  form?.addEventListener("submit", async e => {
    e.preventDefault();

    const id = document.getElementById("modal-id").value;

    const payload = {
      MaTruong: maInput.value.trim().toUpperCase(),
      TenTruong: document.getElementById("TenTruong").value.trim(),
      DiaChi: document.getElementById("DiaChi").value.trim(),
      Email: document.getElementById("Email").value.trim(),
      SDT: document.getElementById("SDT").value.trim(),
      TrangThai: parseInt(document.getElementById("TrangThai").value)
    };

    try {
      const url = id ? `/api/quanlytruong/update/${id}` : `/api/quanlytruong/create`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");

      modal.style.display = "none";
      showToast(data.message || "Lưu thành công");
      loadTruongs();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // ====================== SUBMIT FORM HIỆU TRƯỞNG - ĐÃ SỬA FULL ======================
  formHT?.addEventListener("submit", async e => {
    e.preventDefault();

    const MaTruong = document.getElementById('HT_MaTruong').value;

    const payload = {
      TenHieuTruong: document.getElementById('TenHieuTruong').value.trim(),
      GioiTinh: document.getElementById('GioiTinhHT').value,
      NgaySinh: document.getElementById('NgaySinhHT').value || null,
      NgayNhanChuc: document.getElementById('NgayNhanChucHT').value,
      Email: document.getElementById('EmailHT').value.trim() || null,
      SDT: document.getElementById('SDTHT').value.trim() || null,
      DiaChi: document.getElementById('DiaChiHT').value.trim() || null,
      GhiChu: document.getElementById('GhiChuHT').value.trim() || null
    };

    // Validate client-side để UX tốt hơn
    if (!payload.TenHieuTruong) {
      return showToast("Tên hiệu trưởng là bắt buộc", "error");
    }
    if (!payload.GioiTinh) {
      return showToast("Giới tính là bắt buộc", "error");
    }
    if (!payload.NgayNhanChuc) {
      return showToast("Ngày nhận chức là bắt buộc", "error");
    }

    try {
      const res = await fetch(`/api/quanlytruong/${MaTruong}/hieutruong`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Lưu thất bại");
      }

      modalHT.style.display = "none";
      showToast(result.message || "Lưu thông tin hiệu trưởng thành công!", "success");
      loadTruongs(); // Cập nhật bảng để hiện tên mới
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // ====================== UI EVENTS ======================
  document.getElementById('btn-them')?.addEventListener('click', () => {
    form.reset();
    maInput.disabled = false;
    document.getElementById('modal-id').value = "";
    title.textContent = "Thêm Trường Mới";
    modal.style.display = "flex";
  });

  closeBtn && (closeBtn.onclick = () => modal.style.display = "none");
  cancelBtn && (cancelBtn.onclick = () => modal.style.display = "none");
  closeHT && (closeHT.onclick = () => modalHT.style.display = "none");

  window.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === modalHT) modalHT.style.display = "none";
  };

  btnXem?.addEventListener("click", loadTruongs);

  // Load lần đầu
  loadTruongs();
})();