const db = require('../config/database');

const HocPhiModel = {
  getTuition: async (maHS, namHoc, hocKy) => {
    try {
      // Table: HocPhi (MaHocSinh, HocPhi, TrangThai, NamHoc, HocKi)
      // Alias HocPhi to SoTien for frontend compatibility
      const query = `SELECT MaHocSinh, HocPhi AS SoTien, TrangThai, NamHoc, HocKi FROM HocPhi WHERE MaHocSinh = ? AND NamHoc = ? AND HocKi = ?`;
      const [rows] = await db.execute(query, [maHS, namHoc, hocKy]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },
  
  payTuition: async (maHS, namHoc, hocKy, soTien) => {
    try {
      // Update status based on composite key
      const query = `UPDATE HocPhi SET TrangThai = 'Đã đóng' WHERE MaHocSinh = ? AND NamHoc = ? AND HocKi = ?`;
      await db.execute(query, [maHS, namHoc, hocKy]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = HocPhiModel;
