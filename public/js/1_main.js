document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-content');
  const cache = {};

  // ==========================
  // 🟤 XỬ LÝ LOAD TRANG TỪ SIDEBAR
  // ==========================
  document.querySelectorAll('.sidebar a[data-page]').forEach(link => {
    link.addEventListener('click', async e => {
      e.preventDefault();
      const page = link.dataset.page;
      if (!page || !main) return;

      try {
        let html;
        if (cache[page]) {
          html = cache[page];
        } else {
          const res = await fetch(`/api/${page}/render`);
          html = await res.text();
          cache[page] = html;
        }

        main.innerHTML = html;

        // Luôn kích hoạt script trong HTML (cả khi dùng cache)
        main.querySelectorAll('script').forEach(s => {
          const n = document.createElement('script');
          if (s.src) n.src = s.src;
          else n.textContent = s.textContent;
          document.body.appendChild(n);
          s.remove();
        });

      } catch (err) {
        main.innerHTML = `<p style="color:red;">Không tải được ${page}</p>`;
        console.error(err);
      }
    });
  });

  // ==========================
  // 🟤 XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ
  // ==========================
  document.addEventListener("click", async (e) => {
    // Khi click “Đăng ký”
    if (e.target && e.target.id === "btn-dangky") {
      e.preventDefault();
      try {
        let html;
        if (cache['dangky']) {
          html = cache['dangky'];
        } else {
          const res = await fetch("/api/dangky/render");
          html = await res.text();
          cache['dangky'] = html;
        }
        main.innerHTML = html;

        // Nạp lại script trang đăng ký
        const script = document.createElement("script");
        script.src = "/js/DangKy.js";
        document.body.appendChild(script);
      } catch (err) {
        console.error("❌ Lỗi khi tải trang đăng ký:", err);
      }
    }

    // Khi click “Quay lại đăng nhập”
    if (e.target && e.target.id === "btn-dangnhap") {
      e.preventDefault();
      try {
        let html;
        if (cache['dangnhap']) {
          html = cache['dangnhap'];
        } else {
          const res = await fetch("/api/dangnhap/render");
          html = await res.text();
          cache['dangnhap'] = html;
        }
        main.innerHTML = html;

        // Nạp lại script trang đăng nhập
        const script = document.createElement("script");
        script.src = "/js/DangNhap.js";
        document.body.appendChild(script);
      } catch (err) {
        console.error("❌ Lỗi khi tải trang đăng nhập:", err);
      }
    }
  });

  // ==========================
  // 🟤 XỬ LÝ ĐĂNG XUẤT
  // ==========================
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Chỉ cần redirect về route logout trên server
      window.location.href = '/logout';
    });
  }
});
