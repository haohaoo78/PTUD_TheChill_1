// public/js/xembaitap.js
(function () {
  if (window.xemBaiTapInitialized) return;
  window.xemBaiTapInitialized = true;

  console.log('xembaitap.js loaded');

  const assignments = document.querySelectorAll('.assignment');
  const modal = document.getElementById("assignmentModal");

  if (!modal) {
    console.warn('Không tìm thấy modal #assignmentModal');
    return;
  }

  let currentStatus = 'all';
  let currentSubject = 'all';

  // === LỌC THEO TRẠNG THÁI ===
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener("click", function () {
      currentStatus = this.getAttribute("data-filter");
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      applyFilters();
    });
  });

  // === LỌC THEO MÔN ===
  const subjectSelect = document.getElementById("subjectSelect");
  if (subjectSelect) {
    subjectSelect.addEventListener("change", function () {
      currentSubject = this.value;
      applyFilters();
    });
  }

  function applyFilters() {
    assignments.forEach(item => {
      const isEmpty = item.classList.contains("empty-assignment");
      const isExpired = item.classList.contains("expired");
      const itemSubject = item.getAttribute("data-subject") || 'all';

      let matchStatus = true;
      if (currentStatus === "active") matchStatus = !isEmpty && !isExpired;
      else if (currentStatus === "expired") matchStatus = isExpired;
      else if (currentStatus === "pending") matchStatus = isEmpty;

      const matchSubject = (currentSubject === "all") || (itemSubject === currentSubject);

      item.style.display = (matchStatus && matchSubject) ? "block" : "none";
    });
  }

  // === MỞ MODAL ===
  assignments.forEach(item => {
    item.addEventListener("click", function () {
      if (this.classList.contains("empty-assignment")) return;

      const subject = this.querySelector(".subject")?.textContent.trim() || '';
      const title = this.querySelector("h4")?.textContent.trim() || 'Không có tiêu đề';
      const gvLine = this.querySelector(".time > div:first-child")?.textContent.trim() || "";
      const dueLine = this.querySelector(".time > div:last-child")?.textContent.trim() || "";
      const descHTML = this.querySelector(".description")?.innerHTML || "Không có nội dung";

      const teacher = gvLine.replace("GV:", "").trim();
      const dueDate = dueLine.replace("Hạn nộp:", "").trim();

      document.getElementById("m_subject").textContent = subject;
      document.getElementById("m_title").textContent = title;
      document.getElementById("m_description").innerHTML = descHTML;

      modal.style.display = "flex";
    });
  });

  // === ĐÓNG MODAL ===
  document.querySelectorAll(".close-btn, .close-modal-btn").forEach(btn => {
    btn.onclick = () => modal.style.display = "none";
  });

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  // Chạy lọc lần đầu
  applyFilters();
})();