const db = require('../config/database');

const XinPhepModel = {
  createRequest: async (maHS, ngayNghi, lyDo) => {
    try {
      // Table: PhieuXinPhep (MaPhieu, LyDoNghi, Ngay, MaHocSinh)
      // Generate shorter ID to fit VARCHAR(10)
      const maPhieu = 'PX' + Math.floor(100000 + Math.random() * 900000); 
      const query = `INSERT INTO PhieuXinPhep (MaPhieu, MaHocSinh, Ngay, LyDoNghi) VALUES (?, ?, ?, ?)`;
      await db.execute(query, [maPhieu, maHS, ngayNghi, lyDo]);
    } catch (err) {
      throw err;
    }
  },
  
  getHistory: async (maHS) => {
    try {
      const query = `SELECT * FROM PhieuXinPhep WHERE MaHocSinh = ? ORDER BY Ngay DESC`;
      const [rows] = await db.execute(query, [maHS]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getRequestsByTeacher: async (maGV) => {
    try {
      // Lấy danh sách đơn xin phép của học sinh thuộc lớp mà giáo viên chủ nhiệm
      // Giả định trạng thái mặc định là 'Chờ duyệt'
      const query = `
        SELECT p.MaPhieu, p.Ngay, p.LyDoNghi, p.TrangThai, h.TenHocSinh AS HoTen, l.TenLop, h.MaHocSinh
        FROM PhieuXinPhep p
        JOIN HocSinh h ON p.MaHocSinh = h.MaHocSinh
        JOIN Lop l ON h.MaLop = l.MaLop
        JOIN GVChuNhiem gvc ON l.MaLop = gvc.MaLop
        WHERE gvc.MaGVCN = ? 
        ORDER BY p.Ngay DESC
      `;
      const [rows] = await db.execute(query, [maGV]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  updateStatus: async (maPhieu, trangThai) => {
    try {
      const query = `UPDATE PhieuXinPhep SET TrangThai = ? WHERE MaPhieu = ?`;
      await db.execute(query, [trangThai, maPhieu]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = XinPhepModel;
