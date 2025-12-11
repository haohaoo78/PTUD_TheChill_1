
// models/XemBaiTapModel.js – PHIÊN BẢN 2025 SIÊU PRO, KHÔNG CÒN HARD-CODE!!!
const db = require('../config/database');

class XemBaiTapModel {
    static async getAssignments(maLop) {
        // BƯỚC 1: LẤY DANH SÁCH MÔN HỌC CÓ TRONG HỆ THỐNG (DISTINCT)
        const [monHocRows] = await db.execute(`
            SELECT DISTINCT TenMonHoc AS subject 
            FROM GiaoVien 
            WHERE TenMonHoc IS NOT NULL 
                AND TenMonHoc != '' 
                AND TenMonHoc NOT IN ('EMPTY_WEEK', 'NONE', 'NO_CLASS')
            ORDER BY TenMonHoc
        `);
        
        const TAT_CA_MON = monHocRows.map(row => row.subject);

        // Nếu muốn có thứ tự cố định đẹp mắt (Toán, Văn, Anh đầu tiên...), thì sắp xếp lại:
        const MON_CHUAN = ['Toán', 'Ngữ văn', 'Tiếng Anh'];
        const sortedMon = [
            ...MON_CHUAN.filter(m => TAT_CA_MON.includes(m)),
            ...TAT_CA_MON.filter(m => !MON_CHUAN.includes(m)).sort()
        ];

        // BƯỚC 2: LẤY BÀI TẬP NHƯ BÌNH THƯỜNG
        const [rows] = await db.execute(`
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

        const assignments = rows.map(row => {
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
                dueDate: row.NgayHetHan,
                expired: diffDays < 0,
                remainingDays: remaining,
                isEmpty: false
            };
        });

        // DÙNG DANH SÁCH MÔN TỪ DATABASE
        const finalAssignments = sortedMon.map(mon => {
            const found = assignments.find(a => a.subject === mon);
            if (found) return found;
            return {
                subject: mon,
                title: "Bài tập chưa được giao",
                fullDescription: `
                    <div style="text-align:center; padding:50px; color:#94a3b8;">
                        <p style="font-size:15px;">Giáo viên sẽ sớm cập nhật nội dung cho môn này</p>
                    </div>
                `.trim(),
                teacher: "—",
                dueDate: null,
                expired: false,
                remainingDays: 999,
                isEmpty: true
            };
        });

        // Thêm môn lạ (nếu có GV dạy môn ngoài danh sách)
        assignments.forEach(a => {
            if (!sortedMon.includes(a.subject)) {
                finalAssignments.push(a);
            }
        });

        // Tính thống kê
        const realAssignments = assignments.filter(a => !a.isEmpty);
        const total = realAssignments.length;
        const active = realAssignments.filter(a => !a.expired && a.remainingDays > 0).length;
        const expired = realAssignments.filter(a => a.expired).length;

        return { assignments: finalAssignments, total, active, expired };
    }
}

module.exports = XemBaiTapModel;