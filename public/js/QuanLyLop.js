document.addEventListener('DOMContentLoaded', () => {
  const khoiSelect = document.getElementById('khoi-select');
  const numClasses = document.getElementById('num-classes');
  const createBtn = document.getElementById('create-classes');
  const classesTableTbody = document.querySelector('#classes-table tbody');
  const editModal = document.getElementById('edit-modal');
  const editClose = editModal.querySelector('.close');
  const editKhoi = document.getElementById('edit-khoi');
  const editTenLop = document.getElementById('edit-tenlop');
  const editTrangThai = document.getElementById('edit-trangthai');
  const editSiSo = document.getElementById('edit-siso');
  const confirmSave = document.getElementById('confirm-save');
  let editingMaLop = null;

  editClose.onclick = () => editModal.style.display = 'none';

  async function loadClasses() {
    const MaKhoi = khoiSelect.value;
    classesTableTbody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';
    try {
      const res = await fetch('/api/quanlylop/classes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi })
      });
      const data = await res.json();
      if (!data.success) throw new Error('Lỗi khi lấy danh sách lớp');
      const rows = data.classes;
      if (!rows.length) { classesTableTbody.innerHTML = '<tr><td colspan="7">Không có lớp</td></tr>'; return; }
      classesTableTbody.innerHTML = rows.map((r, i) => `
        <tr data-id="${r.MaLop}">
          <td>${i+1}</td>
          <td>${r.MaLop}</td>
          <td>${r.TenLop}</td>
          <td>${r.Khoi}</td>
          <td>${r.TrangThai}</td>
          <td>${r.SiSo || 0}</td>
          <td>
            <button class="edit-class">Sửa</button>
            <button class="delete-class">Xóa</button>
          </td>
        </tr>
      `).join('');

      classesTableTbody.querySelectorAll('.edit-class').forEach(b => b.addEventListener('click', openEdit));
      classesTableTbody.querySelectorAll('.delete-class').forEach(b => b.addEventListener('click', deleteClass));
    } catch (err) {
      console.error(err);
      classesTableTbody.innerHTML = '<tr><td colspan="7">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  async function createClasses() {
    const MaKhoi = khoiSelect.value;
    const number = parseInt(numClasses.value, 10);
    if (!MaKhoi) return alert('Vui lòng chọn khối');
    if (!number || number <= 0) return alert('Vui lòng nhập số lượng lớp');
    try {
      const res = await fetch('/api/quanlylop/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MaKhoi, number })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Thêm lớp thất bại');
      alert('Thêm lớp thành công');
      await loadClasses();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi');
    }
  }

  async function openEdit(e) {
    const tr = e.target.closest('tr');
    const MaLop = tr.dataset.id;
    editingMaLop = MaLop;
    editModal.style.display = 'block';
    // fill controls
    editKhoi.innerHTML = Array.from(khoiSelect.options).map(opt => `<option value="${opt.value}" ${opt.value===khoiSelect.value ? 'selected' : ''}>${opt.text}</option>`).join('');
    editTenLop.value = tr.children[2].textContent;
    editTrangThai.value = tr.children[4].textContent;
    editSiSo.value = tr.children[5].textContent;
    // load teachers
    const tremp = await fetch('/api/quanlylop/teachers', { method: 'POST', headers: {'Content-Type': 'application/json'} });
    const tdata = await tremp.json();
    if (tdata.success) {
      const select = document.getElementById('edit-gvcn');
      select.innerHTML = tdata.teachers.map(t => `<option value="${t.MaGiaoVien}">${t.TenGiaoVien}</option>`).join('');
      // get current gvcn
      try {
        const curRes = await fetch('/api/phancongchunhiembomon/current-gvcn', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ MaLop }) });
        const curData = await curRes.json();
        if (curData.success && curData.current) {
          select.value = curData.current.MaGiaoVien;
        }
      } catch (err) {
        console.error('No current GVCN', err);
      }
    }
  }

  async function deleteClass(e) {
    const tr = e.target.closest('tr');
    const MaLop = tr.dataset.id;
    if (!confirm('Bạn có chắc muốn xóa lớp này không?')) return;
    try {
      const res = await fetch('/api/quanlylop/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ MaLop }) });
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Lỗi xóa');
      alert('Đã xóa lớp');
      await loadClasses();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi xóa');
    }
  }

  confirmSave.addEventListener('click', async () => {
    const TenLop = editTenLop.value.trim();
    const Khoi = editKhoi.value;
    const TrangThai = editTrangThai.value;
    const SiSo = parseInt(editSiSo.value, 10) || 0;
    const MaGVCN = document.getElementById('edit-gvcn')?.value || null;
    try {
      const res = await fetch('/api/quanlylop/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ MaLop: editingMaLop, TenLop, Khoi, TrangThai, SiSo, MaGVCN }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi cập nhật');
      alert('Cập nhật lớp thành công');
      editModal.style.display = 'none';
      await loadClasses();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi cập nhật');
    }
  });

  // initial load
  loadClasses();
  createBtn.addEventListener('click', createClasses);
  khoiSelect.addEventListener('change', loadClasses);
});
