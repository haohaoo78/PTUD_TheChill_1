// UI danh sách lớp + chọn lớp + bật nút thêm/sửa
(function () {
  const data = window.qldmData || { classList: [] };
  const grid = document.getElementById('qldm-class-grid');
  const btnAdd = document.getElementById('qldm-btn-add');
  const btnEdit = document.getElementById('qldm-btn-edit');
  const main = document.getElementById('main-content');

  let selected = null; // { MaLop, TenLop }

  async function loadIntoMain(url) {
    if (!main) {
      window.location.href = url;
      return;
    }
    const res = await fetch(url);
    const html = await res.text();
    main.innerHTML = html;
    main.querySelectorAll('script').forEach(s => {
      const n = document.createElement('script');
      if (s.src) n.src = s.src;
      else n.textContent = s.textContent;
      document.body.appendChild(n);
      s.remove();
    });
  }

  async function loadClasses() {
    try {
      const res = await fetch('/api/quanlydiem/classes');
      const result = await res.json();
      if (!result.success) {
        // giữ nguyên UI server-side nếu có
        return;
      }
      data.classList = result.classList || [];
      data.namHoc = result.namHoc || data.namHoc || '';
      renderClassCards(data.classList);
      // reset selection after reload
      selected = null;
      setButtonsEnabled(false);
    } catch (err) {
      console.error(err);
      // giữ nguyên UI server-side nếu có
    }
  }

  function renderClassCards(classList) {
    if (!grid) return;
    if (!classList || classList.length === 0) {
      grid.innerHTML = '<div class="empty-note">Chưa có lớp nào được gán.</div>';
      return;
    }
    grid.innerHTML = classList
      .map(
        c => `
          <div class="class-card" data-malop="${c.MaLop}" data-tenlop="${c.TenLop || c.MaLop}">
            <div class="class-name">${c.TenLop || c.MaLop}</div>
            <div class="class-meta">Mã lớp: ${c.MaLop}</div>
          </div>
        `
      )
      .join('');
  }

  function setButtonsEnabled(enabled) {
    if (btnAdd) btnAdd.disabled = !enabled;
    if (btnEdit) btnEdit.disabled = !enabled;
  }

  function selectCard(card) {
    grid?.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selected = {
      MaLop: card.dataset.malop || '',
      TenLop: card.dataset.tenlop || ''
    };
    setButtonsEnabled(!!selected.MaLop);
  }

  function bindSelection() {
    if (!grid) return;
    grid.addEventListener('click', e => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      selectCard(card);
    });
  }

  function bindButtons() {
    btnAdd?.addEventListener('click', () => {
      if (!selected?.MaLop) return;
      // TODO: gọi API thêm điểm theo lớp; hiện tại chuyển trang danh sách học sinh
      const params = new URLSearchParams({ maLop: selected.MaLop, tenLop: selected.TenLop, mode: 'add' });
      loadIntoMain(`/api/quanlydiem/render/students?${params.toString()}`);
    });

    btnEdit?.addEventListener('click', () => {
      if (!selected?.MaLop) return;
      // Sửa điểm: mở form xin sửa điểm
      const params = new URLSearchParams({ maLop: selected.MaLop, tenLop: selected.TenLop });
      loadIntoMain(`/api/quanlydiem/render/request-edit?${params.toString()}`);
    });
  }

  setButtonsEnabled(false);
  bindSelection();
  bindButtons();

  // Ưu tiên dữ liệu từ API để đảm bảo mới nhất
  loadClasses();
})();
