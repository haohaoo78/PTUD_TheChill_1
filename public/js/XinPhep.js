(() => {
  const form = document.getElementById('form-xinphep');
  const historyBody = document.getElementById('history-body');

  // Load history on page load
  loadHistory();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tenCon = document.getElementById('tenCon').value;
    const ngayNghi = document.getElementById('ngayNghi').value;
    const lyDo = document.getElementById('lyDo').value;

    try {
      const res = await fetch('/api/xinphep/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenCon, ngayNghi, lyDo })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        form.reset();
        loadHistory();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi gửi đơn');
    }
  });

  async function loadHistory() {
    try {
      const res = await fetch('/api/xinphep/history', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        historyBody.innerHTML = '';
        if (data.history.length === 0) {
          historyBody.innerHTML = '<tr><td colspan="4">Chưa có lịch sử xin phép</td></tr>';
          return;
        }

        data.history.forEach(item => {
          let statusClass = '';
          // Schema doesn't have TrangThai, assuming default or handled elsewhere. 
          // If no TrangThai column, we can't show it or assume 'Đã gửi'.
          const trangThai = item.TrangThai || 'Đã gửi';
          
          if (trangThai === 'Chờ duyệt') statusClass = 'status-pending';
          else if (trangThai === 'Đã duyệt') statusClass = 'status-approved';
          else statusClass = 'status-rejected';

          const row = `
            <tr>
              <td>${new Date(item.Ngay).toLocaleDateString('vi-VN')}</td>
              <td>${new Date(item.Ngay).toLocaleDateString('vi-VN')}</td>
              <td>${item.LyDoNghi}</td>
              <td><span class="${statusClass}">${trangThai}</span></td>
            </tr>
          `;
          historyBody.innerHTML += row;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
})();
