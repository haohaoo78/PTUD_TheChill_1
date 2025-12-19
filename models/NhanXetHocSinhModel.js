// models/NhanXetHocSinhModel.js
const db = require('../config/database');

class NhanXetHocSinhModel {
  // Lấy năm học hiện tại (đang học)
  static async getCurrentNamHoc() {
    const [rows] = await db.execute(
      `SELECT NamHoc FROM HocKy WHERE TrangThai = 'Đang học' ORDER BY NamHoc DESC LIMIT 1`
    );
    return rows[0]?.NamHoc || null;
  }

  // Lấy danh sách lớp mà giáo viên dạy bộ môn trong năm học
  static async getClassesByTeacher(maGV, namHoc) {
    if (!maGV || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT DISTINCT l.MaLop, l.TenLop
       FROM GVBoMon g
       JOIN Lop l ON g.MaLop = l.MaLop
       WHERE g.MaGVBM = ? AND g.NamHoc = ? AND l.TrangThai = 'Đang học'
       ORDER BY l.TenLop`,
      [maGV, namHoc]
    );
    return rows;
  }

  // Lấy học sinh trong lớp + nhận xét mới nhất (học kỳ cao nhất)
  static async getStudentsByClass(maLop, namHoc) {
    if (!maLop || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT 
         hs.MaHocSinh, 
         hs.TenHocSinh, 
         hs.GioiTinh, 
         hs.Birthday, 
         hs.TrangThai, 
         hs.KhoaHoc,
         hb.NhanXet
       FROM HocSinh hs
       LEFT JOIN HocBa hb 
         ON hb.MaHocSinh = hs.MaHocSinh 
         AND hb.NamHoc = ?
         AND hb.HocKy = (
           SELECT COALESCE(MAX(HocKy), '1') 
           FROM HocBa 
           WHERE MaHocSinh = hs.MaHocSinh AND NamHoc = ?
         )
       WHERE hs.MaLop = ? AND hs.TrangThai = 'Đang học'
       ORDER BY hs.TenHocSinh`,
      [namHoc, namHoc, maLop]
    );
    return rows;
  }

  // Cập nhật nhận xét cho 1 học sinh (tự động lấy học kỳ cao nhất hoặc mặc định 1)
  static async updateComment(maHocSinh, namHoc, nhanXet = '') {
    if (!maHocSinh || !namHoc) return;

    const [rows] = await db.execute(
      `SELECT COALESCE(MAX(HocKy), '1') AS HocKy 
       FROM HocBa 
       WHERE MaHocSinh = ? AND NamHoc = ?`,
      [maHocSinh, namHoc]
    );
    const hocKy = rows[0]?.HocKy || '1';

    await db.execute(
      `INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, NhanXet)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE NhanXet = ?`,
      [maHocSinh, namHoc, hocKy, nhanXet, nhanXet]
    );
  }

  // Cập nhật nhận xét chung cho nhiều học sinh
  static async updateCommentMultiple(maHocSinhList, namHoc, nhanXet = '') {
    if (!maHocSinhList.length || !namHoc) return;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const maHS of maHocSinhList) {
        const [rows] = await conn.execute(
          `SELECT COALESCE(MAX(HocKy), '1') AS HocKy 
           FROM HocBa 
           WHERE MaHocSinh = ? AND NamHoc = ?`,
          [maHS, namHoc]
        );
        const hocKy = rows[0]?.HocKy || '1';

        await conn.execute(
          `INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, NhanXet)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE NhanXet = ?`,
          [maHS, namHoc, hocKy, nhanXet, nhanXet]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = NhanXetHocSinhModel;