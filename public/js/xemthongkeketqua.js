// public/js/xemthongkeketqua.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('thongkeForm');
    const loader = document.getElementById('loader');
    
    // QUAN TRỌNG: Thay vào #main-content (chỉ phần nội dung chính)
    const mainContent = document.getElementById('main-content');

    if (!form || !mainContent) {
        console.warn('Không tìm thấy form hoặc main-content');
        return;
    }

    const loadThongKe = async (formData = null) => {
        try {
            if (loader) loader.style.display = 'block';

            const options = {
                method: formData ? 'POST' : 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            if (formData) {
                options.body = formData;
            }

            const response = await fetch('/api/xemthongkeketqua/render', options);
            if (!response.ok) {
                throw new Error('Lỗi server: ' + response.status);
            }

            const html = await response.text();

            // Chỉ thay nội dung trong #main-content → giữ nguyên header, sidebar, footer
            mainContent.innerHTML = html;

            // Tải lại Chart.js và chạy script biểu đồ
            const oldChart = document.querySelector('script[src*="chart.js"]');
            if (oldChart) oldChart.remove();

            const chartScript = document.createElement('script');
            chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            chartScript.onload = () => {
                const inlineScript = mainContent.querySelector('script:not([src])');
                if (inlineScript) {
                    new Function(inlineScript.textContent)();
                }
            };
            document.head.appendChild(chartScript);

        } catch (err) {
            console.error('Lỗi tải thống kê:', err);
            mainContent.innerHTML = '<p style="color:red; text-align:center; margin:40px;">Lỗi tải dữ liệu. Vui lòng thử lại!</p>';
        } finally {
            if (loader) loader.style.display = 'none';
        }
    };

    // Khi submit form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        loadThongKe(formData);
    });

    // Nút Hủy → reload form sạch
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadThongKe(); // GET request → form rỗng
        });
    }
});