const db = require('../config/database');

const XemDiemModel = {
  getScores: async (maHS, namHoc, hocKy) => {
    try {
      // Cập nhật query để lấy đầy đủ các cột điểm từ bảng Diem
      const query = `
        SELECT 
          TenMonHoc AS TenMon, 
          ThuongXuyen1 AS TX1, 
          ThuongXuyen2 AS TX2, 
          ThuongXuyen3 AS TX3, 
          Diem15_1 AS D15_1, 
          Diem15_2 AS D15_2, 
          GK, 
          CK, 
          TrungBinhMon AS TB
        FROM Diem
        WHERE MaHocSinh = ? AND NamHoc = ? AND HocKi = ?
      `;
      const [rows] = await db.execute(query, [maHS, namHoc, hocKy]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getHocBa: async (maHS, namHoc, hocKy) => {
    try {
      // Cập nhật để lấy đầy đủ thông tin từ bảng HocBa (HanhKiem, HocLuc, DiemTongKet, NhanXet, RenLuyen)
      // Lưu ý: Sử dụng HocKy thay vì HocKi nếu schema dùng HocKy
      const query = `
        SELECT 
          HanhKiem, 
          HocLuc, 
          DiemTongKet, 
          NhanXet, 
          RenLuyen
        FROM HocBa
        WHERE MaHocSinh = ? AND NamHoc = ? AND HocKy = ?
      `;
      const [rows] = await db.execute(query, [maHS, namHoc, hocKy]);
      return rows[0] || null; // Trả về object đầu tiên hoặc null nếu không có
    } catch (err) {
      console.warn("Error fetching HocBa:", err.message);
      return null;
    }
  },

  getStudentInfo: async (maHS) => {
    try {
      const query = 'SELECT TenHocSinh AS HoTen, MaHocSinh, Birthday AS NgaySinh, MaLop AS Lop FROM HocSinh WHERE MaHocSinh = ?';
      const [rows] = await db.execute(query, [maHS]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }
};

module.exports = XemDiemModel;