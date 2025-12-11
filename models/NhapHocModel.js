const db = require('../config/database');

const NhapHocModel = {
  getStatus: async (maHS) => {
    try {
      // Table: HocSinh (MaHocSinh, TenHocSinh, TrangThai, Khoi, ...)
      const query = `SELECT TrangThai AS TrangThaiNhapHoc, TenHocSinh AS HoTen, Khoi FROM HocSinh WHERE MaHocSinh = ?`;
      const [rows] = await db.execute(query, [maHS]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },
  
  confirm: async (maHS, khoiHoc) => {
    try {
      // Update TrangThai to 'Đang học' and save Khoi
      // Assuming HocSinh table has 'Khoi' column as per requirements for this feature
      const query = `UPDATE HocSinh SET TrangThai = 'Đang học', Khoi = ? WHERE MaHocSinh = ?`;
      await db.execute(query, [khoiHoc, maHS]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = NhapHocModel;
