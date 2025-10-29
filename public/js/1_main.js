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

      // Nếu đã cache trang => dùng lại
      if (cache[page]) {
        main.innerHTML = cache[page];
        return;
      }

      try {
        const res = await fetch(`/api/${page}/render`);
        const html = await res.text();
        main.innerHTML = html;
        cache[page] = html;

        // Kích hoạt script trong nội dung (nếu có)
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
        const res = await fetch("/api/dangky/render");
        const html = await res.text();
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
        const res = await fetch("/api/dangnhap/render");
        const html = await res.text();
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
});
