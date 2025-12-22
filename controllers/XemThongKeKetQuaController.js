// controllers/XemThongKeKetQuaController.js

const renderPage = async (req, res, stats = null, error = null, formData = {}) => {
    let classes = [];
    let subjects = [];
    let semesters = [];

    try {
        [classes] = await global.db.query("SELECT malop AS MaLop, tenlop AS TenLop FROM lop WHERE trangthai = 'Đang học' ORDER BY tenlop").catch(() => [[]]);
        [subjects] = await global.db.query("SELECT DISTINCT tenmonhoc AS TenMonHoc FROM monhoc WHERE trangthai = 'Đang dạy' ORDER BY tenmonhoc").catch(() => [[]]);
        [semesters] = await global.db.query("SELECT DISTINCT namhoc AS NamHoc FROM hocky ORDER BY namhoc DESC").catch(() => [[]]);
    } catch (err) {
        console.error('Lỗi lấy dropdown:', err);
    }

    // Kiểm tra nếu là AJAX request để render partial (không layout)
    const layout = req.xhr ? false : 'index'; // Giả sử file layout là 'layout.ejs' (chỉnh nếu khác)

    res.render('pages/xemthongkeketqua', {
        layout, // Option để quyết định có dùng layout không
        user: req.session.user || null,
        classes,
        subjects,
        semesters,
        stats: stats || null,
        error,
        maLop: formData.maLop || null,
        tenMonHoc: formData.tenMonHoc || null,
        namHoc: formData.namHoc || null,
        kyHoc: formData.kyHoc || null
    });
};

const handleRender = async (req, res) => {
    if (req.method === 'POST') {
        const { maLop, tenMonHoc, namHoc, kyHoc } = req.body;

        if (!namHoc || !kyHoc) {
            return renderPage(req, res, null, 'Vui lòng chọn năm học và học kỳ', req.body);
        }

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
                JOIN lop l ON hs.malop = l.malop
                WHERE d.namhoc = ? AND d.hocki = ?
            `;

            const params = [namHoc, kyHoc];

            if (maLop) {
                query += " AND hs.malop = ?";
                params.push(maLop);
            }
            if (tenMonHoc) {
                query += " AND d.tenmonhoc = ?";
                params.push(tenMonHoc);
            }

            query += " GROUP BY m.tenmonhoc ORDER BY DiemTB DESC";

            const [stats] = await global.db.query(query, params).catch(err => {
                console.error('Lỗi query thống kê:', err);
                return [[]];
            });

            const message = stats.length === 0 ? 'Không có dữ liệu thống kê phù hợp với điều kiện đã chọn.' : null;

            return renderPage(req, res, stats, message, req.body);

        } catch (err) {
            console.error('Lỗi POST thống kê:', err);
            return renderPage(req, res, null, 'Lỗi hệ thống khi lấy thống kê', req.body);
        }
    } else {
        return renderPage(req, res);
    }
};

module.exports = {
    handleRender
};