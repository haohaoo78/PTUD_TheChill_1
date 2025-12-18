(() => {
  const statusText = document.getElementById('status-text');
  const actionArea = document.getElementById('action-area');
  const successArea = document.getElementById('success-area');
  const btnConfirm = document.getElementById('btn-confirm');
  const studentName = document.getElementById('student-name');
  const khoiSelect = document.getElementById('khoiHoc');
  const selectedKhoi = document.getElementById('selected-khoi');

  if (!btnConfirm) return;

  loadStatus();

  async function loadStatus() {
    const res = await fetch('/api/nhaphoc/status', { method: 'POST' });
    const data = await res.json();

    if (!data.success) return;

    const { HoTen, TrangThaiNhapHoc, KhoiHoc } = data.status;
    studentName.textContent = HoTen;

    if (TrangThaiNhapHoc === 'Đã nhập học') {
      statusText.textContent = 'Đã xác nhận nhập học';
      actionArea.style.display = 'none';
      successArea.style.display = 'block';
      selectedKhoi.textContent = KhoiHoc;
    }
    else if (TrangThaiNhapHoc === 'Đậu') {
      statusText.textContent = 'Đã trúng tuyển – Chưa xác nhận';
      actionArea.style.display = 'block';
      successArea.style.display = 'none';
    }
    else {
      statusText.textContent = TrangThaiNhapHoc;
      actionArea.style.display = 'none';
      successArea.style.display = 'none';
    }
  }

  btnConfirm.addEventListener('click', async () => {
    const khoiHoc = khoiSelect.value;
    if (!khoiHoc) return alert('Vui lòng chọn khối học');

    const res = await fetch('/api/nhaphoc/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ khoiHoc })
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadStatus();
    } else {
      alert(data.message);
    }
  });
})();
