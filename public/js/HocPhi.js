(() => {
  const btnXem = document.getElementById('btn-xem');
  const btnPay = document.getElementById('btn-pay');
  const tuitionInfo = document.getElementById('tuition-info');
  const noData = document.getElementById('no-data');
  const paymentDetails = document.getElementById('payment-details');
  const totalAmountEl = document.getElementById('total-amount');
  const feeAmountDisplay = document.getElementById('fee-amount-display');
  const paymentMethodSelect = document.getElementById('payment-method');

  let currentMaHocPhi = null;
  let currentAmount = 0;

  btnXem.addEventListener('click', async () => {
    const namHoc = document.getElementById('namHoc').value;
    const hocKy = document.getElementById('hocKy').value;

    try {
      const res = await fetch('/api/hocphi/get-tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namHoc, hocKy })
      });
      const data = await res.json();

      if (data.success && data.tuition) {
        const t = data.tuition;
        currentMaHocPhi = t.MaHocPhi;
        currentAmount = t.SoTien;
        
        document.getElementById('hp-id').textContent = t.MaHocPhi;
        document.getElementById('hp-amount').textContent = new Intl.NumberFormat('vi-VN').format(t.SoTien);
        document.getElementById('hp-deadline').textContent = t.HanDong ? new Date(t.HanDong).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
        
        const statusEl = document.getElementById('hp-status');
        if (t.TrangThai === 'Đã đóng' || t.TrangThai === 'DaDong') {
          statusEl.textContent = 'Đã thanh toán';
          statusEl.className = 'status-badge status-paid';
          paymentDetails.style.display = 'none';
        } else {
          statusEl.textContent = 'Chưa thanh toán';
          statusEl.className = 'status-badge status-unpaid';
          
          // Show payment details
          feeAmountDisplay.textContent = new Intl.NumberFormat('vi-VN').format(t.SoTien);
          totalAmountEl.textContent = new Intl.NumberFormat('vi-VN').format(t.SoTien);
          paymentDetails.style.display = 'block';
        }

        tuitionInfo.style.display = 'block';
        noData.style.display = 'none';
      } else {
        tuitionInfo.style.display = 'none';
        noData.style.display = 'block';
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
    }
  });

  btnPay.addEventListener('click', async () => {
    // if (!currentMaHocPhi) return; // Removed check for MaHocPhi as we use composite key
    
    const method = paymentMethodSelect.value;
    const namHoc = document.getElementById('namHoc').value;
    const hocKy = document.getElementById('hocKy').value;

    if (!currentAmount || currentAmount <= 0) {
        alert('Số tiền không hợp lệ');
        return;
    }

    if (!method) {
        alert('Vui lòng chọn phương thức thanh toán');
        return;
    }

    if (!confirm(`Xác nhận thanh toán ${new Intl.NumberFormat('vi-VN').format(currentAmount)} VND qua ${method}?`)) return;

    try {
      const res = await fetch('/api/hocphi/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            maHocPhi: currentMaHocPhi,
            namHoc: namHoc,
            hocKy: hocKy,
            phuongThuc: method,
            soTien: currentAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            alert('Thanh toán thành công!');
            btnXem.click(); // Reload data
        }
      } else {
        alert(data.message || 'Thanh toán thất bại do lỗi hệ thống');
      }
    } catch (err) {
      console.error(err);
      alert('Thanh toán thất bại do lỗi hệ thống');
    }
  });
})();
