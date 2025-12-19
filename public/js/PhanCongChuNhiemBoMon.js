// public/js/PhanCongChuNhiemBoMon.js
(function () {
  function initPhanCong() {
    if (window.initPhanCongDone) return;
    window.initPhanCongDone = true;

    // ===== DOM refs =====
    const tabChunhiem = document.getElementById('tab-chunhiem');
    const tabBomon = document.getElementById('tab-bomon');
    const chunhiemPanel = document.getElementById('chunhiem-panel');
    const bomonPanel = document.getElementById('bomon-panel');

    const namHocSelect = document.getElementById('namhoc-select');
    const kyHocSelect = document.getElementById('kyhoc-select');
    const classesTableTbody = document.querySelector('#classes-table tbody');

    const khoiSelect = document.getElementById('khoi-select');
    const monSelect = document.getElementById('mon-select');
    const gvSelect = document.getElementById('gv-select');
    const classesBomonTbody = document.querySelector('#classes-bomon-table tbody');
    const assignBomonBtn = document.getElementById('assign-bomon');

    const filterMonSelect = document.getElementById('filter-mon-select');
    const filterGvSelect = document.getElementById('filter-gv-select');
    const filterBtn = document.getElementById('filter-btn');
    const assignmentTableTbody = document.querySelector('#assignment-table tbody');

    const modal = document.getElementById('assign-modal');
    const modalClose = modal?.querySelector('.close');
    const modalBody = document.getElementById('modal-body');

    // internal state
    let allAssignments = [];

    // ===== helpers =====
    const safeVal = (el) => (el ? el.value.trim() : '');
    const escapeHtml = (str = '') => String(str).replace(/[&<>"'`=\/]/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
    })[s] || s);

    const showModal = (html) => {
      if (modalBody) modalBody.innerHTML = html;
      if (modal) modal.style.display = 'block';
    };
    const hideModal = () => { if (modal) modal.style.display = 'none'; };

    modalClose && modalClose.addEventListener('click', hideModal);
    window.addEventListener('click', e => { if (e.target === modal) hideModal(); });

    // ===== Tab switching =====
    tabChunhiem?.addEventListener('click', () => {
      tabChunhiem.classList.add('active');
      tabBomon?.classList.remove('active');
      chunhiemPanel?.classList.remove('hide');
      bomonPanel?.classList.add('hide');
      loadClasses();
    });

    tabBomon?.addEventListener('click', () => {
      tabBomon.classList.add('active');
      tabChunhiem?.classList.remove('active');
      bomonPanel?.classList.remove('hide');
      chunhiemPanel?.classList.add('hide');
      getKhoiList();
      loadAssignmentList();
    });

    // ===== Chủ nhiệm: load classes =====
    async function loadClasses() {
      if (!classesTableTbody || !namHocSelect) return;
      const NamHoc = safeVal(namHocSelect);
      classesTableTbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
      try {
        const res = await fetch('/api/phancongchunhiembomon/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NamHoc })
        });
        const { success, classes = [] } = await res.json();
        if (!success || classes.length === 0) {
          classesTableTbody.innerHTML = '<tr><td colspan="5">Không có lớp nào</td></tr>';
          return;
        }
        classesTableTbody.innerHTML = classes.map((c, i) => `
          <tr data-id="${escapeHtml(c.MaLop)}">
            <td>${i + 1}</td>
            <td>${escapeHtml(c.MaLop)}</td>
            <td>${escapeHtml(c.TenLop)}</td>
            <td>${escapeHtml(c.TenGVCN || 'Chưa phân công')}</td>
            <td>
              <button class="assign-chunhiem">Phân công</button>
              <button class="delete-chunhiem" style="background:#d9534f;margin-left:5px;">Xóa</button>
            </td>
          </tr>
        `).join('');

        classesTableTbody.querySelectorAll('.assign-chunhiem').forEach(btn => {
          btn.onclick = (e) => {
            const tr = e.target.closest('tr');
            if (tr) openChunhiemModal(tr.dataset.id);
          };
        });

        classesTableTbody.querySelectorAll('.delete-chunhiem').forEach(btn => {
          btn.onclick = (e) => {
            const tr = e.target.closest('tr');
            if (tr) deleteChunhiem(tr.dataset.id);
          };
        });
      } catch (err) {
        console.error('Lỗi loadClasses:', err);
        classesTableTbody.innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu</td></tr>';
      }
    }

    // ===== Modal phân công chủ nhiệm =====
    async function openChunhiemModal(MaLop) {
      const NamHoc = safeVal(namHocSelect);
      showModal('<p>Đang tải giáo viên khả dụng...</p>');
      try {
        const [availRes, curRes] = await Promise.all([
          fetch('/api/phancongchunhiembomon/teachers-available', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NamHoc, MaLop })
          }),
          fetch('/api/phancongchunhiembomon/current-gvcn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ MaLop, NamHoc })
          })
        ]);

        const availData = await availRes.json();
        const curData = await curRes.json();

        const teachers = availData.teachers || [];
        const current = curData.current;

        if (teachers.length === 0) {
          showModal('<p style="color:red;">Không còn giáo viên nào khả dụng!</p>');
          return;
        }

        const options = teachers.map(t => `<option value="${escapeHtml(t.MaGiaoVien)}">${escapeHtml(t.TenGiaoVien)}</option>`).join('');
        const currentHtml = current ? `<p><strong>Hiện tại:</strong> ${escapeHtml(current.TenGiaoVien)}</p>` : '';

        showModal(`
          <h3>Phân công chủ nhiệm lớp ${escapeHtml(MaLop)}</h3>
          ${currentHtml}
          <select id="gv-select-modal" style="width:100%; padding:8px; margin:10px 0;">${options}</select>
          <div style="text-align:right; margin-top:15px;">
            <button id="save-chunhiem" style="padding:8px 16px; background:#0a1d37; color:white; border:none; border-radius:5px;">Xác nhận</button>
          </div>
        `);

        document.getElementById('save-chunhiem')?.addEventListener('click', async () => {
          const MaGVCN = document.getElementById('gv-select-modal')?.value;
          if (!MaGVCN) {
            alert('Lỗi: Vui lòng chọn giáo viên');
            return;
          }

          hideModal();
          try {
            const res = await fetch('/api/phancongchunhiembomon/assign-chunhiem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ MaLop, NamHoc, MaGVCN, KyHoc: safeVal(kyHocSelect) })
            });
            const result = await res.json();
            alert(result.message || (result.success ? 'Phân công chủ nhiệm thành công!' : 'Có lỗi khi phân công'));
            if (result.success) await loadClasses();
          } catch (err) {
            console.error(err);
            alert('Lỗi: Không thể lưu phân công chủ nhiệm');
          }
        });
      } catch (err) {
        console.error(err);
        showModal('<p style="color:red;">Lỗi tải dữ liệu giáo viên</p>');
      }
    }

    async function deleteChunhiem(MaLop) {
      if (!confirm('Xóa giáo viên chủ nhiệm của lớp này?')) return;
      try {
        const res = await fetch('/api/phancongchunhiembomon/delete-chunhiem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaLop, NamHoc: safeVal(namHocSelect) })
        });
        const result = await res.json();
        alert(result.message || (result.success ? 'Xóa thành công!' : 'Có lỗi khi xóa'));
        if (result.success) await loadClasses();
      } catch (err) {
        console.error(err);
        alert('Lỗi: Không thể xóa giáo viên chủ nhiệm');
      }
    }

    // ===== Bộ môn =====
    async function getKhoiList() {
      try {
        const res = await fetch('/api/phancongchunhiembomon/khoi-list', { method: 'POST' });
        const { khoiList = [] } = await res.json();
        khoiSelect.innerHTML = '<option value="">-- Chọn khối --</option>' +
          khoiList.map(k => `<option value="${escapeHtml(k.MaKhoi)}">${escapeHtml(k.TenKhoi)}</option>`).join('');
        if (khoiList.length > 0) updateSubjects(khoiList[0].MaKhoi);
      } catch (err) {
        console.error('Lỗi getKhoiList:', err);
      }
    }

    async function updateSubjects(MaKhoi) {
      try {
        const res = await fetch('/api/phancongchunhiembomon/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        });
        const { subjects = [] } = await res.json();
        monSelect.innerHTML = '<option value="">-- Chọn môn --</option>' +
          subjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
        if (subjects.length > 0) updateTeachersBySubject(subjects[0]);
      } catch (err) {
        console.error('Lỗi updateSubjects:', err);
      }
    }

    async function updateTeachersBySubject(TenMonHoc) {
      if (!TenMonHoc) {
        gvSelect.innerHTML = '<option value="">-- Chọn môn trước --</option>';
        return;
      }
      try {
        const res = await fetch('/api/phancongchunhiembomon/teachers-by-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ TenMonHoc, NamHoc: safeVal(namHocSelect), KyHoc: safeVal(kyHocSelect) })
        });
        const { teachers = [] } = await res.json();
        if (teachers.length === 0) {
          gvSelect.innerHTML = '<option value="">-- Không có giáo viên khả dụng --</option>';
          classesBomonTbody.innerHTML = '<tr><td colspan="5">Không có giáo viên phù hợp</td></tr>';
          return;
        }
        gvSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>' +
          teachers.map(t => `
            <option value="${escapeHtml(t.MaGiaoVien)}">
              ${escapeHtml(t.TenGiaoVien)} (còn ${t.remaining} tiết)
            </option>
          `).join('');
        if (khoiSelect.value) await loadClassesByKhoi(khoiSelect.value);
      } catch (err) {
        console.error('Lỗi updateTeachersBySubject:', err);
        gvSelect.innerHTML = '<option value="">-- Lỗi tải dữ liệu --</option>';
      }
    }

    async function loadClassesByKhoi(MaKhoi) {
      classesBomonTbody.innerHTML = '<tr><td colspan="5">Đang tải lớp...</td></tr>';
      try {
        const res = await fetch('/api/phancongchunhiembomon/classes-by-khoi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaKhoi })
        });
        const { classes = [] } = await res.json();
        classesBomonTbody.innerHTML = classes.map((c, i) => `
          <tr data-id="${escapeHtml(c.MaLop)}">
            <td>${i + 1}</td>
            <td>${escapeHtml(c.MaLop)}</td>
            <td>${escapeHtml(c.TenLop)}</td>
            <td><input type="checkbox" class="bomon-check"></td>
            <td class="subject-count" data-id="${escapeHtml(c.MaLop)}">-</td>
          </tr>
        `).join('');
        updateClassSubjectCounts();
      } catch (err) {
        console.error('Lỗi loadClassesByKhoi:', err);
        classesBomonTbody.innerHTML = '<tr><td colspan="5">Lỗi tải lớp</td></tr>';
      }
    }

    async function updateClassSubjectCounts() {
      const classIds = Array.from(classesBomonTbody.querySelectorAll('tr')).map(tr => tr.dataset.id).filter(Boolean);
      if (classIds.length === 0) return;
      try {
        const res = await fetch('/api/phancongchunhiembomon/subject-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ClassList: classIds,
            NamHoc: safeVal(namHocSelect),
            KyHoc: safeVal(kyHocSelect),
            TenMonHoc: safeVal(monSelect)
          })
        });
        const { counts = [] } = await res.json();
        counts.forEach(c => {
          const el = classesBomonTbody.querySelector(`.subject-count[data-id="${c.MaLop}"]`);
          if (el) el.textContent = c.count || 0;
        });
      } catch (err) {
        console.error('Lỗi updateClassSubjectCounts:', err);
      }
    }

    // ===== PHÂN CÔNG BỘ MÔN =====
    assignBomonBtn?.addEventListener('click', async () => {
      const MaGiaoVien = safeVal(gvSelect);
      const TenMonHoc = safeVal(monSelect);
      const NamHoc = safeVal(namHocSelect);
      const KyHoc = safeVal(kyHocSelect);
      const MaKhoi = safeVal(khoiSelect);

      const selectedClasses = Array.from(classesBomonTbody?.querySelectorAll('.bomon-check:checked') || [])
        .map(cb => cb.closest('tr')?.dataset.id)
        .filter(Boolean);

      if (!MaGiaoVien) return alert('Cảnh báo: Vui lòng chọn giáo viên');
      if (!TenMonHoc) return alert('Cảnh báo: Vui lòng chọn môn học');
      if (selectedClasses.length === 0) return alert('Cảnh báo: Vui lòng chọn ít nhất một lớp');

      const selectedGvOption = gvSelect.selectedOptions[0];
      const tenGiaoVien = selectedGvOption ? selectedGvOption.textContent.split(' (')[0].trim() : '';

      try {
        // 1. Kiểm tra định mức
        const checkRes = await fetch('/api/phancongchunhiembomon/check-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
        });
        const check = await checkRes.json();

        if (!check.canAssign) {
          // Ép về số nguyên để tránh lỗi chuỗi từ backend
          const current = parseInt(check.currentLoad || 0, 10);
          const added = parseInt(check.addedLoad || 0, 10);
          const max = parseInt(check.MAX_LOAD || 30, 10);
          const total = current + added;

          alert(
            `Không thể phân công do vượt định mức tiết dạy!\n\n` +
            `• Định mức tối đa cho phép: ${max} tiết\n` +
            `• Hiện tại giáo viên đã dạy: ${current} tiết\n` +
            `• Sẽ thêm từ các lớp đã chọn: ${added} tiết\n` +
            `• Tổng sau khi phân công: ${total} tiết\n\n` +
            `=> VƯỢT ${total - max} TIẾT SO VỚI ĐỊNH MỨC!`
          );
          return;
        }

        // 2. Thực hiện phân công
        const res = await fetch('/api/phancongchunhiembomon/assign-bomon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
        });
        const result = await res.json();

        alert(
          result.success
            ? 'Thành công!\n' + (result.message || 'Phân công bộ môn hoàn tất')
            : 'Lỗi!\n' + (result.message || 'Có lỗi xảy ra khi phân công')
        );

        if (result.success) {
          // Reset checkbox
          document.querySelectorAll('.bomon-check').forEach(cb => cb.checked = false);

          // Reload dữ liệu
          await Promise.all([
            updateTeachersBySubject(TenMonHoc),
            loadClassesByKhoi(MaKhoi),
            loadAssignmentList()
          ]);

          // Tự động lọc theo môn và giáo viên vừa phân công
          if (filterMonSelect) {
            filterMonSelect.value = TenMonHoc;
            filterMonSelect.dispatchEvent(new Event('change'));
          }

          setTimeout(() => {
            if (filterGvSelect && tenGiaoVien) {
              let opt = Array.from(filterGvSelect.options).find(o => o.textContent.trim() === tenGiaoVien.trim());
              if (!opt) {
                opt = new Option(tenGiaoVien, tenGiaoVien);
                filterGvSelect.appendChild(opt);
              }
              filterGvSelect.value = opt.value;
              filterBtn?.click();
            }
          }, 300);
        }
      } catch (err) {
        console.error('Lỗi nghiêm trọng khi phân công bộ môn:', err);
        alert('Lỗi kết nối: Không thể thực hiện phân công. Vui lòng kiểm tra mạng hoặc console.');
      }
    });

    // ===== Danh sách phân công =====
    async function loadAssignmentList() {
      try {
        const res = await fetch('/api/phancongchunhiembomon/list-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NamHoc: safeVal(namHocSelect), KyHoc: safeVal(kyHocSelect) })
        });
        const { success, assignments = [] } = await res.json();
        allAssignments = assignments;

        if (!success || assignments.length === 0) {
          assignmentTableTbody.innerHTML = '<tr><td colspan="9">Chưa có phân công bộ môn</td></tr>';
          filterMonSelect && (filterMonSelect.innerHTML = '<option value="">-- Tất cả môn --</option>');
          filterGvSelect && (filterGvSelect.innerHTML = '<option value="">-- Tất cả giáo viên --</option>');
          return;
        }

        const monSet = new Set();
        const gvByMon = {};
        assignments.forEach(a => {
          monSet.add(a.TenMonHoc);
          if (!gvByMon[a.TenMonHoc]) gvByMon[a.TenMonHoc] = new Set();
          gvByMon[a.TenMonHoc].add(a.TenGiaoVien);
        });

        filterMonSelect.innerHTML = '<option value="">-- Tất cả môn --</option>' +
          Array.from(monSet).sort().map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

        filterMonSelect.onchange = () => {
          const mon = filterMonSelect.value;
          if (!mon) {
            filterGvSelect.innerHTML = '<option value="">-- Tất cả giáo viên --</option>';
            return;
          }
          const list = Array.from(gvByMon[mon] || []).sort();
          filterGvSelect.innerHTML = '<option value="">-- Tất cả giáo viên --</option>' +
            list.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
        };

        displayAssignments(assignments);
      } catch (err) {
        console.error('Lỗi loadAssignmentList:', err);
        assignmentTableTbody.innerHTML = '<tr><td colspan="9">Lỗi tải danh sách</td></tr>';
      }
    }

    function displayAssignments(data) {
      if (!data.length) {
        assignmentTableTbody.innerHTML = '<tr><td colspan="9">Không có dữ liệu phù hợp</td></tr>';
        return;
      }
      assignmentTableTbody.innerHTML = data.map((a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(a.Khoi || '')}</td>
          <td>${escapeHtml(a.TenMonHoc || '')}</td>
          <td>${escapeHtml(a.TenGiaoVien || '')}</td>
          <td>${escapeHtml(a.MaLop || '')}</td>
          <td>${escapeHtml(a.TenLop || '')}</td>
          <td>${escapeHtml(a.NamHoc || '')}</td>
          <td>${escapeHtml(a.HocKy || '')}</td>
          <td><button class="delete-bomon-assign" style="background:#d9534f; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:12px;">Xóa</button></td>
        </tr>
      `).join('');

      assignmentTableTbody.querySelectorAll('.delete-bomon-assign').forEach(btn => {
        btn.onclick = async (e) => {
          const tr = e.target.closest('tr');
          const maLop = tr.cells[4].textContent.trim();
          const tenGV = tr.cells[3].textContent.trim();
          const tenMon = tr.cells[2].textContent.trim();

          if (!confirm(`Xóa phân công môn "${tenMon}" cho GV "${tenGV}" ở lớp "${maLop}"?`)) return;

          try {
            const res = await fetch('/api/phancongchunhiembomon/delete-bomon-assign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                MaLop: maLop,
                MaGiaoVien: tenGV,
                TenMonHoc: tenMon,
                NamHoc: safeVal(namHocSelect),
                KyHoc: safeVal(kyHocSelect)
              })
            });
            const result = await res.json();
            alert(result.message || (result.success ? 'Xóa phân công thành công!' : 'Có lỗi khi xóa'));
            if (result.success) {
              await loadAssignmentList();
              await updateTeachersBySubject(safeVal(monSelect));
              if (khoiSelect.value) await loadClassesByKhoi(khoiSelect.value);
            }
          } catch (err) {
            console.error(err);
            alert('Lỗi: Không thể xóa phân công');
          }
        };
      });
    }

    filterBtn?.addEventListener('click', () => {
      const mon = safeVal(filterMonSelect);
      const gv = safeVal(filterGvSelect);
      const filtered = allAssignments.filter(a =>
        (!mon || a.TenMonHoc === mon) && (!gv || a.TenGiaoVien === gv)
      );
      displayAssignments(filtered);
    });

    // ===== Events =====
    khoiSelect?.addEventListener('change', () => updateSubjects(khoiSelect.value));
    monSelect?.addEventListener('change', () => updateTeachersBySubject(monSelect.value));
    gvSelect?.addEventListener('change', () => khoiSelect.value && loadClassesByKhoi(khoiSelect.value));

    namHocSelect?.addEventListener('change', () => {
      loadClasses();
      loadAssignmentList();
    });
    kyHocSelect?.addEventListener('change', loadAssignmentList);

    // Startup
    if (tabChunhiem?.classList.contains('active')) {
      loadClasses();
    } else {
      getKhoiList();
      loadAssignmentList();
    }
  }

  // Chạy khi DOM ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPhanCong);
    } else {
      initPhanCong();
    }
  }
})();