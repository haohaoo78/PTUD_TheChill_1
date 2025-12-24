(function() {
    // --- KHAI BÁO BIẾN & ELEMENT ---
    const tkbBody = document.getElementById('tkb-body');
    const studentInfo = document.getElementById('student-info');
    const weekDisplayText = document.getElementById('week-display-text');
    
    // Các nút điều hướng
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnToday = document.getElementById('btn-today');

    // Biến lưu trữ ngày đang xem (Mặc định là hôm nay)
    let currentViewDate = new Date();

    // --- HÀM 1: KHỞI TẠO BẢNG TRỐNG (10 TIẾT) ---
    function initTable() {
        tkbBody.innerHTML = ''; // Xóa nội dung cũ
        for (let i = 1; i <= 10; i++) {
            // Thêm dòng nghỉ trưa sau tiết 5
            if (i === 6) {
                const breakRow = document.createElement('tr');
                breakRow.className = 'break-row';
                breakRow.innerHTML = `<td colspan="8">NGHỈ TRƯA</td>`;
                tkbBody.appendChild(breakRow);
            }

            const tr = document.createElement('tr');
            // Cột đầu tiên là số Tiết
            let html = `<td><strong>Tiết ${i}</strong></td>`;
            
            // Tạo các ô trống cho Thứ 2 -> CN (ID: cell-2-1, cell-3-1...)
            for (let day = 2; day <= 8; day++) {
                html += `<td id="cell-${day}-${i}"></td>`;
            }
            tr.innerHTML = html;
            tkbBody.appendChild(tr);
        }
    }

    // --- HÀM 2: FORMAT NGÀY (DD/MM/YYYY) CHO HIỂN THỊ TEXT ---
    function formatDateVN(dateString) {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }

    // --- HÀM 3: CẬP NHẬT NGÀY LÊN HEADER CỘT (Thứ 2 22/12...) ---
    function updateTableHeaderDates(startDateStr) {
        if (!startDateStr) return;

        // startDateStr dạng "YYYY-MM-DD"
        const [year, month, day] = startDateStr.split('-').map(Number);
        
        // Tạo Date object (tháng bắt đầu từ 0)
        let currentLoopDate = new Date(year, month - 1, day);

        // Duyệt từ Thứ 2 (index=2) đến CN (index=8)
        for (let i = 2; i <= 8; i++) {
            const spanId = `th-date-${i}`;
            const spanElement = document.getElementById(spanId);

            if (spanElement) {
                // Format thành "dd/mm"
                const d = String(currentLoopDate.getDate()).padStart(2, '0');
                const m = String(currentLoopDate.getMonth() + 1).padStart(2, '0');
                
                spanElement.textContent = `${d}/${m}`;
            }

            // Tăng ngày lên 1
            currentLoopDate.setDate(currentLoopDate.getDate() + 1);
        }
    }

    // --- HÀM 4: GỌI API & LOAD DỮ LIỆU ---
    async function loadSchedule(dateObj) {
        try {
            // Chuẩn bị ngày gửi lên server (YYYY-MM-DD)
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Gọi API
            const res = await fetch(`/api/xemthoikhoabieu/data?date=${dateStr}`);
            const result = await res.json();

            // Xử lý lỗi từ server
            if (!result.success) {
                studentInfo.innerHTML = `<span style="color:red">${result.message}</span>`;
                weekDisplayText.textContent = "Không có dữ liệu";
                tkbBody.innerHTML = '';
                return;
            }

            // 1. Hiển thị thông tin chung
            studentInfo.textContent = `Học sinh: ${result.info.tenHS} - Lớp: ${result.info.maLop}`;
            
            // 2. Hiển thị khoảng thời gian tuần
            const startVN = formatDateVN(result.info.weekStart);
            const endVN = formatDateVN(result.info.weekEnd);
            weekDisplayText.textContent = `Tuần: ${startVN} - ${endVN}`;

            // 3. Cập nhật ngày vào Header các cột
            updateTableHeaderDates(result.info.weekStart);

            // 4. Vẽ lại bảng & Điền dữ liệu môn học
            initTable();
            const schedule = result.data;

            schedule.forEach(item => {
                // Xử lý thứ (CN/Chủ Nhật -> 8)
                let dayIndex = item.Thu;
                if (dayIndex === 'CN' || dayIndex === 'Chủ Nhật') dayIndex = 8;

                const cellId = `cell-${dayIndex}-${item.TietHoc}`;
                const cell = document.getElementById(cellId);

                if (cell) {
                    // Nếu ô đã có nội dung (trùng lịch), nối thêm vào
                    const currentContent = cell.innerHTML;
                    const newContent = `
                        <div class="tkb-cell-content">
                            <span class="subject-name">${item.TenMonHoc}</span>
                            <span class="teacher-name">${item.TenGiaoVien || ''}</span>
                        </div>
                    `;
                    cell.innerHTML = currentContent + newContent;
                }
            });

        } catch (err) {
            console.error("Lỗi fetch API:", err);
            studentInfo.textContent = "Lỗi kết nối server. Vui lòng thử lại.";
        }
    }

    // --- XỬ LÝ SỰ KIỆN CLICK NÚT ---

    // Nút Tuần Trước
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            currentViewDate.setDate(currentViewDate.getDate() - 7);
            loadSchedule(currentViewDate);
        });
    }

    // Nút Tuần Sau
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            currentViewDate.setDate(currentViewDate.getDate() + 7);
            loadSchedule(currentViewDate);
        });
    }

    // Nút Về Tuần Hiện Tại
    if (btnToday) {
        btnToday.addEventListener('click', () => {
            currentViewDate = new Date(); // Reset về ngày thực tế
            loadSchedule(currentViewDate);
        });
    }

    // --- CHẠY LẦN ĐẦU KHI LOAD TRANG ---
    initTable();
    loadSchedule(currentViewDate);

})();