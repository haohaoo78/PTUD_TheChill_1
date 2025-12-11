const db = require('../config/database');

const XemDiemModel = {
  getScores: async (maHS, namHoc, hocKy) => {
    try {
      // Updated schema: Diem (MaHocSinh, TenMonHoc, NamHoc, HocKi, ThuongXuyen1, ThuongXuyen2, ThuongXuyen3, Diem15_1, Diem15_2, GK, CK, TrungBinhMon)
      const query = `
        SELECT 
          TenMonHoc AS TenMon, 
          ThuongXuyen1 AS DiemMieng, 
          Diem15_1 AS Diem15P, 
          GK AS Diem1Tiet, 
          CK AS DiemThi, 
          TrungBinhMon AS DTB
        FROM Diem
        WHERE MaHocSinh = ? AND NamHoc = ? AND HocKi = ?
      `;
      const [rows] = await db.execute(query, [maHS, namHoc, hocKy]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getHanhKiemHocLuc: async (maHS, namHoc, hocKy) => {
    try {
      // Use HocBa table instead of KetQuaHocTap
      // Note: HocBa uses 'HocKy', Diem uses 'HocKi'
      const query = `
        SELECT HanhKiem, HocLuc
        FROM HocBa
        WHERE MaHocSinh = ? AND NamHoc = ? AND HocKy = ?
      `;
      const [rows] = await db.execute(query, [maHS, namHoc, hocKy]);
      return rows[0];
    } catch (err) {
      // If table or column doesn't exist, return null/empty to avoid crashing
      console.warn("Error fetching HanhKiem/HocLuc:", err.message);
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
