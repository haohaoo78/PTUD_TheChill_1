// routes/XemBaiTapRoutes.js – PHIÊN BẢN HOÀN HẢO NHẤT, ĐẸP + NGĂN NẮP + CHUYÊN NGHIỆP 2025
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// DANH SÁCH TẤT CẢ MÔN HỌC (luôn hiện đủ dù chưa có bài)
const TAT_CA_MON = [
    'Toán học', 'Ngữ văn', 'Tiếng Anh',
    'Vật lý', 'Hóa học', 'Sinh học',
    'Lịch sử', 'Địa lý', 'GDCD', 'Tin học', 'Công nghệ'
];

router.get('/', async (req, res) => {
    const maLop = req.session.user?.MaLop || 'L01'; // Thay bằng req.session.user.MaLop khi có login

    try {
        // LẤY TẤT CẢ BÀI TẬP CỦA LỚP
        const [btRows] = await db.execute(`
            SELECT 
                bt.MaBaiTap,
                bt.NoiDung,
                bt.NgayGiao,
                bt.NgayHetHan,
                gv.TenGiaoVien,
                gv.TenMonHoc AS subject
            FROM BaiTap bt
            JOIN GiaoVien gv ON bt.MaGiaoVien = gv.MaGiaoVien
            WHERE bt.MaLop = ?
            ORDER BY bt.NgayGiao DESC
        `, [maLop]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // CHUYỂN BÀI TẬP THÀNH OBJECT ĐẸP + FULLDESCRIPTION NGĂN NẮP TỪNG DÒNG
        const assignments = btRows.map(row => {
            const due = new Date(row.NgayHetHan);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            const remaining = diffDays < 0 ? 0 : diffDays;

            return {
                subject: row.subject,
                title: row.NoiDung.length > 70 ? row.NoiDung.substring(0, 67) + '...' : row.NoiDung,
                fullDescription: `
                    <div style="font-size:15px; line-height:2; color:#1e293b;">
                        ${row.NoiDung.replace(/\n/g, '<br>')}
                        <hr style="margin:24px 0; border:0; border-top:1px dashed #e2e8f0;">
                        <p style="margin:8px 0; color:#475569;">
                            <strong style="color:#1e40af;">Giáo viên:</strong> ${row.TenGiaoVien}
                        </p>
                        <p style="margin:8px 0; color:#475569;">
                            <strong style="color:#1e40af;">Giao ngày:</strong> ${new Date(row.NgayGiao).toLocaleDateString('vi-VN')}
                        </p>
                        <p style="margin:8px 0; color:#dc2626; font-weight:600;">
                            <strong style="color:#dc2626;">Hạn nộp:</strong> ${new Date(row.NgayHetHan).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                `.trim(),
                teacher: row.TenGiaoVien,
                assignDate: row.NgayGiao,
                dueDate: row.NgayHetHan,
                expired: diffDays < 0,
                remainingDays: remaining,
                isEmpty: false
            };
        });

        // TẠO DANH SÁCH ĐẦY ĐỦ TẤT CẢ MÔN (có bài hoặc chưa có)
        const finalAssignments = TAT_CA_MON.map(mon => {
            const found = assignments.find(a => a.subject === mon);
            if (found) {
                return found;
            } else {
                return {
                    subject: mon,
                    title: "Bài tập chưa được giao",
                    fullDescription: `
                        <div style="text-align:center; padding:50px; color:#94a3b8; line-height:1.8;">
                            <i class="fas fa-clock fa-4x" style="color:#e2e8f0; margin-bottom:20px; opacity:0.8;"></i>
                            <p style="font-size:15px;">Giáo viên sẽ sớm cập nhật nội dung cho môn này</p>
                        </div>
                    `.trim(),
                    teacher: "—",
                    assignDate: null,
                    dueDate: null,
                    expired: false,
                    remainingDays: 999,
                    isEmpty: true
                };
            }
        });

        // Thêm môn ngoài danh sách (nếu có giáo viên dạy môn lạ)
        assignments.forEach(a => {
            if (!TAT_CA_MON.includes(a.subject)) {
                finalAssignments.push(a);
            }
        });

        // TÍNH THỐNG KÊ
        const total = assignments.length;
        const active = assignments.filter(a => a.remainingDays > 0 && !a.expired).length;
        const expired = assignments.filter(a => a.expired).length;

        // RENDER TRANG
        res.render('index', {
            title: 'Xem Bài Tập',
            page: 'xembaitap',
            user: req.session.user || { TenHocSinh: 'Học sinh demo', MaLop: maLop },
            assignments: finalAssignments,
            total,
            active,
            expired
        });

    } catch (err) {
        console.error("Lỗi database:", err);
        res.status(500).send("Lỗi hệ thống! Vui lòng thử lại sau.");
    }
});

module.exports = router;