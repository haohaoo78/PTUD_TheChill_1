(() => {
  const btnXem = document.getElementById('btn-xem');
  const namHocSelect = document.getElementById('namHoc');
  const hocKySelect = document.getElementById('hocKy');
  const resultSection = document.getElementById('result-section');
  const studentInfoSection = document.getElementById('student-info');
  const scoreBody = document.getElementById('score-body');

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
        // Hien thi thong tin hoc sinh
        if (data.student) {
          document.getElementById('info-name').textContent = data.student.HoTen;
          document.getElementById('info-id').textContent = data.student.MaHocSinh;
          document.getElementById('info-class').textContent = data.student.Lop || 'Chưa phân lớp';
          studentInfoSection.style.display = 'block';
        }

        // Hien thi bang diem
        scoreBody.innerHTML = '';
        if (data.scores && data.scores.length > 0) {
          data.scores.forEach(score => {
            const row = `
              <tr>
                <td>${score.TenMon}</td>
                <td>${score.DiemMieng || '-'}</td>
                <td>${score.Diem15P || '-'}</td>
                <td>${score.Diem1Tiet || '-'}</td>
                <td>${score.DiemThi || '-'}</td>
                <td><strong>${score.DTB || '-'}</strong></td>
              </tr>
            `;
            scoreBody.innerHTML += row;
          });
          resultSection.style.display = 'block';
        } else {
          scoreBody.innerHTML = '<tr><td colspan="6">Không có dữ liệu điểm cho kỳ này</td></tr>';
          alert('Không có dữ liệu điểm cho kỳ này');
          resultSection.style.display = 'block'; // Still show table with empty message
        }

        // Hien thi tong ket
        if (data.summary) {
          document.getElementById('hanh-kiem').textContent = data.summary.HanhKiem || 'Chưa xét';
          document.getElementById('hoc-luc').textContent = data.summary.HocLuc || 'Chưa xét';
        } else {
          document.getElementById('hanh-kiem').textContent = '--';
          document.getElementById('hoc-luc').textContent = '--';
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
