const XemThoiKhoaBieuModel = require('../models/XemThoiKhoaBieuModel');

class XemThoiKhoaBieuController {
    
    static async renderPage(req, res) {
        if (!req.session.user) {
            return res.status(401).send('Vui lòng đăng nhập.');
        }
        res.render('pages/xemthoikhoabieu'); 
    }

    static async getScheduleData(req, res) {
        try {
            const user = req.session.user;
            if (!user) {
                return res.json({ success: false, message: 'Chưa đăng nhập' });
            }

            let maHocSinh = user.username || user.TenTaiKhoan; 

            // 1. Nhận ngày client gửi lên (nếu không có thì lấy ngày hiện tại)
            const queryDate = req.query.date ? new Date(req.query.date) : new Date();

            // 2. Tính toán Thứ 2 và Chủ Nhật của tuần chứa queryDate
            const currentDay = queryDate.getDay(); // 0 là CN, 1 là T2...
            const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Nếu là CN thì lùi 6 ngày, còn lại lùi về T2
            
            const monday = new Date(queryDate);
            monday.setDate(queryDate.getDate() + distanceToMonday);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            // Format YYYY-MM-DD để query SQL
            const formatDate = (date) => date.toISOString().split('T')[0];
            const strMonday = formatDate(monday);
            const strSunday = formatDate(sunday);

            // 3. Lấy thông tin lớp
            const hocSinhInfo = await XemThoiKhoaBieuModel.getLopByHocSinh(maHocSinh);
            if (!hocSinhInfo || !hocSinhInfo.MaLop) {
                return res.json({ success: false, message: 'Học sinh chưa được xếp lớp.' });
            }

            // 4. Lấy TKB theo khoảng ngày
            const tkb = await XemThoiKhoaBieuModel.getTKBByLop(hocSinhInfo.MaLop, strMonday, strSunday);

            return res.json({ 
                success: true, 
                data: tkb, 
                info: { 
                    tenHS: hocSinhInfo.TenHocSinh, 
                    maLop: hocSinhInfo.MaLop,
                    weekStart: strMonday, // Trả về để Client hiển thị
                    weekEnd: strSunday
                } 
            });

        } catch (error) {
            console.error('Lỗi lấy TKB:', error);
            res.json({ success: false, message: 'Lỗi server khi lấy thời khóa biểu.' });
        }
    }
}

module.exports = XemThoiKhoaBieuController;