document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  const popup = document.getElementById("success-popup");
  const confirmBtn = document.getElementById("confirm-btn");
  const errorDiv = document.getElementById("error-message");
  const phoneInput = document.getElementById("phone");

  const schoolSelect = document.getElementById("school");
  const classSelect = document.getElementById("class");
  const studentSelect = document.getElementById("student");

  // Chỉ cho nhập số
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
  });

  // Chọn trường → load lớp
  schoolSelect.addEventListener("change", async () => {
    const schoolId = schoolSelect.value;
    classSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';
    studentSelect.innerHTML = '<option value="">-- Chọn học sinh --</option>';
    classSelect.disabled = true;
    studentSelect.disabled = true;

    if (!schoolId) return;

    try {
      const res = await fetch(`/api/classes?schoolId=${schoolId}`);
      const classes = await res.json();
      classes.forEach(c => {
        classSelect.appendChild(new Option(c.TenLop, c.MaLop));
      });
      classSelect.disabled = false;
    } catch (err) {
      console.error("Lỗi load lớp:", err);
    }
  });

  // Chọn lớp → load học sinh
  classSelect.addEventListener("change", async () => {
    const classId = classSelect.value;
    studentSelect.innerHTML = '<option value="">-- Chọn học sinh --</option>';
    studentSelect.disabled = true;

    if (!classId) return;

    try {
      const res = await fetch(`/api/students?classId=${classId}`);
      const students = await res.json();
      students.forEach(s => {
        const text = `${s.HoTen} (${s.MaHocSinh})`;
        studentSelect.appendChild(new Option(text, s.MaHocSinh));
      });
      studentSelect.disabled = false;
    } catch (err) {
      console.error("Lỗi load học sinh:", err);
    }
  });

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.style.display = "none";

    if (!studentSelect.value) {
      errorDiv.textContent = "Vui lòng chọn học sinh!";
      errorDiv.style.display = "block";
      return;
    }

    const data = {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value,
      studentId: studentSelect.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value
    };

    try {
      const res = await fetch("/dangky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (result.success) {
        popup.style.display = "flex";
      } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = "block";
      }
    } catch (err) {
      errorDiv.textContent = "Lỗi kết nối, vui lòng thử lại!";
      errorDiv.style.display = "block";
    }
  });

  confirmBtn.addEventListener("click", () => {
    window.location.href = "/";
  });
});