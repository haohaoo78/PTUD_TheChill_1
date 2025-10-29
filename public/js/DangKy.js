document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  const popup = document.getElementById("success-popup");
  const confirmBtn = document.getElementById("confirm-btn");
  const phoneInput = document.getElementById("phone");

  // Giới hạn nhập số điện thoại
  phoneInput.addEventListener("input", function() {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Xử lý submit form
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // Gửi dữ liệu đăng ký lên server
      const response = await fetch("/DangKy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        popup.style.display = "flex";
      } else {
        alert(result.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi máy chủ!");
    }
  });

  confirmBtn.addEventListener("click", () => {
    popup.style.display = "none";
    window.location.href = "/";
  });
});
