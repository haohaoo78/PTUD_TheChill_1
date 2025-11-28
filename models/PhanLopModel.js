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
  // get available students for a year & optional Khối: students with no MaLop (unassigned)
  static async getUnassignedStudents(namHoc, maKhoi = null) {
    let sql = `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.KhoaHoc, hs.MaLop, hs.GhiChu, hs.TrangThai, hs.GioiTinh, hs.Birthday
               FROM HocSinh hs
               LEFT JOIN Lop l ON hs.MaLop = l.MaLop
               WHERE (hs.MaLop IS NULL OR hs.MaLop = '') AND hs.KhoaHoc = ?`;
    const params = [namHoc];
    if (maKhoi) {
      // If we know the student's Khối via s.t., this joins would return none; we include students without class but assumed for Khối
      sql += ' AND (l.Khoi = ? OR l.Khoi IS NULL)';
      params.push(maKhoi);
    }
    sql += ' ORDER BY hs.TenHocSinh';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getClassesByKhoi(maKhoi) {
    const [rows] = await db.execute('SELECT MaLop, TenLop, SiSo FROM Lop WHERE Khoi = ? ORDER BY TenLop', [maKhoi]);
    return rows;
  }

  static async saveAssignments(assignments) {
    // assignments is array of { MaHocSinh, MaLop }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const a of assignments) {
        await conn.execute('UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ?', [a.MaLop, a.MaHocSinh]);
      }
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getClassCounts(maKhoi) {
    const [rows] = await db.execute(`SELECT MaLop, SiSo, (SELECT COUNT(*) FROM HocSinh hs WHERE hs.MaLop = l.MaLop) as CurrentCount
      FROM Lop l
      WHERE l.Khoi = ?`, [maKhoi]);
    return rows;
  }

  static async getStudentsInClass(maLop, namHoc) {
    const [rows] = await db.execute(`
      SELECT hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh, hs.Birthday, hs.TrangThai
      FROM HocSinh hs
      WHERE hs.MaLop = ?
    `, [maLop]);
    return rows;
  }

}
module.exports = PhanLopModel;