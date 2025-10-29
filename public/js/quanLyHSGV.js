// File: public/js/quanLyHSGV.js
$(document).ready(function () {
  let currentActiveTab = 'hocsinh';

  // ==========================
  // 🔹 Helper Functions
  // ==========================
  
  function showToast(message, type = 'success') {
    let toast = $('#toast-message');
    if (toast.length === 0) {
      toast = $('<div id="toast-message" class="toast"></div>');
      $('body').append(toast);
    }
    toast.removeClass('success error').addClass(type).text(message).fadeIn().delay(3000).fadeOut();
  }

  function switchTab(page) {
    $('.sidebar-nav li').removeClass('active');
    $(`.sidebar-nav li[data-page="${page}"]`).addClass('active');

    $('.tab-pane').hide();
    $(`#tab-${page}`).show();
    currentActiveTab = page;

    if (page === 'hocsinh') loadHocSinh();
    else if (page === 'giaovien') loadGiaoVien();
  }

  function toggleModal(type, isShow) {
    const modal = $(`#modal-${type}`);
    if (isShow) modal.fadeIn();
    else {
      modal.fadeOut();
      $(`#form-${type}`)[0].reset();
      $(`#form-${type}`).removeData('id');
      $(`#form-${type}-error`).text('');
    }
  }

  // ==========================
  // 🔹 Load Data Functions
  // ==========================

  function loadHocSinh() {
    $('#hs-table-wrap').html('<p class="loading">Đang tải danh sách học sinh...</p>');
    $.get('/api/quanlyHSGV/hocsinh', data => {
      let html = `<table class="table table-bordered">
        <tr><th>Mã HS</th><th>Họ tên</th><th>Email</th><th>SDT</th><th>Lớp</th><th>Thao tác</th></tr>`;
      data.forEach(hs => {
        html += `<tr data-id="${hs.MaHocSinh}">
          <td>${hs.MaHocSinh}</td>
          <td>${hs.HoTen}</td>
          <td>${hs.Email}</td>
          <td>${hs.SoDienThoai}</td>
          <td>${hs.MaLop || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-warning editHS" data-id="${hs.MaHocSinh}">Sửa</button>
            <button class="btn btn-sm btn-danger delHS" data-id="${hs.MaHocSinh}">Xóa</button>
          </td>
        </tr>`;
      });
      html += `</table>`;
      $('#hs-table-wrap').html(html);
    }).fail(() => {
      $('#hs-table-wrap').html('<p class="error">Lỗi khi tải danh sách học sinh.</p>');
    });
  }

  function loadGiaoVien() {
    $('#gv-table-wrap').html('<p class="loading">Đang tải danh sách giáo viên...</p>');
    $.get('/api/quanlyHSGV/giaovien', data => {
      let html = `<table class="table table-bordered">
        <tr><th>Mã GV</th><th>Họ tên</th><th>Email</th><th>SDT</th><th>Bộ môn</th><th>Thao tác</th></tr>`;
      data.forEach(gv => {
        html += `<tr data-id="${gv.MaGiaoVien}">
          <td>${gv.MaGiaoVien}</td>
          <td>${gv.HoTen}</td>
          <td>${gv.Email}</td>
          <td>${gv.SoDienThoai}</td>
          <td>${gv.MaMonHoc || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-warning editGV" data-id="${gv.MaGiaoVien}">Sửa</button>
            <button class="btn btn-sm btn-danger delGV" data-id="${gv.MaGiaoVien}">Xóa</button>
          </td>
        </tr>`;
      });
      html += `</table>`;
      $('#gv-table-wrap').html(html);
    }).fail(() => {
      $('#gv-table-wrap').html('<p class="error">Lỗi khi tải danh sách giáo viên.</p>');
    });
  }

  // ==========================
  // 🔹 Modal & Form Handlers
  // ==========================

  // Mở modal Thêm / Sửa Giáo viên
  $(document).on('click', '#btn-add-gv', function() {
    $('#modal-gv-title').text('Thêm giáo viên');
    toggleModal('gv', true);
  });

  $(document).on('click', '.editGV', function() {
    const row = $(this).closest('tr');
    const id = row.data('id');
    $('#modal-gv-title').text('Cập nhật thông tin giáo viên');
    const form = $('#form-gv').data('id', id);
    form.find('input[name="MaGiaoVien"]').val(id);
    form.find('input[name="HoTen"]').val(row.find('td:eq(1)').text());
    form.find('input[name="Email"]').val(row.find('td:eq(2)').text());
    form.find('input[name="SoDienThoai"]').val(row.find('td:eq(3)').text());
    form.find('input[name="MaMonHoc"]').val(row.find('td:eq(4)').text());
    toggleModal('gv', true);
  });

  // Mở modal Thêm / Sửa Học sinh
  $(document).on('click', '#btn-add-hs', function() {
    $('#modal-hs-title').text('Thêm học sinh');
    toggleModal('hs', true);
  });

  $(document).on('click', '.editHS', function() {
    const row = $(this).closest('tr');
    const id = row.data('id');
    $('#modal-hs-title').text('Cập nhật thông tin học sinh');
    const form = $('#form-hs').data('id', id);
    form.find('input[name="MaHocSinh"]').val(id);
    form.find('input[name="HoTen"]').val(row.find('td:eq(1)').text());
    form.find('input[name="Email"]').val(row.find('td:eq(2)').text());
    form.find('input[name="SoDienThoai"]').val(row.find('td:eq(3)').text());
    form.find('input[name="MaLop"]').val(row.find('td:eq(4)').text());
    toggleModal('hs', true);
  });

  // Hủy modal
  $(document).on('click', '#modal-gv-cancel', () => toggleModal('gv', false));
  $(document).on('click', '#modal-hs-cancel', () => toggleModal('hs', false));

  // ==========================
  // 🔹 Form Submit Handlers
  // ==========================

  async function handleFormSubmit(formType) {
    const form = $(`#form-${formType}`);
    const id = form.data('id');
    const isEdit = !!id;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/quanlyHSGV/${formType}/${id}` : `/api/quanlyHSGV/${formType}`;
    const errorMsg = $(`#form-${formType}-error`);
    errorMsg.text('');

    const formData = {};
    form.serializeArray().forEach(item => {
      if (item.name !== (formType === 'hs' ? 'MaHocSinh' : 'MaGiaoVien')) {
        formData[item.name] = item.value;
      }
    });

    // Client validation
    if (!formData.HoTen || !formData.NgaySinh || !formData.Email || !formData.SoDienThoai) {
      errorMsg.text('Thông tin không được để trống.');
      return;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.Email)) {
      errorMsg.text('Email không hợp lệ.');
      return;
    }
    if (!/^[0-9]{10,11}$/.test(formData.SoDienThoai)) {
      errorMsg.text('Số điện thoại không hợp lệ (10-11 số).');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        toggleModal(formType, false);
        if (formType === 'hs') loadHocSinh();
        else loadGiaoVien();
      } else {
        errorMsg.text('Lỗi: ' + data.message);
      }
    } catch (err) {
      errorMsg.text('❌ Lỗi server khi lưu thông tin.');
      console.error(err);
    }
  }

  $(document).on('submit', '#form-gv', e => { e.preventDefault(); handleFormSubmit('gv'); });
  $(document).on('submit', '#form-hs', e => { e.preventDefault(); handleFormSubmit('hs'); });

  // ==========================
  // 🔹 Delete Handlers
  // ==========================

  $(document).on('click', '.delHS', function() {
    const id = $(this).data('id');
    const name = $(this).closest('tr').find('td:eq(1)').text();
    if (confirm(`Bạn có chắc chắn muốn ẩn thông tin học sinh ${name} (Mã: ${id}) không?`)) {
      fetch(`/api/quanlyHSGV/hocsinh/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast(data.message, 'success');
            loadHocSinh();
          } else showToast(data.message, 'error');
        }).catch(err => { console.error(err); showToast('Lỗi server khi ẩn thông tin học sinh.', 'error'); });
    }
  });

  $(document).on('click', '.delGV', function() {
    const id = $(this).data('id');
    const name = $(this).closest('tr').find('td:eq(1)').text();
    if (confirm(`Bạn có chắc chắn muốn ẩn thông tin giáo viên ${name} (Mã: ${id}) không?`)) {
      fetch(`/api/quanlyHSGV/giaovien/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast(data.message, 'success');
            loadGiaoVien();
          } else showToast(data.message, 'error');
        }).catch(err => { console.error(err); showToast('Lỗi server khi ẩn thông tin giáo viên.', 'error'); });
    }
  });

  // ==========================
  // 🔹 Initialization
  // ==========================
  $('.sidebar-nav li').on('click', function () { switchTab($(this).data('page')); });
  loadHocSinh();
});
