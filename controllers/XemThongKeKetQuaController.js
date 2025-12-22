// controllers/XemThongKeKetQuaController.js

const XemThongKeKetQuaModel = require('../models/XemThongKeKetQuaModel');

const renderPage = async (req, res, stats = null, error = null, formData = {}) => {
    const user = req.session.user || null;
    let classes = [];
    let subjects = [];
    let semesters = [];
    let classInfo = null;

    try {
        classes = await XemThongKeKetQuaModel.getClassesByRole(user);
        subjects = await XemThongKeKetQuaModel.getSubjects();
        semesters = await XemThongKeKetQuaModel.getSemesters();

        if (user.role === 'Giáo viên chủ nhiệm') {
            // Lấy lớp chủ nhiệm hiện tại
            const [rows] = await global.db.query(`
                SELECT l.MaLop, l.TenLop, gvcn.NamHoc
                FROM Lop l
                JOIN GVChuNhiem gvcn ON l.MaLop = gvcn.MaLop
                WHERE gvcn.MaGVCN = ? AND l.TrangThai = 'Đang học'
                ORDER BY gvcn.NamHoc DESC
                LIMIT 1
            `, [user.username]);
            if (rows.length > 0) {
                classInfo = rows[0];
            }
        }
    } catch (err) {
        console.error('Lỗi lấy dropdown:', err);
    }

    const layout = req.xhr ? false : 'index';

    res.render('pages/xemthongkeketqua', {
        layout,
        user,
        classes,
        subjects,
        semesters,
        classInfo,
        stats: stats || null,
        error,
        maLop: formData.maLop || null,
        tenMonHoc: formData.tenMonHoc || null,
        namHoc: formData.namHoc || null,
        kyHoc: formData.kyHoc || null
    });
};

const handleRender = async (req, res) => {
    const user = req.session.user || null;
    if (!user) return res.redirect('/');

    if (req.method === 'POST') {
        const { maLop, tenMonHoc, namHoc, kyHoc } = req.body;

        if (!namHoc || !kyHoc) {
            return renderPage(req, res, null, 'Vui lòng chọn năm học và học kỳ', req.body);
        }

        try {
            let stats = null;
            if (user.role === 'Hiệu trưởng') {
                const maTruong = await getMaTruongFromHieuTruong(user.username);
                stats = await XemThongKeKetQuaModel.getStatsForPrincipal(maTruong, { namHoc, kyHoc, maLop, tenMonHoc });
            } else if (user.role === 'Giáo viên chủ nhiệm') {
                stats = await XemThongKeKetQuaModel.getStatsForClassTeacher(user.username, { namHoc, kyHoc });
            } else if (user.role === 'Giáo vụ') {
                stats = await XemThongKeKetQuaModel.getStatsForAdmin({ namHoc, kyHoc });
            } else {
                return renderPage(req, res, null, 'Vai trò không được hỗ trợ', req.body);
            }

            const message = !stats || (Array.isArray(stats) && stats.length === 0) ? 'Không có dữ liệu thống kê phù hợp.' : null;
            return renderPage(req, res, stats, message, req.body);

        } catch (err) {
            console.error('Lỗi POST thống kê:', err);
            return renderPage(req, res, null, 'Lỗi hệ thống khi lấy thống kê', req.body);
        }
    } else {
        return renderPage(req, res);
    }
};

async function getMaTruongFromHieuTruong(maHieuTruong) {
    const [rows] = await global.db.query("SELECT MaTruong FROM HieuTruong WHERE MaHieuTruong = ?", [maHieuTruong]);
    return rows[0]?.MaTruong || null;
}

module.exports = {
    handleRender
};