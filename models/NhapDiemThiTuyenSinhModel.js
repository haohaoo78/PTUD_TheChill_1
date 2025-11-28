// models/NhapDiemThiTuyenSinhModel.js (ĐÃ FIX HOÀN HẢO CHO DB CỦA EM)
const db = require('../config/database');

const NhapDiemThiTuyenSinhModel = {
  getCandidatesByRoom: async (nam_thi, ma_phong_thi) => {
    const query = `
      SELECT 
        MaThiSinh,
        HoTen,
        IFNULL(Toan, '') AS Toan,
        IFNULL(Van, '') AS Van,
        IFNULL(Anh, '') AS Anh,
        IFNULL(TuChon, '') AS TuChon,
        PhongThi  -- thêm để debug nếu cần
      FROM \`thisinhduthi\`
      WHERE NamThi = ? AND PhongThi = ?
      ORDER BY MaThiSinh
    `;
    try {
      const [rows] = await db.execute(query, [nam_thi, ma_phong_thi]);
      return rows;
    } catch (err) {
      console.error('Lỗi query load thí sinh:', err.message); // in ra server để debug
      throw err;
    }
  },

  // 2 hàm còn lại giữ nguyên, chỉ sửa tên bảng + backtick + tên cột đúng case
  saveOrUpdate: async (data) => {
    const { ma_thi_sinh, toan, van, anh, tu_chon, nam_thi, ma_phong_thi } = data;
    const tongDiem = ((parseFloat(toan || 0) + parseFloat(van || 0) + parseFloat(anh || 0) + parseFloat(tu_chon || 0)) / 4).toFixed(2);

    const sql = `
      UPDATE \`thisinhduthi\`
      SET Toan = ?, Van = ?, Anh = ?, TuChon = ?, TongDiem = ?
      WHERE MaThiSinh = ? AND NamThi = ? AND PhongThi = ?
    `;
    const [result] = await db.execute(sql, [toan, van, anh, tu_chon, tongDiem, ma_thi_sinh, nam_thi, ma_phong_thi]);
    if (result.affectedRows === 0) throw new Error("Không tìm thấy thí sinh!");
  },

  delete: async (maThiSinh) => {
    const sql = `
      UPDATE \`thisinhduthi\` 
      SET Toan = NULL, Van = NULL, Anh = NULL, TuChon = NULL, TongDiem = NULL 
      WHERE MaThiSinh = ?
    `;
    const [result] = await db.execute(sql, [maThiSinh]);
    return result.affectedRows > 0;
  }
};

module.exports = NhapDiemThiTuyenSinhModel;