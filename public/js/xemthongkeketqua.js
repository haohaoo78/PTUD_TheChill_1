// public/js/xemthongkeketqua.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('thongkeForm');
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');

    if (!form || !mainContent) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        try {
            if (loader) loader.style.display = 'block';

            const response = await fetch('/api/xemthongkeketqua/render', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error('Lỗi server');

            const html = await response.text();
            mainContent.innerHTML = html;

            // Reload Chart.js
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
            console.error('Lỗi:', err);
            mainContent.innerHTML += '<p style="color:red;">Lỗi tải dữ liệu thống kê</p>';
        } finally {
            if (loader) loader.style.display = 'none';
        }
    });

    // Nút Hủy
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const response = await fetch('/api/xemthongkeketqua/render', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const html = await response.text();
            mainContent.innerHTML = html;
        });
    }
});