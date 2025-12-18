// JS cho điểm danh: tải lớp dạy hôm nay, chọn lớp -> tải học sinh
(function () {
  const data = window.ddData || { classList: [], students: [], selectedClass: '' };
  const classGrid = document.getElementById('dd-class-grid');
  const studentTableBody = document.querySelector('#dd-student-table tbody');
  const selectedLabel = document.getElementById('dd-selected-class-label');
  const studentSection = document.querySelector('.student-section');
  const emptyNote = document.getElementById('dd-empty-note');
  const confirmBtn = document.getElementById('dd-confirm');
  const cancelBtn = document.getElementById('dd-cancel');

  async function loadClassesToday() {
    try {
      const res = await fetch('/api/diemdanh/classes-today');
      const result = await res.json();
      if (!result.success) {
        classGrid.innerHTML = '<div class="empty-note">Không tải được danh sách lớp.</div>';
        return;
      }
      data.ngay = result.ngay || new Date().toISOString().slice(0, 10);
      data.classList = result.classList || [];
      if (!data.classList.length) {
        classGrid.innerHTML = '<div class="empty-note">Không có lịch dạy trong ngày.</div>';
        return;
      }
      classGrid.innerHTML = data.classList
        .map(
          c => `
          <div class="class-card" data-malop="${c.MaLop}" data-tiet="${c.TietHoc}" data-mon="${c.TenMonHoc || ''}">
            <div class="class-name">${c.TenLop || c.MaLop}</div>
            <div class="class-meta">
              <span>Mã lớp: ${c.MaLop}</span>
              <span>Tiết: ${c.TietHoc || ''}</span>
              <span>Môn: ${c.TenMonHoc || ''}</span>
            </div>
          </div>
        `
        )
        .join('');
    } catch (err) {
      console.error(err);
      classGrid.innerHTML = '<div class="empty-note">Lỗi tải danh sách lớp.</div>';
    }
  }

  async function loadStudents(maLop) {
    try {
      const params = new URLSearchParams({
        maLop: maLop || '',
        ngay: data.ngay || '',
        tietHoc: data.selectedTiet || '',
        tenMonHoc: data.selectedSubject || ''
      });
      const res = await fetch(`/api/diemdanh/students?${params.toString()}`);
      const result = await res.json();
      if (!result.success) {
        renderStudents([]);
        return;
      }
      data.selectedClass = maLop;
      data.students = result.students || [];
      renderStudents(data.students);
    } catch (err) {
      console.error(err);
      renderStudents([]);
    }
  }

  function renderStudents(list) {
    if (!studentTableBody) return;
    if (!list || list.length === 0) {
      studentTableBody.innerHTML = '';
      if (emptyNote) emptyNote.classList.remove('hidden');
      return;
    }
    if (emptyNote) emptyNote.classList.add('hidden');
    studentTableBody.innerHTML = list
      .map(
        (hs, idx) => `
        <tr>
          <td style="display:none;">${hs.MaHocSinh || ''}</td>
          <td>${idx + 1}</td>
          <td>${hs.TenHocSinh || ''}</td>
          <td>${hs.GioiTinh || ''}</td>
          <td>${hs.Birthday ? hs.Birthday.toString().slice(0, 10) : ''}</td>
          <td>${hs.TrangThai || ''}</td>
          <td>${hs.MaLop || ''}</td>
          <td>
            <select class="dd-select" data-mahs="${hs.MaHocSinh || ''}">
              <option value="">-- Chưa chọn --</option>
              <option value="k" ${hs.DiemDanh === 'k' ? 'selected' : ''}>k - Có đi học</option>
              <option value="v" ${hs.DiemDanh === 'v' ? 'selected' : ''}>v - Vắng không phép</option>
              <option value="p" ${hs.DiemDanh === 'p' ? 'selected' : ''}>p - Vắng có phép</option>
            </select>
          </td>
        </tr>
      `
      )
      .join('');
  }

  function setSelectedClass(maLop, tenLop) {
    data.selectedClass = maLop;
    data.selectedClassName = tenLop;
    if (selectedLabel) {
      selectedLabel.innerText = maLop ? `Lớp: ${tenLop || maLop}` : 'Chọn lớp để điểm danh';
    }
    if (studentSection) studentSection.classList.toggle('hidden', !maLop);
  }

  function bindClassClick() {
    if (!classGrid) return;
    classGrid.addEventListener('click', e => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      const maLop = card.dataset.malop || '';
      const tenLop = card.querySelector('.class-name')?.innerText || maLop;
      const tiet = card.dataset.tiet || '';
      const mon = card.dataset.mon || '';
      setSelectedClass(maLop, tenLop);
      data.selectedTiet = tiet;
      data.selectedSubject = mon;
      loadStudents(maLop);
    });
  }

  function bindConfirm() {
    if (!confirmBtn) return;
    confirmBtn.onclick = async () => {
      if (!data.selectedClass) {
        alert('Vui lòng chọn lớp để điểm danh');
        return;
      }
      const selects = studentTableBody ? studentTableBody.querySelectorAll('.dd-select') : [];
      if (!selects || selects.length === 0) {
        alert('Không có học sinh để điểm danh');
        return;
      }
      const records = [];
      selects.forEach(sel => {
        const maHS = sel.dataset.mahs || '';
        const TrangThai = sel.value || '';
        if (maHS && TrangThai) records.push({ MaHocSinh: maHS, TrangThai });
      });
      if (!records.length) {
        alert('Vui lòng chọn trạng thái cho ít nhất một học sinh');
        return;
      }
      const payload = {
        maLop: data.selectedClass,
        tenMonHoc: data.selectedSubject || '',
        tietHoc: data.selectedTiet || '',
        ngay: data.ngay || new Date().toISOString().slice(0, 10),
        records
      };
      try {
        const res = await fetch('/api/diemdanh/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!result.success) {
          alert(result.message || 'Lưu điểm danh thất bại');
          return;
        }
        alert('Lưu điểm danh thành công');
        // Reload UI với dữ liệu mới
        const currentClass = data.selectedClass;
        const currentTiet = data.selectedTiet;
        const currentMon = data.selectedSubject;
        renderStudents([]);
        await loadClassesToday();
        if (currentClass) {
          data.selectedTiet = currentTiet;
          data.selectedSubject = currentMon;
          loadStudents(currentClass);
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi server khi lưu điểm danh');
      }
    };
  }

  function bindCancel() {
    if (!cancelBtn) return;
    cancelBtn.onclick = async () => {
      if (!data.selectedClass) {
        alert('Vui lòng chọn lớp để hủy điểm danh');
        return;
      }
      const maHSList = (data.students || []).map(s => s.MaHocSinh).filter(Boolean);
      if (!maHSList.length) {
        alert('Không có học sinh để hủy');
        return;
      }
      const payload = {
        ngay: data.ngay || new Date().toISOString().slice(0, 10),
        tietHoc: data.selectedTiet || '',
        maHSList
      };
      try {
        const res = await fetch('/api/diemdanh/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!result.success) {
          alert(result.message || 'Hủy điểm danh thất bại');
          return;
        }
        alert('Đã hủy điểm danh');
        // Reload UI với dữ liệu mới
        const currentClass = data.selectedClass;
        const currentTiet = data.selectedTiet;
        const currentMon = data.selectedSubject;
        renderStudents([]);
        await loadClassesToday();
        if (currentClass) {
          data.selectedTiet = currentTiet;
          data.selectedSubject = currentMon;
          loadStudents(currentClass);
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi server khi hủy điểm danh');
      }
    };
  }

  // Khởi động
  setSelectedClass(data.selectedClass || '', data.selectedClassName || '');
  renderStudents(data.students || []);
  loadClassesToday();
  bindClassClick();
  bindConfirm();
  bindCancel();
})();
