// controllers/XemBaiTapController.js – SỬA CHỈ 1 DÒNG DUY NHẤT!!!
const XemBaiTapModel = require('../models/XemBaiTapModel');

class XemBaiTapController {
    async renderPage(req, res) {
        try {
            const maLop = req.session.user?.MaLop || 'L01';
            const data = await XemBaiTapModel.getAssignments(maLop);

            // ĐÚNG RỒI – FILE CHÍNH CỦA BẠN LÀ index.ejs
            res.render('pages/xembaitap', {       // ← BÁO CHO index.ejs BIẾT INCLUDE FILE xembaitap.ejs
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

    async getAssignmentDetail(req, res) {
        try {
            const { MaBaiTap } = req.body;
            if (!MaBaiTap) return res.status(400).json({ success: false, message: 'Thiếu MaBaiTap' });
            const row = await XemBaiTapModel.getAssignmentById(MaBaiTap);
            if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.json({ success: true, data: row });
        } catch (err) {
            console.error('Lỗi khi lấy chi tiết bài tập:', err);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết' });
        }
    }
}

module.exports = new XemBaiTapController();