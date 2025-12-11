// public/js/quanlytruong.js
(function () {
  if (window.quanLyTruongInitialized) return;
  window.quanLyTruongInitialized = true;

  console.log('quanlytruong.js initialized');

  // ====================== DOM ELEMENTS ======================
  const modal = document.getElementById('modal-truong');
  const closeBtn = document.querySelector('.modal-close');
  const cancelBtn = document.getElementById('btn-cancel');
  const form = document.getElementById('modal-form');
  const title = document.getElementById('modal-title');
  const maInput = document.getElementById('MaTruong');
  const tbody = document.querySelector('#truong-table tbody');

  // === FILTER INPUT ===
  const filterMaTruong = document.getElementById('filterMaTruong');
  const filterTenTruong = document.getElementById('filterTenTruong');
  const filterTrangThai = document.getElementById('filterTrangThai');
  const btnXem = document.getElementById('btn-xem');

  if (!tbody) return; // Không có bảng thì thoát

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

  // ====================== LOAD DANH SÁCH ======================
  window.loadTruongs = async function () {
    try {
      const query = new URLSearchParams({
        MaTruong: filterMaTruong?.value.trim() || '',
        TenTruong: filterTenTruong?.value.trim() || '',
        TrangThai: filterTrangThai?.value || ''
      });

      const res = await fetch(`/api/quanlytruong/getAll?${query.toString()}`);
      if (!res.ok) throw new Error("Không tải được dữ liệu");

      const truongs = await res.json();
      if (!Array.isArray(truongs)) throw new Error("Dữ liệu không hợp lệ");

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
          <td>${t.TenHieuTruong || "Chưa có"}</td>
          <td>
            <span class="status ${t.TrangThai ? "active" : "inactive"}">
              ${t.TrangThai ? "Hoạt động" : "Ngừng"}
            </span>
          </td>
          <td>
            <button class="btn edit-btn" onclick="openEdit('${t.MaTruong}')">Sửa</button>
            <button class="btn delete-btn" onclick="confirmDelete('${t.MaTruong}')">Xóa</button>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      showTableError(err.message);
    }
  };

  // ====================== OPEN EDIT ======================
  window.openEdit = async function (MaTruong) {
    try {
      const res = await fetch(`/api/quanlytruong/getAll`);
      const list = await res.json();
      const t = list.find(x => x.MaTruong === MaTruong);
      if (!t) return showToast("Không tìm thấy", "error");

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

    } catch {
      showToast("Lỗi tải dữ liệu", "error");
    }
  };

  // ====================== DELETE ======================
  window.confirmDelete = async function (MaTruong) {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;

    try {
      const res = await fetch(`/api/quanlytruong/delete/${MaTruong}`, { method: "DELETE" });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      showToast("Đã xóa thành công");
      loadTruongs();

    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ====================== SUBMIT FORM ======================
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
      if (data.error) throw new Error(data.error);

      modal.style.display = "none";
      showToast(data.message);
      loadTruongs();

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
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

  btnXem?.addEventListener("click", loadTruongs);

  // Load ngay khi script chạy
  loadTruongs();
})();