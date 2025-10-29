// public/js/nhapchitieutuyensinh.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('JS loaded for nhapchitieutuyensinh');
  const form = document.getElementById('chitieuForm');
  if (!form) {
    console.error('Form not found!');
    return;
  }

  let editId = null;

  form.addEventListener('submit', async (e) => {
    console.log('JS submit intercepted');
    e.preventDefault();
    const formData = new FormData(form);
    const method = document.getElementById('methodInput').value;
    const url = method === 'PUT' ? `/api/nhapchitieutuyensinh/update/${editId}` : '/api/nhapchitieutuyensinh/create';
    
    // Chuyển FormData sang URLSearchParams để urlencoded (khớp bodyParser.urlencoded)
    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
      params.append(key, value);
    }
    const body = params.toString();
    
    console.log('Submit - Method:', method, 'URL:', url, 'Body:', body); // Debug body
    
    try {
      const res = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });
      console.log('Response status:', res.status, 'Redirected:', res.redirected, 'URL:', res.url);
      
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        console.log('JSON response:', data);
        if (data.success) {
          window.location.href = `/api/nhapchitieutuyensinh?success=${encodeURIComponent(data.message)}`;
        } else {
          alert(data.message || 'Lỗi không xác định');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Lỗi hệ thống: ' + err.message);
    }
  });

  window.editChitieu = async function(chitieuId) {
    console.log('Edit clicked - ID:', chitieuId);
    try {
      const res = await fetch(`/api/nhapchitieutuyensinh/${chitieuId}`);
      const result = await res.json();
      console.log('Edit data:', result);
      if (!result.success) {
        return alert(result.message || 'Lỗi load data');
      }
      
      // Populate form
      document.querySelector('select[name="nam_thi"]').value = result.data.NamThi || '';
      document.querySelector('select[name="ma_truong"]').value = result.data.MaTruong || '';
      document.querySelector('input[name="so_luong_ct"]').value = result.data.SoLuongCT || '';
      
      // Check populate
      const soLuong = document.querySelector('input[name="so_luong_ct"]').value;
      if (!soLuong || parseInt(soLuong) < 1) {
        alert('Dữ liệu số lượng không hợp lệ, thử load lại!');
        return;
      }
      
      // Switch mode
      editId = chitieuId;
      document.getElementById('methodInput').value = 'PUT';
      document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save me-1"></i>Cập Nhật';
      console.log('Switched to edit mode - ID:', editId);
    } catch (err) {
      console.error('Edit error:', err);
      alert('Lỗi load dữ liệu: ' + err.message);
    }
  };

  window.deleteChitieu = async function(chitieuId) {
    console.log('Delete clicked - ID:', chitieuId);
    if (!confirm('Xác nhận xóa chỉ tiêu này?')) return;
    try {
      const res = await fetch(`/api/nhapchitieutuyensinh/delete/${chitieuId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const result = await res.json();
      console.log('Delete result:', result);
      if (result.success) {
        location.reload();
      } else {
        alert(result.message || 'Lỗi xóa');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Lỗi xóa: ' + err.message);
    }
  };

  // Reset form
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('success') || urlParams.has('error')) {
    console.log('Reset form due to query params');
    form.reset();
    editId = null;
    document.getElementById('methodInput').value = 'POST';
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save me-1"></i>Thêm';
  }
});