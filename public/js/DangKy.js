document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  const popup = document.getElementById("success-popup");
  const confirmBtn = document.getElementById("confirm-btn");
  const phoneInput = document.getElementById("phone");
  const fullNameInput = document.getElementById("fullName");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const studentIdInput = document.getElementById("studentId");

  const childInfoBox = document.getElementById("child-info-box");
  const childName = document.getElementById("child-name");
  const childClass = document.getElementById("child-class");
  const childId = document.getElementById("child-id");
  const errorMsg = document.getElementById("student-error");

  let isVerified = false;
  let verifiedStudentId = "";

  // Tự bôi đen khi click vào ô mã
  studentIdInput.addEventListener("focus", function () {
    this.select();
  });

  // Uppercase mã học sinh
  studentIdInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    const currentId = this.value.trim();
    if (currentId !== verifiedStudentId) {
      childInfoBox.style.display = "none";
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
      isVerified = false;
      verifiedStudentId = "";
      this.style.borderColor = "";
    }
  });

  // Chỉ số điện thoại
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Verify mã học sinh
  studentIdInput.addEventListener("input", function () {
    const studentId = this.value.trim();
    if (studentId.length < 3) return;

    clearTimeout(window.verifyTimeout);
    window.verifyTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/student-info?studentId=${encodeURIComponent(studentId)}`);
        const result = await response.json();

        if (result.success) {
          verifiedStudentId = studentId;
          childId.textContent = studentId;
          childName.textContent = result.data.name;
          childClass.textContent = result.data.class || "Chưa phân lớp";
          childInfoBox.style.display = "block";
          errorMsg.style.display = "none";
          studentIdInput.style.borderColor = "#4caf50";
          isVerified = true;

          if (!fullNameInput.value.trim()) {
            fullNameInput.value = `Phụ huynh của ${result.data.name}`;
          }
        } else {
          childInfoBox.style.display = "none";
          errorMsg.textContent = "✗ " + (result.message || "Mã không tồn tại hoặc đã được đăng ký");
          errorMsg.style.display = "block";
          studentIdInput.style.borderColor = "#d32f2f";
          isVerified = false;
          verifiedStudentId = "";
        }
      } catch (err) {
        childInfoBox.style.display = "none";
        errorMsg.textContent = "✗ Lỗi kết nối";
        errorMsg.style.display = "block";
        isVerified = false;
      }
    }, 700);
  });

  // Submit - Validate đầy đủ
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Họ và tên
    const fullName = fullNameInput.value.trim();
    if (!fullName) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      fullNameInput.focus();
      return;
    }

    // Họ tên chỉ chứa chữ cái, khoảng trắng, dấu tiếng Việt
    const nameRegex = /^[\p{L}\s]+$/u;

    if (!nameRegex.test(fullName)) {
      alert("Họ và tên không được chứa số!");
      fullNameInput.focus();
      return;
    }

    // Mật khẩu
    if (!passwordInput.value) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      passwordInput.focus();
      return;
    }

    // Xác nhận mật khẩu
    if (!confirmPasswordInput.value) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      confirmPasswordInput.focus();
      return;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      alert("Mật khẩu và xác nhận mật khẩu không khớp!");
      confirmPasswordInput.focus();
      return;
    }

    // Số điện thoại
    if (!phoneInput.value) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      phoneInput.focus();
      return;
    }

    if (phoneInput.value.length < 10 || phoneInput.value.length > 11) {
      alert("Số điện thoại phải đúng 10-11 chữ số!");
      phoneInput.focus();
      return;
    }

    // Verify mã học sinh
    if (!isVerified || studentIdInput.value.trim() !== verifiedStudentId) {
      alert("Vui lòng nhập đầy đủ thông tin và xác minh mã học sinh của con!");
      studentIdInput.focus();
      return;
    }

    // Đủ hết → gửi
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
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
      alert("Lỗi hệ thống!");
    }
  });

  confirmBtn.addEventListener("click", () => {
    popup.style.display = "none";
    window.location.href = "/";
  });
});