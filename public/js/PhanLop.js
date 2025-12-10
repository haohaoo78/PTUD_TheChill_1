// public/js/PhanLop.js
document.addEventListener('DOMContentLoaded', () => {
  const namHocSelect = document.getElementById('namhoc-select');
  const khoiSelect = document.getElementById('khoi-select');
  const maxSizeInput = document.getElementById('max-size');
  const loadBtn = document.getElementById('load-students');
  const autoBtn = document.getElementById('auto-assign');
  const saveBtn = document.getElementById('save-assign');

  const studentsTbody = document.querySelector('#students-table tbody');
  const classesTbody = document.querySelector('#classes-table tbody');

  let distribution = {}; // { MaLop: { students: [...] } }

  const loadData = async () => {
    const NamHoc = namHocSelect.value;
    const MaKhoi = khoiSelect.value;

    studentsTbody.innerHTML = '<tr><td colspan="6">Đang tải học sinh...</td></tr>';
    classesTbody.innerHTML = '<tr><td colspan="5">Đang tải lớp...</td></tr>';

    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/phanlophocsinh/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ NamHoc, MaKhoi }) }),
        fetch('/api/phanlophocsinh/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ MaKhoi }) })
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      // Hiển thị học sinh chưa phân lớp
      if (data1.students.length === 0) {
        studentsTbody.innerHTML = '<tr><td colspan="6" style="color:orange">Không có học sinh chưa phân lớp</td></tr>';
      } else {
        studentsTbody.innerHTML = data1.students.map((s, i) => `
          <tr data-id="${s.MaHocSinh}">
            <td>${i+1}</td>
            <td>${s.MaHocSinh}</td>
            <td>${s.TenHocSinh}</td>
            <td>${s.ToHop}</td>
            <td>${s.TrangThai}</td>
            <td class="assigned-class">—</td>
          </tr>
        `).join('');
      }

      // Hiển thị lớp
      if (data2.classes.length === 0) {
        classesTbody.innerHTML = '<tr><td colspan="5">Không có lớp</td></tr>';
      } else {
        classesTbody.innerHTML = data2.classes.map((c, i) => `
          <tr data-id="${c.MaLop}" ondblclick="showClassStudents('${c.MaLop}')">
            <td>${i+1}</td>
            <td>${c.MaLop}</td>
            <td>${c.TenLop}</td>
            <td>${c.SiSo || 35}</td>
            <td class="current-count">${c.CurrentCount || 0}</td>
          </tr>
        `).join('');
      }

      distribution = {}; // Reset
    } catch (err) {
      alert('Lỗi tải dữ liệu');
    }
  };

  const autoAssign = async () => {
    const NamHoc = namHocSelect.value;
    const MaKhoi = khoiSelect.value;
    const MaxSize = parseInt(maxSizeInput.value) || 35;

    if (MaxSize < 20 || MaxSize > 50) return alert('Sĩ số tối đa từ 20-50');

    const res = await fetch('/api/phanlophocsinh/auto-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NamHoc, MaKhoi, MaxSize })
    });
    const data = await res.json();

    if (!data.success) return alert(data.message);

    distribution = data.distribution;

    // Cập nhật bảng lớp: số lượng mới = hiện tại + phân mới
    document.querySelectorAll('#classes-table tr[data-id]').forEach(tr => {
      const maLop = tr.dataset.id;
      const newCount = (distribution[maLop]?.students?.length || 0) + 
                       parseInt(tr.querySelector('.current-count').textContent || 0);
      tr.querySelector('.current-count').textContent = newCount;
    });

    // Cập nhật cột "Lớp hiện tại" cho học sinh
    document.querySelectorAll('#students-table tr[data-id]').forEach(tr => {
      const maHS = tr.dataset.id;
      let assignedClass = '—';
      for (const maLop in distribution) {
        if (distribution[maLop].students.some(s => s.MaHocSinh === maHS)) {
          assignedClass = maLop;
          break;
        }
      }
      tr.querySelector('.assigned-class').textContent = assignedClass;
    });

    Swal.fire('Thành công!', `Đã phân bổ ${data.totalAssigned} học sinh. Nhấn Lưu để cập nhật CSDL.`, 'success');
  };

  const saveAssign = async () => {
    if (Object.keys(distribution).length === 0) return alert('Chưa phân bổ');

    const res = await fetch('/api/phanlophocsinh/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distribution })
    });
    const data = await res.json();

    Swal.fire('Thông báo', data.message, data.success ? 'success' : 'error');
    if (data.success) {
      distribution = {};
      loadData(); // Reload để thấy kết quả mới
    }
  };

  window.showClassStudents = async (maLop) => {
    const modal = document.getElementById('class-modal');
    const title = document.getElementById('class-modal-title');
    const body = document.getElementById('class-modal-body');
    title.textContent = maLop;
    body.innerHTML = 'Đang tải...';
    modal.style.display = 'block';

    const res = await fetch('/api/phanlophocsinh/class-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaLop: maLop })
    });
    const data = await res.json();

    if (!data.success || !data.students.length) {
      body.innerHTML = '<p style="color:orange">Chưa có học sinh</p>';
    } else {
      body.innerHTML = '<ul>' + data.students.map(s => 
        `<li>${s.MaHocSinh} - ${s.TenHocSinh}</li>`
      ).join('') + '</ul>';
    }
  };

  // Events
  loadBtn.onclick = loadData;
  autoBtn.onclick = autoAssign;
  saveBtn.onclick = saveAssign;
  khoiSelect.onchange = loadData;
  namHocSelect.onchange = loadData;

  // Load lần đầu
  loadData();
});