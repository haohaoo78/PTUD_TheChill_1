(() => {
  const statusText = document.getElementById('status-text');
  const actionArea = document.getElementById('action-area');
  const successArea = document.getElementById('success-area');
  const btnConfirm = document.getElementById('btn-confirm');
  const studentName = document.getElementById('student-name');

  if (!btnConfirm) return; // If error page

  loadStatus();

  async function loadStatus() {
    try {
      const res = await fetch('/api/nhaphoc/status', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.status) {
        studentName.textContent = data.status.HoTen;
        const st = data.status.TrangThaiNhapHoc;
        
        if (st === 'Đang học' || st === 'Đã xác nhận' || st === 'DaXacNhan') {
          statusText.textContent = 'Đã xác nhận';
          statusText.className = 'status-badge status-confirmed';
          successArea.style.display = 'block';
          actionArea.style.display = 'none';
          
          // Show selected stream
          const khoiMap = { 'KHTN': 'Khối Khoa học Tự nhiên', 'KHXH': 'Khối Khoa học Xã hội' };
          const khoiLabel = khoiMap[data.status.Khoi] || data.status.Khoi || 'Chưa cập nhật';
          document.getElementById('selected-khoi').textContent = khoiLabel;
        } else {
          statusText.textContent = 'Chưa xác nhận';
          statusText.className = 'status-badge status-pending';
          actionArea.style.display = 'block';
          successArea.style.display = 'none';
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  btnConfirm.addEventListener('click', async () => {
    const khoiHoc = document.getElementById('khoiHoc').value;
    
    if (!khoiHoc) {
        alert('Vui lòng chọn khối học');
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn xác nhận nhập học vào khối ' + khoiHoc + '?')) return;

    try {
      const res = await fetch('/api/nhaphoc/confirm', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ khoiHoc })
      });
      const data = await res.json();
      
      if (data.success) {
        loadStatus();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
    }
  });
})();
