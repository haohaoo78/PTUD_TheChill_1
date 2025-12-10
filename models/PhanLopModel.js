// models/PhanLopModel.js
const db = require('../config/database');

class PhanLopModel {
  static async getKhoiList() {
    const [rows] = await db.execute('SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY MaKhoi');
    return rows;
  }

  static async getNamHocList() {
    const [rows] = await db.execute('SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC');
    return rows.map(r => r.NamHoc);
  }

  static async getUnassignedStudents(namHoc, maKhoi = null) {
    let sql = `
      SELECT hs.MaHocSinh, hs.TenHocSinh, hs.KhoaHoc, hs.GioiTinh, 
             COALESCE(hs.GhiChu, 'Không có') AS ToHop,
             hs.TrangThai
      FROM HocSinh hs
      LEFT JOIN Lop l ON hs.MaLop = l.MaLop AND l.Khoi = ?
      WHERE hs.KhoaHoc = ?
        AND (hs.MaLop IS NULL OR hs.MaLop = '' OR l.MaLop IS NULL)
    `;
    const params = [maKhoi || '', namHoc];

    if (maKhoi) {
      sql += ` AND (hs.GhiChu LIKE ? OR hs.GhiChu IS NULL OR hs.GhiChu = '' OR hs.GhiChu = 'Không có')`;
      params.push(`%${maKhoi}%`);
    }

    sql += ` ORDER BY hs.TenHocSinh`;
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getClassesByKhoi(maKhoi) {
    const [rows] = await db.execute(`
      SELECT l.MaLop, l.TenLop, l.SiSo, COALESCE(l.MaToHop, '') AS MaToHop,
             COALESCE(COUNT(hs.MaHocSinh), 0) AS CurrentCount
      FROM Lop l
      LEFT JOIN HocSinh hs ON l.MaLop = hs.MaLop
      WHERE l.Khoi = ?
      GROUP BY l.MaLop, l.TenLop, l.SiSo, l.MaToHop
      ORDER BY l.TenLop
    `, [maKhoi]);
    return rows;
  }

  static async saveAssignments(assignments) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const { MaHocSinh, MaLop } of assignments) {
        await conn.execute(
          `UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ?`,
          [MaLop || null, MaHocSinh]
        );
      }
      await conn.commit();
      return { success: true, message: 'Phân lớp thành công!' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getStudentsInClass(maLop) {
    const [rows] = await db.execute(`
      SELECT MaHocSinh, TenHocSinh, GioiTinh, TrangThai
      FROM HocSinh
      WHERE MaLop = ?
      ORDER BY TenHocSinh
    `, [maLop]);
    return rows;
  }
}

module.exports = PhanLopModel;