// UI xin sửa điểm: submit placeholder + hủy quay lại danh sách lớp
(function () {
  const main = document.getElementById('main-content');
  const cancelBtn = document.getElementById('qldm-cancel');
  const form = document.getElementById('qldm-edit-form');
  const selectHS = document.getElementById('qldm-mahs');
  const selectLoaiDiem = document.getElementById('qldm-loaidiem');
  const inputDiemCu = document.getElementById('qldm-diemcu');
  const inputDiemMoi = document.getElementById('qldm-diemmoi');
  const inputLyDo = document.getElementById('qldm-lydo');
  const inputMinhChung = document.getElementById('qldm-minhchung');

  const data = window.qldmEditData || { maLop: '', tenLop: '' };
  let students = [];

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

  function bindInternalNav() {
    document.querySelectorAll('[data-qldm-nav]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const url = a.getAttribute('data-qldm-nav');
        if (url) loadIntoMain(url);
      });
    });
  }

  async function loadStudents() {
    if (!data.maLop || !selectHS) return;
    try {
      const params = new URLSearchParams({ maLop: data.maLop });
      const res = await fetch(`/api/quanlydiem/students?${params.toString()}`);
      const result = await res.json();
      if (!result.success) return;
      students = result.students || [];

      // fill select: value=MaHocSinh, label=TenHocSinh
      selectHS.innerHTML = `<option value="">-- Chọn học sinh --</option>` +
        students.map(s => `<option value="${s.MaHocSinh}">${s.TenHocSinh || s.MaHocSinh}</option>`).join('');
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshOldScore() {
    const maHS = selectHS?.value || '';
    const loaiDiem = selectLoaiDiem?.value || '';
    if (!maHS || !loaiDiem) {
      if (inputDiemCu) inputDiemCu.value = '';
      return;
    }
    try {
      const params = new URLSearchParams({ maHocSinh: maHS, maLop: data.maLop, loaiDiem });
      const res = await fetch(`/api/quanlydiem/old-score?${params.toString()}`);
      const result = await res.json();
      if (!result.success) {
        if (inputDiemCu) inputDiemCu.value = '';
        return;
      }
      if (inputDiemCu) inputDiemCu.value = result.diemCu ?? '';
    } catch (err) {
      console.error(err);
      if (inputDiemCu) inputDiemCu.value = '';
    }
  }

  function bindSelect() {
    if (!selectHS) return;
    selectHS.addEventListener('change', () => {
      refreshOldScore();
    });
    selectLoaiDiem?.addEventListener('change', refreshOldScore);
  }

  cancelBtn?.addEventListener('click', () => {
    loadIntoMain('/api/quanlydiem/render/classes');
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    // Gửi yêu cầu sửa điểm (kèm file minh chứng)
    if (!selectHS?.value || !selectLoaiDiem?.value) {
      alert('Vui lòng chọn học sinh và loại điểm cần sửa.');
      return;
    }
    if (!inputDiemCu?.value) {
      alert('Vui lòng chọn học sinh và loại điểm để lấy điểm cũ.');
      return;
    }
    if (!inputLyDo?.value?.trim()) {
      alert('Vui lòng nhập lý do sửa điểm.');
      return;
    }
    if (!inputMinhChung?.files || inputMinhChung.files.length === 0) {
      alert('Vui lòng chọn minh chứng.');
      return;
    }

    const fd = new FormData();
    fd.append('maHocSinh', selectHS.value);
    fd.append('maLop', data.maLop);
    fd.append('loaiDiem', selectLoaiDiem.value);
    fd.append('diemCu', inputDiemCu.value);
    fd.append('diemMoi', inputDiemMoi?.value || '');
    fd.append('lyDo', inputLyDo.value.trim());
    fd.append('minhChung', inputMinhChung.files[0]);

    try {
      const res = await fetch('/api/quanlydiem/request-edit', { method: 'POST', body: fd });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || 'Gửi yêu cầu sửa điểm thất bại');
        return;
      }
      alert('Gửi yêu cầu sửa điểm thành công');
      loadIntoMain('/api/quanlydiem/render/classes');
    } catch (err) {
      console.error(err);
      alert('Gửi yêu cầu sửa điểm thất bại');
    }
  });

  bindInternalNav();
  bindSelect();
  loadStudents();
})();
