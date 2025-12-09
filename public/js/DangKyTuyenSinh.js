// public/js/DangKyTuyenSinh.js
function initDangKyTuyenSinh() {
  const form = document.getElementById('form-dangky-nguyenvong');

  function showMessage(msg, type = 'info') {
    let toast = document.getElementById('toast-message');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-message';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => (toast.style.display = 'none'), 600);
    }, 3000);
  }

  // nếu không có form (một số trang có thể load khác) thì trả về
  if (!form) return;

  // BIND submit (chỉ 1 lần)
  if (!form._dangKyFormBound) {
    form._dangKyFormBound = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selTruong = document.getElementById('truong-select');
      const selToHop = document.getElementById('tohop-select');

      const MaTruong = selTruong?.value;
      const ToHopMon = selToHop?.value;

      if (!MaTruong || !ToHopMon) {
        return showMessage('Chọn đầy đủ trường và tổ hợp!', 'warn');
      }

      try {
        const res = await fetch('/api/dangkytuyensinh/luu-nguyen-vong', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nguyenVong: [{ MaTruong, ToHopMon }] }),
        });

        // nếu chưa đăng nhập hoặc forbidden
        if (res.status === 401 || res.status === 403) {
          return showMessage('Bạn cần đăng nhập để thực hiện thao tác.', 'warn');
        }

        // nếu server trả lỗi không phải json (vd: html), thử lấy text để debug
        const text = await res.text();
        let json;
        try {
          json = text ? JSON.parse(text) : {};
        } catch (err) {
          console.error('Không parse được JSON từ server:', text);
          return showMessage('Lỗi server (phản hồi không hợp lệ).', 'error');
        }

        if (json.success) {
          showMessage('Lưu thành công!', 'success');

          // lấy id trả về (nếu có). Server có thể trả maNguyenVong hoặc maNguyenVongList
          const newId = json.maNguyenVong || (Array.isArray(json.maNguyenVongList) ? json.maNguyenVongList[0] : '');

          // append vào bảng (không reload)
          const tableSection = document.querySelector('.table-section');
          if (tableSection) {
            let tbody = tableSection.querySelector('tbody');
            if (!tbody) {
              tableSection.innerHTML = `
                <h4>Nguyện vọng đã đăng ký</h4>
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Thứ tự</th>
                      <th>Mã trường</th>
                      <th>Tên trường</th>
                      <th>Tổ hợp</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              `;
              tbody = tableSection.querySelector('tbody');
            }

            const newIndex = tbody.childElementCount + 1;
            const truongName = selTruong.selectedOptions[0]?.textContent || MaTruong;
            const toHopName = selToHop.selectedOptions[0]?.textContent || ToHopMon;

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>NV${newIndex}</strong></td>
              <td>${MaTruong}</td>
              <td>${truongName}</td>
              <td>${toHopName}</td>
              <td><span class="status status-pending">Đang xét</span></td>
              <td><button class="btn btn-danger btn-huy" data-mangv="${newId}">Hủy</button></td>
            `;
            tbody.appendChild(tr);

            // reset selects
            selTruong.selectedIndex = 0;
            selToHop.selectedIndex = 0;
          }
        } else {
          showMessage(json.message || 'Lưu thất bại.', 'error');
        }
      } catch (err) {
        console.error('Lỗi khi gửi yêu cầu lưu:', err);
        showMessage('Lỗi kết nối!', 'error');
      }
    });
  }

  // Delegated click để xử lý Hủy (bind 1 lần trên document)
  if (!window._dangKyClickBound) {
    window._dangKyClickBound = true;

    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-huy');
      if (!btn) return;

      // lấy mã nguyện vọng từ data attribute
      const ma = btn.dataset.mangv;
      if (!ma) {
        // nếu server không trả id cho row mới, tốt nhất reload lại danh sách từ server
        if (!confirm('Không có mã nguyện vọng trên hàng này. Bạn có muốn tải lại trang để đồng bộ?')) return;
        try { window.location.reload(); } catch { /* ignore */ }
        return;
      }

      if (!confirm('Hủy nguyện vọng này?')) return;

      try {
        const res = await fetch('/api/dangkytuyensinh/huy-nguyen-vong', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maNguyenVong: ma }),
        });

        if (res.status === 401 || res.status === 403) {
          return showMessage('Bạn cần đăng nhập để thực hiện thao tác.', 'warn');
        }

        const text = await res.text();
        let json;
        try {
          json = text ? JSON.parse(text) : {};
        } catch (err) {
          console.error('Không parse JSON từ server (hủy):', text);
          return showMessage('Lỗi server (phản hồi không hợp lệ).', 'error');
        }

        if (json.success) {
          showMessage('Hủy thành công!', 'success');

          // xóa hàng và đánh lại NV
          const row = btn.closest('tr');
          if (row) row.remove();

          const tbody = document.querySelector('.table-section tbody');
          if (!tbody || tbody.childElementCount === 0) {
            const tableSection = document.querySelector('.table-section');
            if (tableSection) {
              tableSection.innerHTML = `
                <h4>Nguyện vọng đã đăng ký</h4>
                <div class="empty-state">
                  <p>Chưa đăng ký nguyện vọng nào.</p>
                  <small>Hãy chọn trường và tổ hợp môn ở trên để đăng ký.</small>
                </div>
              `;
            }
          } else {
            // renumber
            [...tbody.children].forEach((r, idx) => {
              const firstTd = r.querySelector('td');
              if (firstTd) firstTd.textContent = `NV${idx + 1}`;
            });
          }
        } else {
          showMessage(json.message || 'Hủy thất bại', 'error');
        }
      } catch (err) {
        console.error('Lỗi khi gửi yêu cầu hủy:', err);
        showMessage('Lỗi kết nối!', 'error');
      }
    });
  }
}

// tự động init khi load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDangKyTuyenSinh);
} else {
  initDangKyTuyenSinh();
}
