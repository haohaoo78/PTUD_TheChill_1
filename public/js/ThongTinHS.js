(() => {
  const form = document.getElementById('form-thongtin');
  const btnEdit = document.getElementById('btn-edit');
  const btnConfirm = document.getElementById('btn-confirm');
  const btnSave = document.getElementById('btn-save');
  const btnCancel = document.getElementById('btn-cancel');
  
  const editableFields = ['ngaySinh', 'gioiTinh', 'tenPhuHuynh', 'email'];

  loadInfo();

  async function loadInfo() {
    try {
      const res = await fetch('/api/thongtinhs/get-info', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.info) {
        const i = data.info;
        document.getElementById('maHS').value = i.MaHocSinh;
        document.getElementById('hoTen').value = i.TenHocSinh; // Was HoTen
        document.getElementById('ngaySinh').value = i.Birthday ? i.Birthday.split('T')[0] : ''; // Was NgaySinh
        document.getElementById('gioiTinh').value = i.GioiTinh;
        document.getElementById('tenPhuHuynh').value = i.TenPhuHuynh || '';
        document.getElementById('sdt').value = i.SDT || '';
        document.getElementById('email').value = i.Email || '';
      }
    } catch (err) {
      console.error(err);
    }
  }

  function toggleEditMode(isEdit) {
    editableFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !isEdit;
    });
    
    if (isEdit) {
      if (btnEdit) btnEdit.style.display = 'none';
      if (btnConfirm) btnConfirm.style.display = 'none';
      if (btnSave) btnSave.style.display = 'inline-block';
      if (btnCancel) btnCancel.style.display = 'inline-block';
    } else {
      if (btnEdit) btnEdit.style.display = 'inline-block';
      if (btnConfirm) btnConfirm.style.display = 'inline-block';
      if (btnSave) btnSave.style.display = 'none';
      if (btnCancel) btnCancel.style.display = 'none';
    }
  }

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      toggleEditMode(true);
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      toggleEditMode(false);
      loadInfo(); // Revert changes
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      alert('Cảm ơn bạn đã xác nhận thông tin là chính xác.');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        NgaySinh: document.getElementById('ngaySinh').value,
        GioiTinh: document.getElementById('gioiTinh').value,
        TenPhuHuynh: document.getElementById('tenPhuHuynh').value,
        Email: document.getElementById('email').value
      };

      try {
        const res = await fetch('/api/thongtinhs/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
          alert(result.message);
          toggleEditMode(false);
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối');
      }
    });
  }
})();
