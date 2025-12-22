// controllers/XemThongKeKetQuaController.js

const renderPage = async (req, res, stats = null, error = null, viewData = {}) => {
    const currentNamHoc = '2025-2026';

    let classes = [];
    try {
        [classes] = await global.db.query("SELECT malop AS MaLop, tenlop AS TenLop FROM lop WHERE trangthai = 'Đang học' ORDER BY tenlop").catch(() => [[]]);
    } catch (err) {
        console.error('Lỗi lấy lớp:', err);
    }

    const renderData = {
        user: req.session.user || null,
        currentNamHoc,
        classes,
        stats,
        error,
        kyHoc: req.body?.kyHoc || null,
        maLop: viewData.maLop || null,
        gvcnClass: viewData.gvcnClass || null
    };

    // ƯU TIÊN: Nếu là AJAX → luôn render partial (không layout) để chèn vào #main-content
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.render('pages/xemthongkeketqua', { layout: false, ...renderData });
    }

    return res.render('pages/xemthongkeketqua', renderData);
};

const handleRender = async (req, res) => {
    const role = req.session.user?.role;

    if (!role || (role !== 'Giáo viên' && role !== 'Hiệu trưởng')) {
        return renderPage(req, res, null, 'Bạn không có quyền truy cập chức năng này.');
    }

    const currentNamHoc = '2025-2026';

    if (req.method === 'POST') {
        const { maLop, kyHoc } = req.body;

        if (!kyHoc) {
            return renderPage(req, res, null, 'Vui lòng chọn học kỳ');
        }

        let finalMaLop = maLop || null;
        let gvcnClass = null;

        if (role === 'Giáo viên') {
            const username = req.session.user.username;

            const [gvcnRows] = await global.db.query(
                `SELECT l.malop, l.tenlop 
                 FROM GVChuNhiem gvcn
                 JOIN lop l ON gvcn.MaLop = l.MaLop
                 WHERE gvcn.MaGVCN = ? AND gvcn.NamHoc = ?`,
                [username, currentNamHoc]
            );

            if (gvcnRows.length === 0) {
                return renderPage(req, res, null, 'Bạn chưa được phân công chủ nhiệm lớp nào trong năm học hiện tại.');
            }

            finalMaLop = gvcnRows[0].malop;
            gvcnClass = gvcnRows[0].tenlop;
        }

        let stats = null;
        let error = null;

        try {
            let query = `
                SELECT 
                    m.tenmonhoc AS TenMonHoc,
                    COUNT(d.mahocsinh) AS TongHS,
                    ROUND(AVG(d.trungbinhmon), 2) AS DiemTB,
                    ROUND((SUM(CASE WHEN d.trungbinhmon >= 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(d.mahocsinh)), 2) AS TyLeDat,
                    ROUND((SUM(CASE WHEN d.trungbinhmon < 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(d.mahocsinh)), 2) AS TyLeKhongDat
                FROM diem d
                JOIN monhoc m ON d.tenmonhoc = m.tenmonhoc
                JOIN hocsinh hs ON d.mahocsinh = hs.mahocsinh
                WHERE d.namhoc = ? AND d.hocki = ?
            `;

            const params = [currentNamHoc, kyHoc];

            if (finalMaLop) {
                query += " AND hs.malop = ?";
                params.push(finalMaLop);
            }

            query += " GROUP BY m.tenmonhoc ORDER BY DiemTB DESC";

            const [statsResult] = await global.db.query(query, params);
            stats = statsResult;

            if (stats.length === 0) {
                error = 'Không có dữ liệu thống kê cho điều kiện đã chọn.';
            }
        } catch (err) {
            console.error('Lỗi query thống kê:', err);
            error = 'Lỗi hệ thống khi lấy thống kê';
        }

        const viewData = { maLop: finalMaLop, gvcnClass };
        return renderPage(req, res, stats, error, viewData);
    } else {
        // GET request (mới vào trang qua AJAX) → render partial trống
        return renderPage(req, res);
    }
};

module.exports = { handleRender };