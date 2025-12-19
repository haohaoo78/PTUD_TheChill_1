(() => {
  const btnXem = document.getElementById('btn-xem');
  const namHocSelect = document.getElementById('namHoc');
  const hocKySelect = document.getElementById('hocKy');
  const resultSection = document.getElementById('result-section');
  const studentInfoSection = document.getElementById('student-info');
  const scoreBody = document.getElementById('score-body');
  const hocBaSection = document.getElementById('hocba-section'); // Giả sử có section mới cho học bạ

  btnXem.addEventListener('click', async () => {
    const namHoc = namHocSelect.value;
    const hocKy = hocKySelect.value;
    
    if (!namHoc || !hocKy) {
        alert('Vui lòng chọn học kỳ để xem điểm.');
        return;
    }

    try {
      const response = await fetch('/api/xemdiem/get-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ namHoc, hocKy })
      });

      const data = await response.json();

      if (data.success) {
        // Hiển thị thông tin học sinh
        if (data.student) {
          document.getElementById('info-name').textContent = data.student.HoTen;
          document.getElementById('info-id').textContent = data.student.MaHocSinh;
          document.getElementById('info-class').textContent = data.student.Lop || 'Chưa phân lớp';
          studentInfoSection.style.display = 'block';
        }

        // Hiển thị bảng điểm chi tiết
        scoreBody.innerHTML = '';
        if (data.scores && data.scores.length > 0) {
          data.scores.forEach(score => {
            const row = `
              <tr>
                <td>${score.TenMon}</td>
                <td>${score.TX1 || '-'}</td>
                <td>${score.TX2 || '-'}</td>
                <td>${score.TX3 || '-'}</td>
                <td>${score.D15_1 || '-'}</td>
                <td>${score.D15_2 || '-'}</td>
                <td>${score.GK || '-'}</td>
                <td>${score.CK || '-'}</td>
                <td><strong>${score.TB || '-'}</strong></td>
              </tr>
            `;
            scoreBody.innerHTML += row;
          });
          resultSection.style.display = 'block';
        } else {
          scoreBody.innerHTML = '<tr><td colspan="9">Không có dữ liệu điểm cho kỳ này</td></tr>'; // Cập nhật colspan cho 9 cột
          alert('Không có dữ liệu điểm cho kỳ này');
          resultSection.style.display = 'block';
        }

        // Hiển thị thông tin học bạ đầy đủ
        if (data.hocBa) {
          document.getElementById('hanh-kiem').textContent = data.hocBa.HanhKiem || 'Chưa xét';
          document.getElementById('hoc-luc').textContent = data.hocBa.HocLuc || 'Chưa xét';
          document.getElementById('diem-tong-ket').textContent = data.hocBa.DiemTongKet || '--'; // Thêm phần mới
          document.getElementById('nhan-xet').textContent = data.hocBa.NhanXet || 'Chưa có nhận xét'; // Thêm phần mới
          document.getElementById('ren-luyen').textContent = data.hocBa.RenLuyen || 'Chưa xét'; // Thêm phần mới
          hocBaSection.style.display = 'block'; // Hiển thị section học bạ
        } else {
          document.getElementById('hanh-kiem').textContent = '--';
          document.getElementById('hoc-luc').textContent = '--';
          document.getElementById('diem-tong-ket').textContent = '--';
          document.getElementById('nhan-xet').textContent = 'Chưa có nhận xét';
          document.getElementById('ren-luyen').textContent = '--';
          hocBaSection.style.display = 'block';
        }

      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối server');
    }
  });
})();