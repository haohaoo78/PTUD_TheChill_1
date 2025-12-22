// controllers/XemBaiTapController.js – SỬA CHỈ 1 DÒNG DUY NHẤT!!!
const XemBaiTapModel = require('../models/XemBaiTapModel');

class XemBaiTapController {
   async renderPage(req, res) {
    try {
        const maLop = req.session.user?.MaLop;

        if (!maLop) {
            return res.render('pages/xembaitap', {
                title: 'Xem Bài Tập',
                user: req.session.user,
                assignments: [],
                total: 0,
                active: 0,
                expired: 0,
                message: 'Bạn chưa được xếp lớp'
            });
        }

        const data = await XemBaiTapModel.getAssignments(maLop);

        res.render('pages/xembaitap', {
            title: 'Xem Bài Tập',
            user: req.session.user,
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