document.addEventListener("DOMContentLoaded", function () {
    const assignmentsGrid = document.querySelector('.assignments-grid');
    const modal = document.getElementById("assignmentModal");

    let currentStatus = 'all';
    let currentSubject = 'all';

    // helper: luôn lấy nodeList hiện tại (dùng nếu DOM thay đổi động)
    function getAssignments() {
        return assignmentsGrid
            ? assignmentsGrid.querySelectorAll('.assignment')
            : document.querySelectorAll('.assignment');
    }

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
        const assignments = getAssignments();
        assignments.forEach(item => {
            const isEmpty = item.classList.contains("empty-assignment");
            const isExpired = item.classList.contains("expired");
            const itemSubject = item.getAttribute("data-subject");

            // LỌC THEO TRẠNG THÁI
            let matchStatus = true;
            if (currentStatus === "active") matchStatus = !isEmpty && !isExpired;
            else if (currentStatus === "expired") matchStatus = isExpired;
            else if (currentStatus === "pending") matchStatus = isEmpty;

            // LỌC THEO MÔN
            const matchSubject = (currentSubject === "all") || (itemSubject === currentSubject);

            // KẾT HỢP 2 ĐIỀU KIỆN
            item.style.display = (matchStatus && matchSubject) ? "" : "none"; // để trống cho layout kế thừa
        });
    }

    // === MỞ MODAL – delegation để đảm bảo hoạt động sau khi DOM thay đổi ===
    const delegateTarget = assignmentsGrid || document;
    async function handleOpenEvent(e) {
        const card = e.target.closest('.assignment');
        if (!card) return;
        if (card.classList.contains('empty-assignment')) return;

        let subject = card.querySelector('.subject')?.textContent?.trim() || '';
        let title = card.querySelector('h4')?.textContent?.trim() || '';
        const ma = card.dataset.id || '';
        // prefer fetching detail from server by MaBaiTap when available
        let descHTML = card.querySelector('.description')?.innerHTML || 'Không có nội dung';
        if (ma) {
            try {
                const res = await fetch('/api/xembaitap/detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ MaBaiTap: ma }) });
                const rj = await res.json();
                if (rj.success && rj.data) {
                    descHTML = rj.data.fullDescription || descHTML;
                    // ensure subject/title reflect server data
                    if (rj.data.subject) subject = rj.data.subject;
                    if (rj.data.title) title = rj.data.title;
                }
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết bài tập:', err);
            }
        }

        const m_subject = document.getElementById('m_subject');
        const m_title = document.getElementById('m_title');
        const m_description = document.getElementById('m_description');
        if (m_subject) m_subject.textContent = subject;
        if (m_title) m_title.textContent = title;
        if (m_description) m_description.innerHTML = descHTML;

        console.log('Opening assignment modal:', title, subject);
        if (modal) {
            modal.style.display = "flex";
            modal.style.position = modal.style.position || "fixed";
            modal.style.zIndex = modal.style.zIndex || "99999";
        }
    }
    delegateTarget.addEventListener('click', handleOpenEvent);
    delegateTarget.addEventListener('pointerdown', handleOpenEvent);
    delegateTarget.addEventListener('mousedown', handleOpenEvent);

    // === ĐÓNG MODAL ===
    if (modal) {
        document.querySelectorAll(".close-btn, .close-modal-btn").forEach(btn => {
            btn.onclick = () => modal.style.display = "none";
        });

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && getComputedStyle(modal).display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    // Chạy lọc lần đầu
    applyFilters();
});
