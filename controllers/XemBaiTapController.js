// controllers/XemBaiTapController.js – SỬA CHỈ 1 DÒNG DUY NHẤT!!!
const XemBaiTapModel = require('../models/XemBaiTapModel');

class XemBaiTapController {
    async renderPage(req, res) {
        try {
            const maLop = req.session.user?.MaLop || 'L01';
            const data = await XemBaiTapModel.getAssignments(maLop);

            // ĐÚNG RỒI – FILE CHÍNH CỦA BẠN LÀ index.ejs
            res.render('pages/xembaitap', {  // ← ĐÚNG RỒI, KHÔNG PHẢI layout.ejs
                title: 'Xem Bài Tập',     // ← BÁO CHO index.ejs BIẾT INCLUDE FILE xembaitap.ejs
                user: req.session.user,   // ← BẮT BUỘC ĐỂ HIỆN SIDEBAR
                assignments: data.assignments,
                total: data.total,
                active: data.active,
                expired: data.expired
            });

        } catch (err) {
            console.error('Lỗi render trang xem bài tập:', err);
            res.status(500).send('Lỗi hệ thống!');
        }
    }
}

module.exports = new XemBaiTapController();