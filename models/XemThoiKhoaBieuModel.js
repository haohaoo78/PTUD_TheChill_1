const db = require('../config/database');

class XemThoiKhoaBieuModel {
    static async getLopByHocSinh(maHocSinh) {
        try {
            const query = `SELECT MaLop, TenHocSinh FROM HocSinh WHERE MaHocSinh = ?`;
            const [rows] = await db.execute(query, [maHocSinh]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật: Thêm tham số fromDate và toDate
    static async getTKBByLop(maLop, fromDate, toDate) {
        try {
            // Lọc theo MaLop, Ngày nằm trong khoảng tuần, và loại bỏ EMPTY_WEEK
            const query = `
                SELECT T.*, GV.TenGiaoVien 
                FROM ThoiKhoaBieu T
                LEFT JOIN GiaoVien GV ON T.MaGiaoVien = GV.MaGiaoVien
                WHERE T.MaLop = ? 
                  AND T.TenMonHoc != 'EMPTY_WEEK'
                  AND T.Ngay BETWEEN ? AND ?
                ORDER BY T.Thu ASC, T.TietHoc ASC
            `;
            // Truyền đúng thứ tự tham số
            const [rows] = await db.execute(query, [maLop, fromDate, toDate]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = XemThoiKhoaBieuModel;