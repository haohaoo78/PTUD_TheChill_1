// public/js/phanbohocsinhvaotruong.js
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('nam_thi');
  const btn = document.getElementById('loadQuotas');
  const quotaArea = document.getElementById('quotaArea');
  const resultArea = document.getElementById('resultArea');
  const saveBar = document.getElementById('saveBar');
  const statsInfo = document.getElementById('statsInfo');

  // Tự động tải năm thi khi vào trang
  fetch('/api/phanbohocsinhvaotruong/years')
    .then(r => r.json())
    .then(d => {
      if (d.success && d.years.length > 0) {
        select.innerHTML = '<option value="">-- Chọn năm thi --</option>';
        d.years.forEach(y => {
          const opt = new Option(y, y);
          select.appendChild(opt);
        });
        btn.disabled = false;
      } else {
        select.innerHTML = '<option value="">-- Không có năm thi --</option>';
      }
    });

  // Bật nút khi chọn năm
  select.addEventListener('change', () => {
    btn.disabled = !select.value;
  });

  btn.addEventListener('click', async () => {
    const nam_thi = select.value;
    quotaArea.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div></div>';

    const res = await fetch(`/api/phanbohocsinhvaotruong/data?nam_thi=${nam_thi}`);
    const data = await res.json();

    if (!data.success) {
      quotaArea.innerHTML = `<div class="alert alert-danger">Lỗi: ${data.message}</div>`;
      return;
    }

    let html = `<div class="result-card"><div class="result-header">Chỉ Tiêu Năm ${nam_thi}</div>
      <table class="table table-bordered"><thead class="table-primary"><tr><th>Trường</th><th>Chỉ Tiêu</th></tr></thead><tbody>`;
    for (const [truong, ct] of Object.entries(data.quotas)) {
      html += `<tr><td><strong>${truong}</strong></td><td class="text-center fs-5">${ct}</td></tr>`;
    }
    html += `</tbody></table>
      <div class="text-center p-3">
        <button id="runBtn" class="btn btn-primary btn-lg">Thực Hiện Phân Bổ</button>
      </div></div>`;

    quotaArea.innerHTML = html;
    document.getElementById('runBtn').onclick = () => runAllocation(nam_thi);
  });

  async function runAllocation(nam_thi) {
    resultArea.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-success"></div><p>Đang phân bổ...</p></div>';
    const res = await fetch('/api/phanbohocsinhvaotruong/run-and-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nam_thi })
    });
    const d = await res.json();
    if (!d.success) {
      resultArea.innerHTML = `<div class="alert alert-danger">Lỗi: ${d.message}</div>`;
      return;
    }

    resultArea.innerHTML = `<div class="result-card mt-4">
      <div class="result-header text-success">HOÀN TẤT PHÂN BỔ!</div>
      <div class="p-4 text-center">
        <h3>Đã trúng tuyển: <strong class="text-success">${d.totalAllocated}</strong> / ${d.totalCandidates}</h3>
        <p>Rớt: <strong class="text-danger">${d.totalFall}</strong></p>
      </div>
    </div>`;

    statsInfo.textContent = `Đã phân bổ ${d.totalAllocated}/${d.totalCandidates} thí sinh`;
    saveBar.classList.remove('d-none');
  }

  document.getElementById('save').onclick = () => {
    alert('Kết quả đã được lưu thành công vào CSDL!');
    saveBar.classList.add('d-none');
  };
  document.getElementById('cancel').onclick = () => location.reload();
});