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
    const safeVal = (el) => (el ? el.value : '');
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
        // attach handlers
        classesTableTbody.querySelectorAll('.assign-chunhiem').forEach(btn => btn.addEventListener('click', (e) => {
          const tr = e.target.closest('tr');
          if (tr) openChunhiemModal(tr.dataset.id);
        }));
        classesTableTbody.querySelectorAll('.delete-chunhiem').forEach(btn => btn.addEventListener('click', (e) => {
          const tr = e.target.closest('tr');
          if (tr) deleteChunhiem(tr.dataset.id);
        }));
      } catch (err) {
        console.error(err);
        classesTableTbody.innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu</td></tr>';
      }
    }

    // ===== Open modal phân công chủ nhiệm =====
    async function openChunhiemModal(MaLop) {
      const NamHoc = safeVal(namHocSelect);
      showModal('<p>Đang tải danh sách giáo viên...</p>');
      try {
        // get available teachers and current assignment
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
        const current = curData.current || null;

        if (!teachers.length) {
          showModal('<p style="color:red;">Không còn giáo viên nào phù hợp!</p>');
          return;
        }

        const options = teachers.map(t => `<option value="${escapeHtml(t.MaGiaoVien)}">${escapeHtml(t.TenGiaoVien)}</option>`).join('');
        const currentHtml = current ? `<p>Hiện tại: <strong>${escapeHtml(current.TenGiaoVien)}</strong></p>` : '';
        showModal(`
          <h3>Phân công chủ nhiệm - Lớp ${escapeHtml(MaLop)}</h3>
          ${currentHtml}
          <select id="gv-select-modal" style="width:100%;padding:8px;margin:10px 0">${options}</select>
          <div style="text-align:right"><button id="save-chunhiem" style="padding:8px 14px;background:#0a1d37;color:white;border:none;border-radius:5px;">Xác nhận</button></div>
        `);

        const saveBtn = document.getElementById('save-chunhiem');
        if (!saveBtn) return;
        // remove previous listeners (defensive)
        const newSave = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSave, saveBtn);

        newSave.addEventListener('click', async () => {
          const MaGVCN = document.getElementById('gv-select-modal')?.value || '';
          hideModal();
          try {
            const res = await fetch('/api/phancongchunhiembomon/assign-chunhiem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ MaLop, NamHoc, MaGVCN, KyHoc: safeVal(kyHocSelect) })
            });
            const result = await res.json();
            Swal.fire('Thông báo', result.message, result.success ? 'success' : 'error');
            if (result.success) await loadClasses();
          } catch (err) {
            console.error(err);
            Swal.fire('Lỗi', 'Không thể lưu phân công', 'error');
          }
        });
      } catch (err) {
        console.error(err);
        showModal('<p style="color:red;">Lỗi tải dữ liệu</p>');
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
        Swal.fire('Thông báo', result.message, result.success ? 'success' : 'error');
        if (result.success) await loadClasses();
      } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể xóa', 'error');
      }
    }

    // ===== Bộ môn: khoi, mon, gv, classes by khoi =====
    async function getKhoiList() {
      try {
        const res = await fetch('/api/phancongchunhiembomon/khoi-list', { method: 'POST' });
        const { khoiList = [] } = await res.json();
        if (!khoiSelect) return;
        khoiSelect.innerHTML = khoiList.map(k => `<option value="${escapeHtml(k.MaKhoi)}">${escapeHtml(k.TenKhoi)}</option>`).join('');
        if (khoiList.length) updateSubjects(khoiList[0].MaKhoi);
      } catch (err) {
        console.error(err);
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
        if (!monSelect) return;
        monSelect.innerHTML = subjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
        if (subjects.length) updateTeachersBySubject(subjects[0]);
      } catch (err) {
        console.error(err);
      }
    }

    async function updateTeachersBySubject(TenMonHoc) {
      if (!gvSelect) return;
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
        if (!teachers.length) {
          gvSelect.innerHTML = '<option value="">-- Không có giáo viên dạy môn này --</option>';
          classesBomonTbody && (classesBomonTbody.innerHTML = '<tr><td colspan="5">Không có giáo viên phù hợp</td></tr>');
          return;
        }
        gvSelect.innerHTML = teachers.map(t => `<option value="${escapeHtml(t.MaGiaoVien)}">${escapeHtml(t.TenGiaoVien)} (còn ${t.remaining} tiết)</option>`).join('');
        if (khoiSelect?.value) await loadClassesByKhoi(khoiSelect.value);
      } catch (err) {
        console.error(err);
        gvSelect.innerHTML = '<option value="">-- Lỗi tải giáo viên --</option>';
      }
    }

    async function loadClassesByKhoi(MaKhoi) {
      if (!classesBomonTbody) return;
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
        console.error(err);
        classesBomonTbody.innerHTML = '<tr><td colspan="5">Lỗi tải lớp</td></tr>';
      }
    }

    async function updateClassSubjectCounts() {
      if (!classesBomonTbody) return;
      const classIds = Array.from(classesBomonTbody.querySelectorAll('tr')).map(tr => tr.dataset.id).filter(Boolean);
      if (!classIds.length) return;
      try {
        const res = await fetch('/api/phancongchunhiembomon/subject-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ClassList: classIds, NamHoc: safeVal(namHocSelect), KyHoc: safeVal(kyHocSelect), TenMonHoc: safeVal(monSelect) })
        });
        const { counts = [] } = await res.json();
        counts.forEach(c => {
          const el = classesBomonTbody.querySelector(`.subject-count[data-id="${c.MaLop}"]`);
          if (el) el.textContent = c.count;
        });
      } catch (err) {
        console.error(err);
      }
    }

    // ===== Phân công bộ môn (chính) =====
    assignBomonBtn?.addEventListener('click', async () => {
      const MaGiaoVien = safeVal(gvSelect);
      const TenMonHoc = safeVal(monSelect);
      const NamHoc = safeVal(namHocSelect);
      const KyHoc = safeVal(kyHocSelect);
      const MaKhoi = safeVal(khoiSelect);

      const selectedClasses = Array.from(classesBomonTbody?.querySelectorAll('.bomon-check:checked') || []).map(cb => cb.closest('tr')?.dataset.id).filter(Boolean);
      if (!selectedClasses.length) return Swal.fire('Cảnh báo', 'Vui lòng chọn ít nhất một lớp', 'warning');
      if (!MaGiaoVien || !TenMonHoc) return Swal.fire('Cảnh báo', 'Chọn giáo viên và môn', 'warning');

      // Lấy tenGiaoVien
      const selectedGvOption = gvSelect.selectedOptions[0];
      const tenGiaoVien = selectedGvOption ? selectedGvOption.textContent.split(' (')[0].trim() : '';

      try {
        assignBomonBtn.disabled = true;

        // kiểm tra định mức trước
        const checkRes = await fetch('/api/phancongchunhiembomon/check-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
        });
        const check = await checkRes.json();
        if (!check.canAssign) {
          return Swal.fire('Không thể phân công', `Vượt định mức: ${check.currentLoad} + ${check.addedLoad} > ${check.MAX_LOAD}`, 'warning');
        }

        // thực hiện phân công
        const res = await fetch('/api/phancongchunhiembomon/assign-bomon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MaGiaoVien, ClassList: selectedClasses, NamHoc, KyHoc, TenMonHoc })
        });
        const result = await res.json();

        if (!result.success) {
          return Swal.fire('Lỗi', result.message || 'Phân công thất bại', 'error');
        }

        // success: cập nhật UI
        Swal.fire('Thành công!', result.message, 'success');

        // bỏ chọn checkboxes
        document.querySelectorAll('.bomon-check').forEach(cb => cb.checked = false);

        // reload dữ liệu
        await Promise.all([
          updateTeachersBySubject(TenMonHoc),
          loadClassesByKhoi(MaKhoi),
          loadAssignmentList()
        ]);

        // TỰ ĐỘNG LỌC theo môn + giáo viên vừa phân công
        if (filterMonSelect) filterMonSelect.value = TenMonHoc;
        if (filterMonSelect) filterMonSelect.dispatchEvent(new Event('change'));

        setTimeout(() => {
          if (filterGvSelect) {
            // Tìm option theo text (vì value là tên đầy đủ)
            const option = Array.from(filterGvSelect.options).find(opt => 
              opt.textContent.trim() === tenGiaoVien.trim()
            );
            if (option) {
              filterGvSelect.value = option.value;
            } else {
              // Nếu chưa có thì thêm tạm
              const newOpt = new Option(tenGiaoVien, tenGiaoVien);
              filterGvSelect.appendChild(newOpt);
              filterGvSelect.value = tenGiaoVien;
            }
            filterBtn?.click(); // tự động lọc
          }
        }, 300);

      } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể phân công', 'error');
      } finally {
        assignBomonBtn.disabled = false;
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
        allAssignments = assignments || [];
        if (!success || !assignments.length) {
          assignmentTableTbody && (assignmentTableTbody.innerHTML = '<tr><td colspan="9">Chưa có phân công bộ môn</td></tr>');
          if (filterMonSelect) filterMonSelect.innerHTML = '<option value="">-- Tất cả môn --</option>';
          if (filterGvSelect) filterGvSelect.innerHTML = '<option value="">-- Tất cả giáo viên --</option>';
          return;
        }

        // build filter lists
        const monSet = new Set();
        const gvByMon = {};
        assignments.forEach(a => {
          if (a.TenMonHoc) {
            monSet.add(a.TenMonHoc);
            if (!gvByMon[a.TenMonHoc]) gvByMon[a.TenMonHoc] = new Set();
            if (a.TenGiaoVien) gvByMon[a.TenMonHoc].add(a.TenGiaoVien);
          }
        });

        // populate filterMonSelect
        if (filterMonSelect) {
          filterMonSelect.innerHTML = '<option value="">-- Tất cả môn --</option>' +
            Array.from(monSet).sort().map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
          // onchange to populate filterGvSelect
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
        }

        displayAssignments(assignments);
      } catch (err) {
        console.error(err);
        assignmentTableTbody && (assignmentTableTbody.innerHTML = '<tr><td colspan="9">Lỗi tải danh sách</td></tr>');
      }
    }

    function displayAssignments(data) {
      if (!assignmentTableTbody) return;
      if (!data || !data.length) {
        assignmentTableTbody.innerHTML = '<tr><td colspan="9">Không có dữ liệu phù hợp</td></tr>';
        return;
      }
      assignmentTableTbody.innerHTML = data.map((a, i) => `
        <tr data-id="${escapeHtml(a.MaLop)}-${escapeHtml(a.TenGiaoVien)}-${escapeHtml(a.TenMonHoc)}">
          <td>${i + 1}</td>
          <td>${escapeHtml(a.Khoi || '')}</td>
          <td>${escapeHtml(a.TenMonHoc || '')}</td>
          <td>${escapeHtml(a.TenGiaoVien || '')}</td>
          <td>${escapeHtml(a.MaLop || '')}</td>
          <td>${escapeHtml(a.TenLop || '')}</td>
          <td>${escapeHtml(a.NamHoc || '')}</td>
          <td>${escapeHtml(a.HocKy || '')}</td>
          <td>
            <button class="delete-bomon-assign" style="background:#d9534f;padding:6px 10px;font-size:12px;">Xóa</button>
          </td>
        </tr>
      `).join('');

      // Gắn sự kiện xóa
      assignmentTableTbody.querySelectorAll('.delete-bomon-assign').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const tr = e.target.closest('tr');
          const maLop = tr.querySelector('td:nth-child(5)').textContent.trim();
          const tenGV = tr.querySelector('td:nth-child(4)').textContent.trim();
          const tenMon = tr.querySelector('td:nth-child(3)').textContent.trim();

          if (!confirm(`Xóa phân công môn "${tenMon}" cho giáo viên "${tenGV}" ở lớp "${maLop}"?`)) return;

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
            Swal.fire('Thông báo', result.message, result.success ? 'success' : 'error');
            if (result.success) {
              await loadAssignmentList(); // reload danh sách
              await updateTeachersBySubject(safeVal(monSelect)); // cập nhật lại remaining tiết
              if (khoiSelect?.value) await loadClassesByKhoi(khoiSelect.value);
            }
          } catch (err) {
            console.error(err);
            Swal.fire('Lỗi', 'Không thể xóa phân công', 'error');
          }
        });
      });
    }

    // filter button: apply filters to allAssignments and render
    filterBtn?.addEventListener('click', () => {
      const mon = safeVal(filterMonSelect);
      const gv = safeVal(filterGvSelect);
      const filtered = allAssignments.filter(a => (!mon || a.TenMonHoc === mon) && (!gv || a.TenGiaoVien === gv));
      displayAssignments(filtered);
    });

    // ===== events =====
    khoiSelect && khoiSelect.addEventListener('change', () => updateSubjects(khoiSelect.value));
    monSelect && monSelect.addEventListener('change', () => updateTeachersBySubject(monSelect.value));
    gvSelect && gvSelect.addEventListener('change', () => khoiSelect.value && loadClassesByKhoi(khoiSelect.value));

    namHocSelect?.addEventListener('change', () => { loadClasses(); loadAssignmentList(); });
    kyHocSelect?.addEventListener('change', loadAssignmentList);

    // startup
    if (tabChunhiem?.classList.contains('active')) {
      loadClasses();
    } else {
      getKhoiList();
      loadAssignmentList();
    }
  }

  // run
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPhanCong);
    } else {
      initPhanCong();
    }
  }
})();