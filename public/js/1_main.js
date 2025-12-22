// public/js/spa.js - Giữ nguyên logic cũ, chỉ thêm reload script để tránh mất event

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-content');
  const cache = {};

  // Delegation: bắt click cho mọi a[data-page]
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-page]');
    if (!a) return;

    e.preventDefault();
    const page = a.dataset.page;
    if (!page || !main) return;

    a.dataset.disabled = '1';

    try {
      let html;

      if (cache[page]) {
        html = cache[page];
      } else {
        const res = await fetch(`/api/${page}/render`, { credentials: 'include' });
        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          main.innerHTML = `<p style="color:red;">Lỗi khi tải ${page}: ${res.status} ${res.statusText}</p>`;
          console.error('Fetch error:', res.status, errText);
          return;
        }
        html = await res.text();
        cache[page] = html;
      }

      main.innerHTML = html;

      // === THÊM: Load lại tất cả script để chạy lại logic trang (fix mất event khi chuyển trang) ===
      main.querySelectorAll('script[src]').forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.src = oldScript.src + '?_=' + Date.now(); // Buộc load lại
        newScript.defer = false;
        newScript.onload = () => oldScript.remove();
        document.head.appendChild(newScript);
        oldScript.remove();
      });

      main.querySelectorAll('script:not([src])').forEach(oldInline => {
        const newInline = document.createElement('script');
        newInline.textContent = oldInline.textContent;
        document.body.appendChild(newInline);
        newInline.remove();
        oldInline.remove();
      });

      // Highlight menu active
      document.querySelectorAll('.sidebar-nav a[data-page]').forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
      if (active) active.classList.add('active');

      // Cập nhật URL đẹp
      const newUrl = page === 'home' ? '/' : `/${page}`;
      if (window.location.pathname !== newUrl) {
        history.pushState({ page }, '', newUrl);
      }

    } catch (err) {
      main.innerHTML = `<p style="color:red;">Không thể kết nối tới server.</p>`;
      console.error(err);
    } finally {
      delete a.dataset.disabled;
    }
  });

  // Xử lý đăng ký / đăng nhập (giữ nguyên)
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === "btn-dangky") {
      e.preventDefault();
      try {
        const res = await fetch("/api/dangky/render", { credentials: 'include' });
        if (!res.ok) throw new Error('Không tải được trang đăng ký');
        const html = await res.text();
        main.innerHTML = html;
        loadScriptOnce('/js/DangKy.js');
      } catch (err) { console.error(err); }
    }
    if (e.target && e.target.id === "btn-dangnhap") {
      e.preventDefault();
      try {
        const res = await fetch("/api/dangnhap/render", { credentials: 'include' });
        if (!res.ok) throw new Error('Không tải được trang đăng nhập');
        const html = await res.text();
        main.innerHTML = html;
        loadScriptOnce('/js/DangNhap.js');
      } catch (err) { console.error(err); }
    }
  });

  // Helper: load external script 1 lần (giữ nguyên)
  function loadScriptOnce(src) {
    if (!src) return;
    if (document.querySelector(`script[src="${src}"]`)) return;
    const sc = document.createElement('script');
    sc.src = src;
    sc.defer = false;
    document.body.appendChild(sc);
  }

  // Back/Forward
  window.addEventListener('popstate', e => {
    const page = e.state?.page || 'home';
    // Trigger click giả để dùng logic cũ
    const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
    if (link) link.click();
  });

  // Load trang đầu tiên khi mở hoặc F5
  let initialPage = window.location.pathname.slice(1);
  if (!initialPage || initialPage === '/') initialPage = 'home';

  const initialLink = document.querySelector(`.sidebar-nav a[data-page="${initialPage}"]`);
  if (initialLink) initialLink.click();
});