(() => {
  const statusText = document.getElementById('status-text');
  const actionArea = document.getElementById('action-area');
  const successArea = document.getElementById('success-area');
  const btnConfirm = document.getElementById('btn-confirm');
  const studentName = document.getElementById('student-name');
  const khoiSelect = document.getElementById('khoiHoc');
  const selectedKhoi = document.getElementById('selected-khoi');

  if (!statusText || !studentName) return;

  studentName.textContent = 'Đang tải...';
  statusText.textContent = 'Đang tải...';

  loadStatus();

  // ============== HỘP THÔNG BÁO TÙY CHỈNH ==============
  function showSuccessModal(message) {
    // Tạo modal nếu chưa có
    let modal = document.getElementById('success-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'success-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '1000';

      modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <h3 style="color: #28a745; margin-top: 0;">✅ Nhập học thành công!</h3>
          <div style="white-space: pre-line; font-size: 16px; margin: 20px 0; line-height: 1.6;">${message}</div>
          <button id="close-modal" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Đóng</button>
        </div>
      `;
      document.body.appendChild(modal);

      // Đóng khi nhấn nút
      document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
      };

      // Tự động đóng sau 15 giây
      setTimeout(() => {
        if (modal.style.display !== 'none') {
          modal.style.display = 'none';
        }
      }, 15000);
    }

    // Hiển thị modal
    modal.style.display = 'flex';
  }
  // ====================================================

  async function loadStatus() {
    try {
      const res = await fetch('/api/nhaphoc/status', { method: 'POST' });
      const data = await res.json();

      if (!data.success) {
        studentName.textContent = 'Lỗi kết nối';
        statusText.textContent = 'Không thể tải trạng thái';
        return;
      }

      const { HoTen, TrangThaiNhapHoc } = data.status;

      studentName.textContent = HoTen || 'Không xác định';
      statusText.textContent = TrangThaiNhapHoc || 'Chưa có thông tin';

      if (TrangThaiNhapHoc === 'Đã nhập học') {
        actionArea.style.display = 'none';
        successArea.style.display = 'block';
        selectedKhoi.textContent = 'Đã xác nhận';
      } else if (TrangThaiNhapHoc === 'Đậu') {
        actionArea.style.display = 'block';
        successArea.style.display = 'none';
      } else {
        actionArea.style.display = 'none';
        successArea.style.display = 'none';
      }
    } catch (err) {
      studentName.textContent = 'Lỗi hệ thống';
      statusText.textContent = 'Không thể kết nối';
    }
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', async () => {
      const toHop = khoiSelect.value;
      if (!toHop) return alert('Vui lòng chọn tổ hợp môn');

      try {
        const res = await fetch('/api/nhaphoc/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toHop })
        });

        const data = await res.json();

        if (data.success) {
          // Dùng modal tùy chỉnh thay vì alert
          showSuccessModal(data.message);
          loadStatus();
        } else {
          alert(data.message || 'Lỗi xác nhận');
        }
      } catch (err) {
        alert('Lỗi kết nối server');
      }
    });
  }
})();