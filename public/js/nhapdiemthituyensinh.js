document.addEventListener('DOMContentLoaded', () => {
  const namThiSelect = document.getElementById('nam_thi');
  const phongThiSelect = document.getElementById('ma_phong_thi');
  const loadBtn = document.getElementById('loadCandidates');
  const resultArea = document.getElementById('resultArea');

  // ====================== VALIDATE ĐIỂM ======================
  const validateScore = (value) => {
    if (value === '') return { valid: false, msg: 'Không được bỏ trống!' };
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 10) {
      return { valid: false, msg: 'Điểm phải từ 0 đến 10!' };
    }
    return { valid: true, msg: '' };
  };

  // ====================== LOAD DANH SÁCH ======================
  loadBtn.addEventListener('click', async () => {
    const nam_thi = namThiSelect.value.trim();
    const ma_phong_thi = phongThiSelect.value.trim();

    if (!nam_thi || !ma_phong_thi) {
      showAlert('Vui lòng chọn đầy đủ năm thi và phòng thi!', 'danger');
      return;
    }

    try {
      loadBtn.disabled = true;
      loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang tải...';

      const res = await fetch(`/api/nhapdiemthituyensinh/candidates?nam_thi=${nam_thi}&ma_phong_thi=${ma_phong_thi}`);
      const result = await res.json();

      if (!result.success || !result.data || result.data.length === 0) {
        resultArea.innerHTML = `<div class="alert alert-warning">Không có thí sinh nào trong phòng thi này!</div>`;
        return;
      }

      renderTable(result.data, nam_thi, ma_phong_thi);
    } catch (err) {
      showAlert('Mất kết nối mạng! Vui lòng thử lại.', 'danger');
    } finally {
      loadBtn.disabled = false;
      loadBtn.innerHTML = '<i class="fas fa-download"></i> Tải Danh Sách Thí Sinh';
    }
  });

  // ====================== RENDER BẢNG ======================
  const renderTable = (candidates, nam_thi, ma_phong_thi) => {
    const html = `
      <div class="card shadow-sm">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Danh sách thí sinh - Phòng: ${ma_phong_thi} - Năm: ${nam_thi}</h5>
          <small class="text-muted">${candidates.length} thí sinh</small>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped table-hover mb-0">
              <thead class="table-dark">
                <tr>
                  <th width="10%">Mã TS</th>
                  <th width="20%">Họ tên</th>
                  <th width="12%">Toán *</th>
                  <th width="12%">Văn *</th>
                  <th width="12%">Anh *</th>
                  <th width="12%">Tự chọn *</th>
                  <th width="10%">Tổng</th>
                  <th width="12%">Hành động</th>
                </tr>
              </thead>
              <tbody>
                ${candidates.map(item => {
                  const tong = ((parseFloat(item.Toan||0) + parseFloat(item.Van||0) + parseFloat(item.Anh||0) + parseFloat(item.TuChon||0)) / 4).toFixed(2);
                  return `
                    <tr data-mathisinh="${item.MaThiSinh}">
                      <td class="fw-bold">${item.MaThiSinh}</td>
                      <td>${item.HoTen}</td>
                      <td><input type="number" step="0.25" min="0" max="10" class="form-control form-control-sm score" value="${item.Toan || ''}" data-field="toan" required></td>
                      <td><input type="number" step="0.25" min="0" max="10" class="form-control form-control-sm score" value="${item.Van || ''}" data-field="van" required></td>
                      <td><input type="number" step="0.25" min="0" max="10" class="form-control form-control-sm score" value="${item.Anh || ''}" data-field="anh" required></td>
                      <td><input type="number" step="0.25" min="0" max="10" class="form-control form-control-sm score" value="${item.TuChon || ''}" data-field="tu_chon" required></td>
                      <td class="fw-bold text-primary tong-diem">${tong}</td>
                      <td>
                        <button class="btn btn-sm btn-success save-btn">Lưu</button>
                        <button class="btn btn-sm btn-danger delete-btn">Xóa</button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    resultArea.innerHTML = html;

    // Tính tổng realtime + validate khi nhập
    document.querySelectorAll('.score').forEach(input => {
      input.addEventListener('input', function () {
        const row = this.closest('tr');
        const scores = row.querySelectorAll('.score');
        let sum = 0;
        let valid = true;

        scores.forEach(s => {
          const val = s.value.trim();
          const check = validateScore(val);
          if (!check.valid) {
            s.classList.add('is-invalid');
            valid = false;
          } else {
            s.classList.remove('is-invalid');
          }
          sum += parseFloat(val) || 0;
        });

        row.querySelector('.tong-diem').textContent = (sum / 4).toFixed(2);
        row.querySelector('.save-btn').disabled = !valid;
      });
    });

    // Lưu điểm
    resultArea.addEventListener('click', async e => {
      if (e.target.classList.contains('save-btn')) {
        const row = e.target.closest('tr');
        const scores = row.querySelectorAll('.score');
        let hasError = false;

        scores.forEach(s => {
          const check = validateScore(s.value.trim());
          if (!check.valid) {
            showAlert(check.msg, 'danger');
            hasError = true;
          }
        });

        if (hasError) return;

        const data = {
          ma_thi_sinh: row.dataset.mathisinh,
          toan: row.querySelector('[data-field="toan"]').value || null,
          van: row.querySelector('[data-field="van"]').value || null,
          anh: row.querySelector('[data-field="anh"]').value || null,
          tu_chon: row.querySelector('[data-field="tu_chon"]').value || null,
          nam_thi,
          ma_phong_thi
        };

        try {
          const r = await fetch('/api/nhapdiemthituyensinh/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const j = await r.json();
          if (j.success) {
            showAlert('Lưu điểm thành công!', 'success');
          } else {
            showAlert(j.message || 'Lỗi lưu điểm!', 'danger');
          }
        } catch (err) {
          showAlert('Không thể lưu dữ liệu, vui lòng thử lại sau!', 'danger');
        }
      }

      if (e.target.classList.contains('delete-btn')) {
        if (confirm('Xóa toàn bộ điểm của thí sinh này?')) {
          const maTS = e.target.closest('tr').dataset.mathisinh;
          try {
            const r = await fetch(`/api/nhapdiemthituyensinh/delete/${maTS}`, { method: 'DELETE' });
            const j = await r.json();
            if (j.success) {
              location.reload();
            }
          } catch (err) {
            showAlert('Lỗi kết nối khi xóa!', 'danger');
          }
        }
      }
    });
  };

  // ====================== HIỂN THỊ THÔNG BÁO ======================
  const showAlert = (msg, type = 'danger') => {
    const alert = `
      <div class="alert alert-${type} alert-dismissible fade show mt-3">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    resultArea.insertAdjacentHTML('beforebegin', alert);
    setTimeout(() => document.querySelector('.alert')?.remove(), 5000);
  };
});