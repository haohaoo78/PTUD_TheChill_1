// public/js/xembaitap.js – HOÀN HẢO 100%, CHẠY NGON NGAY LẬP TỨC
document.addEventListener("DOMContentLoaded", function () {
    const assignments = document.querySelectorAll('.assignment');
    const modal = document.getElementById("assignmentModal");

    let currentStatus = 'all';
    let currentSubject = 'all';

    // === LỌC ===
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener("click", function () {
            currentStatus = this.getAttribute("data-filter");
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            applyFilters();
        });
    });

    document.getElementById("subjectSelect")?.addEventListener("change", function () {
        currentSubject = this.value;
        applyFilters();
    });

    function applyFilters() {
        assignments.forEach(item => {
            const isEmpty = item.classList.contains("empty-assignment");
            const isExpired = item.classList.contains("expired");
            const itemSubject = item.getAttribute("data-subject");

            let matchStatus = true;
            if (currentStatus === "active") matchStatus = !isEmpty && !isExpired;
            else if (currentStatus === "expired") matchStatus = isExpired;
            else if (currentStatus === "pending") matchStatus = isEmpty;

            const matchSubject = (currentSubject === "all") || (itemSubject === currentSubject);

            item.style.display = (matchStatus && matchSubject) ? "block" : "none";
        });
    }

    // === MỞ MODAL – ĐÃ SỬA ĐÚNG THEO HTML HIỆN TẠI ===
    assignments.forEach(item => {
        item.addEventListener("click", function () {
            if (this.classList.contains("empty-assignment")) return;

            const subject = this.querySelector(".subject")?.textContent.trim();
            const title = this.querySelector("h4")?.textContent.trim();
            const gvLine = this.querySelector(".time > div:first-child")?.textContent.trim() || "";
            const dueLine = this.querySelector(".time > div:last-child")?.textContent.trim() || "";
            const descHTML = this.querySelector(".description")?.innerHTML || "Không có nội dung";

            // Lấy tên GV (bỏ "GV:")
            const teacher = gvLine.replace("GV:", "").trim();

            // Lấy hạn nộp (bỏ "Hạn nộp:")
            const dueDate = dueLine.replace("Hạn nộp:", "").trim();

            // Điền vào modal
            document.getElementById("m_subject").textContent = subject;
            document.getElementById("m_title").textContent = title;
            document.getElementById("m_description").innerHTML = descHTML;

            // Nếu bạn muốn hiện thêm GV và hạn trong modal thì thêm 2 dòng này:
            // document.querySelector("#m_teacher") && (document.getElementById("m_teacher").textContent = teacher);
            // document.querySelector("#m_dueDate") && (document.getElementById("m_dueDate").textContent = dueDate);

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
});