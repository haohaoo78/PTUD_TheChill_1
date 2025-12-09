document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-content');
  const cache = {};

  // Delegation: bắt click cho mọi a[data-page] (bao gồm link thêm sau)
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-page]');
    if (!a) return;

    e.preventDefault();
    const page = a.dataset.page;
    if (!page || !main) return;

    // nếu đang có cache thì dùng luôn
    if (cache[page]) {
      main.innerHTML = cache[page];
      activateInlineScripts(main);
      return;
    }

    // optional: disable link, show loading small UI
    a.dataset.disabled = '1';

    try {
      const res = await fetch(`/api/${page}/render`, { credentials: 'include' });
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        main.innerHTML = `<p style="color:red;">Lỗi khi tải ${page}: ${res.status} ${res.statusText}</p>`;
        console.error('Fetch error:', res.status, errText);
        return;
      }

      const html = await res.text();
      main.innerHTML = html;
      cache[page] = html;
      activateInlineScripts(main);
    } catch (err) {
      main.innerHTML = `<p style="color:red;">Không thể kết nối tới server.</p>`;
      console.error(err);
    } finally {
      delete a.dataset.disabled;
    }
  });

  // xử lý đăng ký / đăng nhập bằng delegation (giữ nguyên logic của bạn)
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

  // Helper: kích hoạt script nội tuyến và external (tránh load trùng)
  function activateInlineScripts(root) {
    root.querySelectorAll('script').forEach(s => {
      const src = s.src;
      if (src) {
        loadScriptOnce(src);
      } else {
        // inline script: tạo và chạy
        const n = document.createElement('script');
        n.textContent = s.textContent;
        document.body.appendChild(n);
      }
      s.remove();
    });
  }

  // Helper: load external script 1 lần
  function loadScriptOnce(src) {
    if (!src) return;
    if (document.querySelector(`script[src="${src}"]`)) return;
    const sc = document.createElement('script');
    sc.src = src;
    sc.defer = false; // set nếu cần
    document.body.appendChild(sc);
  }
});
