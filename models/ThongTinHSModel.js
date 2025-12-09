const db = require('../config/database');

const ThongTinHSModel = {
  getInfo: async (maHS) => {
    try {
      // Join HocSinh and PhuHuynh to get student and parent info
      // Note: PhuHuynh links to HocSinh via MaHocSinh.
      // Assuming we want the parent info associated with this student.
      // If multiple parents, this might return multiple rows or just one.
      // Using LEFT JOIN to ensure we get student info even if no parent info.
      const query = `
        SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai, hs.MaLop,
               ph.HoTen AS TenPhuHuynh, ph.SDT, ph.Email, ph.HoTen
        FROM HocSinh hs
        LEFT JOIN PhuHuynh ph ON hs.MaHocSinh = ph.MaHocSinh
        WHERE hs.MaHocSinh = ?
      `;
      const [rows] = await db.execute(query, [maHS]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },
  
  updateInfo: async (maHS, data) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const { DiaChi, SDT, Email, NgaySinh, GioiTinh, TenPhuHuynh } = data;
      
      // Update HocSinh (Birthday, GioiTinh)
      // Note: HocSinh schema only has Birthday, GioiTinh, etc. No DiaChi, SDT, Email.
      if (NgaySinh || GioiTinh) {
          const queryHS = `UPDATE HocSinh SET Birthday = ?, GioiTinh = ? WHERE MaHocSinh = ?`;
          await conn.execute(queryHS, [NgaySinh, GioiTinh, maHS]);
      }

      // Update PhuHuynh (SDT, Email, HoTen)
      // We need to know WHICH parent to update if there are multiple.
      // For now, update all parents linked to this student? Or assume SDT is the key?
      // If SDT is changed, we might break the link if SDT is the key.
      // But SDT is FK to TaiKhoan. Changing SDT might require changing TaiKhoan too.
      // Let's assume we only update Email and HoTen for the parent linked to this student.
      // And maybe we don't update SDT here as it is the username.
      if (Email || TenPhuHuynh) {
          const queryPH = `UPDATE PhuHuynh SET Email = ?, HoTen = ? WHERE MaHocSinh = ?`;
          await conn.execute(queryPH, [Email, TenPhuHuynh, maHS]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = ThongTinHSModel;
