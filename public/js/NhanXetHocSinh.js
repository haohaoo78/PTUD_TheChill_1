// JS cho chức năng nhận xét học sinh: load danh sách lớp, chọn lớp -> load học sinh
(function () {
  const data = window.nxData || { classList: [], students: [], selectedClass: '' };
  const classGrid = document.getElementById('nx-class-grid');
  const studentTableBody = document.querySelector('#nx-student-table tbody');
  const selectedLabel = document.getElementById('nx-selected-class-label');
  const commentSection = document.querySelector('.comment-section');
  const bulkInput = document.getElementById('nx-bulk-comment');
  const bulkBtn = document.getElementById('nx-bulk-btn');

  async function loadClasses() {
    try {
      const res = await fetch('/api/nhanxet/classes');
      const result = await res.json();
      if (!result.success) {
        classGrid.innerHTML = '<div class="empty-note">Không tải được danh sách lớp.</div>';
        return;
      }
      data.namHoc = result.namHoc || '';
      data.classList = result.classList || [];
      if (!data.classList.length) {
        classGrid.innerHTML = '<div class="empty-note">Chưa có lớp nào.</div>';
        return;
      }
      classGrid.innerHTML = data.classList
        .map(
          c => `
          <div class="class-card" data-malop="${c.MaLop}">
            <div class="class-name">${c.TenLop || c.MaLop}</div>
            <div class="class-meta">Mã lớp: ${c.MaLop}</div>
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
      const query = new URLSearchParams({ maLop });
      const res = await fetch(`/api/nhanxet/students?${query.toString()}`);
      const result = await res.json();
      if (!result.success) {
        renderStudents([]);
        return;
      }
      data.namHoc = result.namHoc || data.namHoc || '';
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
      return;
    }
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
          <td>${hs.KhoaHoc || ''}</td>
          <td class="comment-cell">
            <div class="comment-input-wrap">
              <input type="text" class="comment-input" value="${hs.NhanXet || ''}" data-mahs="${hs.MaHocSinh || ''}">
              <button type="button" class="btn-primary btn-comment" data-mahs="${hs.MaHocSinh || ''}">Nhận xét</button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');
    bindCommentButtons();
  }

  function bindBulkComment() {
    if (!bulkBtn) return;
    bulkBtn.onclick = async () => {
      const nhanXet = bulkInput ? bulkInput.value : '';
      const maHSList = (data.students || []).map(s => s.MaHocSinh).filter(Boolean);
      if (!maHSList.length) {
        alert('Không có học sinh để nhận xét.');
        return;
      }
      try {
        const res = await fetch('/api/nhanxet/comment-multiple', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maHSList, nhanXet })
        });
        const result = await res.json();
        if (!result.success) {
          alert(result.message || 'Cập nhật nhận xét chung thất bại');
          return;
        }
        // Cập nhật lại cache và UI
        data.students = data.students.map(s => ({ ...s, NhanXet: nhanXet }));
        renderStudents(data.students);
        alert('Nhận xét chung thành công');
      } catch (err) {
        console.error(err);
        alert('Lỗi server khi cập nhật nhận xét chung');
      }
    };
  }

  function setSelectedClass(maLop) {
    data.selectedClass = maLop;
    if (selectedLabel) {
      selectedLabel.innerText = maLop ? `Lớp: ${maLop}` : 'Chọn lớp để xem học sinh';
    }
    if (commentSection) commentSection.classList.toggle('hidden', !maLop);
  }

  function bindCommentButtons() {
    if (!studentTableBody) return;
    studentTableBody.querySelectorAll('.btn-comment').forEach(btn => {
      btn.onclick = async () => {
        const maHS = btn.dataset.mahs || '';
        const input = studentTableBody.querySelector(`input.comment-input[data-mahs="${maHS}"]`);
        const nhanXet = input ? input.value : '';
        if (!maHS) return;
        try {
          const res = await fetch('/api/nhanxet/comment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maHS, nhanXet })
          });
          const result = await res.json();
          if (!result.success) {
            alert(result.message || 'Cập nhật nhận xét thất bại');
            return;
          }
          // Lưu lại giá trị mới trong cache
          const target = data.students.find(s => s.MaHocSinh === maHS);
          if (target) target.NhanXet = nhanXet;
          alert('Nhận xét thành công');
        } catch (err) {
          console.error(err);
          alert('Lỗi server khi cập nhật nhận xét');
        }
      };
    });
  }

  function bindClassClick() {
    if (!classGrid) return;
    classGrid.addEventListener('click', e => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      const maLop = card.dataset.malop || '';
      setSelectedClass(maLop);
      loadStudents(maLop);
    });
  }

  // Khởi động
  setSelectedClass(data.selectedClass || '');
  renderStudents(data.students || []);
  loadClasses();
  bindClassClick();
  bindBulkComment();
})();
