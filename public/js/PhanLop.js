document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 PhanLop.js loaded');

  // Elements
  const khoiSelect = document.getElementById('khoi-select');
  const maxSizeInput = document.getElementById('max-size');
  const loadBtn = document.getElementById('load-students');
  const autoBtn = document.getElementById('auto-assign');
  const saveBtn = document.getElementById('save-assign');
  const studentsTbody = document.querySelector('#students-table tbody');
  const classesTbody = document.querySelector('#classes-table tbody');
  const studentsCount = document.getElementById('students-count');
  const classesCount = document.getElementById('classes-count');

  // Data
  let distribution = {}; // { MaLop: { TenLop: '...', students: [...] } }
  let currentStudents = [];
  let currentClasses = [];

  // ======================
  // Load dữ liệu
  // ======================
  const loadData = async () => {
    const MaKhoi = khoiSelect.value;
    console.log('🔄 Loading data for khoi:', MaKhoi);
    showTableLoading(studentsTbody, 7, 'Đang tải học sinh...');
    showTableLoading(classesTbody, 5, 'Đang tải lớp...');

    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/phanlophocsinh/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        }),
        fetch('/api/phanlophocsinh/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        })
      ]);

      if (!res1.ok) throw new Error(`Students API error: ${res1.status}`);
      if (!res2.ok) throw new Error(`Classes API error: ${res2.status}`);

      const data1 = await res1.json();
      const data2 = await res2.json();
      console.log('📥 Students response:', data1);  // Log chi tiết response
      console.log('📥 Classes response:', data2);

      if (!data1.success || !data2.success) {
        throw new Error('Lỗi tải dữ liệu từ server');
      }

      currentStudents = data1.students || [];
      currentClasses = data2.classes || [];
      console.log(`✅ Loaded ${currentStudents.length} students and ${currentClasses.length} classes`);

      // Reset distribution khi load mới
      distribution = {};

      // Render
      renderStudents();
      renderClasses();

      // Update counts
      const unassignedCount = currentStudents.filter(s => !s.MaLop || s.MaLop.trim() === '').length;
      studentsCount.textContent = `${currentStudents.length} học sinh (${unassignedCount} chưa phân lớp)`;
      classesCount.textContent = `${currentClasses.length} lớp`;
    } catch (err) {
      console.error('❌ Load data error:', err.message);  // Log chi tiết lỗi
      showMessage('Lỗi tải dữ liệu. Vui lòng kiểm tra console hoặc server!', 'error');
      showTableEmpty(studentsTbody, 7, 'Lỗi tải dữ liệu');
      showTableEmpty(classesTbody, 5, 'Lỗi tải dữ liệu');
    }
  };

  // ======================
  // Render danh sách học sinh
  // ======================
  const renderStudents = () => {
    console.log('🎨 Rendering students...');
    if (currentStudents.length === 0) {
      showTableEmpty(studentsTbody, 7, 'Không có học sinh thuộc khối này');
      return;
    }
    studentsTbody.innerHTML = currentStudents.map((s, i) => {
      const tempClass = getAssignedClass(s.MaHocSinh);
      const currentClass = s.MaLop && s.MaLop.trim() !== '' ? s.MaLop : null;
      const displayClass = tempClass || currentClass || '—';
      // Cho phép chỉnh sửa nếu có lớp
      const clickable = tempClass || currentClass ? `ondblclick="editStudent('${s.MaHocSinh}', '${tempClass || currentClass}')"` : '';
      // Đánh dấu học sinh mới được phân bổ
      const rowClass = tempClass ? 'row-highlight' : '';
      return `
        <tr data-id="${s.MaHocSinh}" ${clickable} class="${rowClass}" title="${tempClass || currentClass ? 'Double click để chỉnh sửa' : ''}">
          <td>${i + 1}</td>
          <td><strong>${s.MaHocSinh}</strong></td>
          <td>${s.TenHocSinh}</td>
          <td>${s.GioiTinh}</td>
          <td>${s.TenToHop || 'Chưa chọn'}</td>
          <td>${s.TrangThai}</td>
          <td class="assigned-class">
            ${displayClass === '—' ? '—' : `<span class="badge ${tempClass ? 'badge-new' : 'badge-current'}">${displayClass}</span>`}
          </td>
        </tr>
      `;
    }).join('');
    console.log(`✅ Rendered ${currentStudents.length} students`);
  };

  // ======================
  // Render danh sách lớp
  // ======================
  const renderClasses = () => {
    console.log('🎨 Rendering classes...');
    if (currentClasses.length === 0) {
      showTableEmpty(classesTbody, 5, 'Không có lớp nào');
      return;
    }
    classesTbody.innerHTML = currentClasses.map((c, i) => {
      const totalCount = getClassCount(c.MaLop);
      const maxSize = c.SiSo || 35;
      const percentage = (totalCount / maxSize) * 100;
      let statusClass = 'status-ok';
      if (percentage >= 100) statusClass = 'status-full';
      else if (percentage >= 80) statusClass = 'status-warning';
      const newStudents = distribution[c.MaLop] ? distribution[c.MaLop].students.length : 0;
      return `
        <tr data-id="${c.MaLop}" class="class-row" ondblclick="showClassStudents('${c.MaLop}')" title="Double click để xem chi tiết">
          <td>${i + 1}</td>
          <td><strong>${c.MaLop}</strong></td>
          <td>
            ${c.TenLop}
            ${c.TenToHop && c.TenToHop !== 'Chưa chọn' ? `<small style="color: #6c757d;">(${c.TenToHop})</small>` : ''}
            ${newStudents > 0 ? `<span class="badge-new-count">+${newStudents}</span>` : ''}
          </td>
          <td>${maxSize}</td>
          <td class="current-count">
            <span class="${statusClass}">${totalCount}</span> / ${maxSize}
          </td>
        </tr>
      `;
    }).join('');
    console.log(`✅ Rendered ${currentClasses.length} classes`);
  };

  // ======================
  // Lấy lớp đã được phân (temp)
  // ======================
  const getAssignedClass = (maHocSinh) => {
    for (const maLop in distribution) {
      if (distribution[maLop].students.some(s => s.MaHocSinh === maHocSinh)) {
        return maLop;
      }
    }
    return null;
  };

  // ======================
  // Tính số lượng học sinh trong lớp
  // ======================
  const getClassCount = (maLop) => {
    const cls = currentClasses.find(c => c.MaLop === maLop);
    const currentCount = cls ? (parseInt(cls.CurrentCount) || 0) : 0;
    const newCount = distribution[maLop] ? distribution[maLop].students.length : 0;
    return currentCount + newCount;
  };

  // ======================
  // Phân bổ tự động
  // ======================
  const autoAssign = async () => {
    const MaKhoi = khoiSelect.value;
    const MaxSize = parseInt(maxSizeInput.value) || 35;
    console.log('⚡ Auto assign:', { MaKhoi, MaxSize });

    if (MaxSize < 20 || MaxSize > 50) {
      showMessage('Sĩ số tối đa phải từ 20-50 học sinh', 'error');
      return;
    }

    if (currentStudents.length === 0) {
      showMessage('Vui lòng tải dữ liệu trước', 'error');
      return;
    }

    const unassignedCount = currentStudents.filter(s => !s.MaLop || s.MaLop.trim() === '').length;
    if (unassignedCount === 0) {
      showMessage('Không có học sinh chưa phân lớp', 'info');
      return;
    }

    showLoading(true);
    try {
      const res = await fetch('/api/phanlophocsinh/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi, MaxSize })
      });
      if (!res.ok) throw new Error(`Auto-assign API error: ${res.status}`);
      const data = await res.json();
      console.log('📥 Auto assign response:', data);

      if (!data.success) {
        showMessage(data.message || 'Lỗi phân bổ tự động', 'error');
        return;
      }

      distribution = data.distribution;
      renderStudents();
      renderClasses();
      showMessage(data.message, 'success');
    } catch (err) {
      console.error('❌ Auto assign error:', err.message);
      showMessage('Lỗi phân bổ tự động: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  };

  // ======================
  // Lưu phân bổ
  // ======================
  const saveAssign = async () => {
    const totalAssigned = Object.values(distribution).reduce(
      (sum, d) => sum + d.students.length,
      0
    );
    console.log('💾 Saving assignments:', totalAssigned);

    if (totalAssigned === 0) {
      showMessage('Chưa có học sinh nào được phân bổ', 'error');
      return;
    }

    if (!confirm(`Bạn có chắc muốn lưu phân lớp cho ${totalAssigned} học sinh?`)) {
      return;
    }

    showLoading(true);
    try {
      const res = await fetch('/api/phanlophocsinh/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distribution })
      });
      if (!res.ok) throw new Error(`Save API error: ${res.status}`);
      const data = await res.json();
      console.log('📥 Save response:', data);
      showMessage(data.message, data.success ? 'success' : 'error');

      if (data.success) {
        distribution = {};
        await loadData();
      }
    } catch (err) {
      console.error('❌ Save error:', err.message);
      showMessage('Lỗi lưu phân bổ: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  };

  // ======================
  // Chỉnh sửa học sinh (global function)
  // ======================
  window.editStudent = (maHocSinh, currentMaLop) => {
    console.log('✏️ Edit student:', { maHocSinh, currentMaLop });
    const modal = document.getElementById('edit-modal');
    modal.classList.add('show');

    const maxSize = parseInt(maxSizeInput.value) || 35;
    const select = document.getElementById('edit-class-select');
    select.innerHTML = `<option value="">-- Bỏ phân lớp --</option>` + currentClasses.map(c => {
      const classMax = c.SiSo || maxSize;
      const currentCount = getClassCount(c.MaLop);
      const isCurrent = c.MaLop === currentMaLop;
      const available = currentCount < classMax || isCurrent;
      if (available) {
        return `<option value="${c.MaLop}" ${isCurrent ? 'selected' : ''}>
          ${c.TenLop} (${currentCount}/${classMax})${c.TenToHop && c.TenToHop !== 'Chưa chọn' ? ' - ' + c.TenToHop : ''}
        </option>`;
      }
      return '';
    }).join('');

    const confirmBtn = document.getElementById('edit-confirm');
    confirmBtn.onclick = () => {
      const newMaLop = select.value;
      console.log('✅ Confirm edit:', { maHocSinh, currentMaLop, newMaLop });

      if (newMaLop === currentMaLop) {
        closeModal('edit-modal');
        return;
      }

      // Remove from old class
      if (currentMaLop && distribution[currentMaLop]) {
        distribution[currentMaLop].students = distribution[currentMaLop].students.filter(
          s => s.MaHocSinh !== maHocSinh
        );
        if (distribution[currentMaLop].students.length === 0) {
          delete distribution[currentMaLop];
        }
      }

      // Add to new class
      if (newMaLop) {
        if (!distribution[newMaLop]) {
          const cls = currentClasses.find(c => c.MaLop === newMaLop);
          distribution[newMaLop] = { TenLop: cls.TenLop, students: [] };
        }
        const student = currentStudents.find(s => s.MaHocSinh === maHocSinh);
        if (student) {
          distribution[newMaLop].students.push(student);
        }
      }

      renderStudents();
      renderClasses();
      closeModal('edit-modal');
      showMessage('Đã cập nhật phân lớp tạm thời', 'info');
    };
  };

  // ======================
  // Hiển thị modal danh sách học sinh trong lớp
  // ======================
  window.showClassStudents = async (maLop) => {
    console.log('👥 Show students in class:', maLop);
    const modal = document.getElementById('class-modal');
    const title = document.getElementById('class-modal-title');
    const body = document.getElementById('class-modal-body');
    const classInfo = currentClasses.find(c => c.MaLop === maLop);
    title.textContent = classInfo ? `${maLop} - ${classInfo.TenLop}` : maLop;
    body.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    `;
    modal.classList.add('show');

    try {
      const res = await fetch('/api/phanlophocsinh/class-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaLop: maLop })
      });
      if (!res.ok) throw new Error(`Class-students API error: ${res.status}`);
      const data = await res.json();
      console.log('📥 Class students response:', data);

      if (!data.success) {
        throw new Error('Lỗi tải dữ liệu');
      }

      const newStudents = distribution[maLop] ? distribution[maLop].students : [];
      const existingStudents = data.students || [];

      if (existingStudents.length === 0 && newStudents.length === 0) {
        body.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <p>Chưa có học sinh trong lớp này</p>
          </div>
        `;
      } else {
        let html = '<ul class="student-list">';
        existingStudents.forEach((s, i) => {
          html += `
            <li class="student-item existing">
              <div class="student-info">
                <strong>${i + 1}. ${s.MaHocSinh}</strong> - ${s.TenHocSinh}
              </div>
              <div class="student-meta">
                Tổ hợp: ${s.TenToHop || 'Chưa chọn'} • Giới tính: ${s.GioiTinh} • ${s.TrangThai}
              </div>
            </li>
          `;
        });
        newStudents.forEach((s, i) => {
          html += `
            <li class="student-item new">
              <div class="student-info">
                <strong>${existingStudents.length + i + 1}. ${s.MaHocSinh}</strong> - ${s.TenHocSinh}
                <span class="badge-new">Mới</span>
              </div>
              <div class="student-meta">
                Tổ hợp: ${s.TenToHop || 'Chưa chọn'} • Giới tính: ${s.GioiTinh} • ${s.TrangThai}
              </div>
            </li>
          `;
        });
        html += '</ul>';

        if (existingStudents.length > 0 && newStudents.length > 0) {
          html = `<p style="padding: 10px; background: #e7f3ff; margin-bottom: 10px;">
            <strong>Tổng: ${existingStudents.length + newStudents.length} học sinh</strong> (${existingStudents.length} hiện tại + ${newStudents.length} mới)
          </p>` + html;
        }

        body.innerHTML = html;
      }
    } catch (err) {
      console.error('❌ Load class students error:', err.message);
      body.innerHTML = `
        <div class="empty-state">
          <p style="color: #dc3545;">❌ Lỗi tải dữ liệu</p>
        </div>
      `;
    }
  };

  // ======================
  // Đóng modal (global function)
  // ======================
  window.closeModal = (modalId) => {
    console.log('❌ Close modal:', modalId);
    document.getElementById(modalId).classList.remove('show');
  };

  // ======================
  // Utility Functions
  // ======================
  const showTableLoading = (tbody, colspan, message) => {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="loading-state">
          <div class="spinner"></div>
          <p>${message}</p>
        </td>
      </tr>
    `;
  };

  const showTableEmpty = (tbody, colspan, message) => {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>${message}</p>
        </td>
      </tr>
    `;
  };

  const showMessage = (message, type = 'info') => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    alert(`${icons[type] || 'ℹ️'} ${message}`);
  };

  const showLoading = (show) => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  };

  // ======================
  // Event Listeners
  // ======================
  loadBtn.addEventListener('click', loadData);
  autoBtn.addEventListener('click', autoAssign);
  saveBtn.addEventListener('click', saveAssign);

  khoiSelect.addEventListener('change', () => {
    console.log('🔄 Khoi changed to:', khoiSelect.value);
    distribution = {}; // Reset distribution khi đổi khối
    loadData();
  });

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Load dữ liệu ban đầu
  console.log('🚀 Initial load...');
  loadData();
});