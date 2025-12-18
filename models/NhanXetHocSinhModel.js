const db = require('../config/database');

class NhanXetHocSinhModel {
  static async getCurrentNamHoc() {
    const [rows] = await db.execute(
      `SELECT NamHoc FROM HocKy WHERE TrangThai = 'Đang học' ORDER BY NamHoc DESC LIMIT 1`
    );
    return rows[0]?.NamHoc || null;
  }

  static async getClassesByTeacher(maGV, namHoc) {
    if (!maGV || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT DISTINCT l.MaLop, l.TenLop
       FROM GVBOMON g
       JOIN Lop l ON g.MaLop = l.MaLop
       WHERE g.MaGVBM = ? AND g.NamHoc = ? AND l.TrangThai = 'Đang học'
       ORDER BY l.TenLop`,
      [maGV, namHoc]
    );
    return rows;
  }

  static async getStudentsByClass(maLop, namHoc) {
    if (!maLop || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh, hs.Birthday, hs.TrangThai, hs.KhoaHoc,
              hb.NhanXet
       FROM HocSinh hs
       LEFT JOIN HocBa hb
         ON hb.MaHocSinh = hs.MaHocSinh
       AND hb.NamHoc = ?
        AND hb.HocKy = (
          SELECT MAX(HocKy) FROM HocBa WHERE MaHocSinh = hs.MaHocSinh AND NamHoc = ?
        )
       WHERE hs.MaLop = ? AND hs.KhoaHoc = ? AND hs.TrangThai = 'Đang học'
       ORDER BY hs.TenHocSinh`,
      [namHoc, namHoc, maLop, namHoc]
    );
    return rows;
  }

  static async updateComment(maHocSinh, namHoc, nhanXet) {
    if (!maHocSinh || !namHoc) return false;
    // Lấy học kỳ mới nhất nếu có, nếu không mặc định 1
    const [rows] = await db.execute(
      `SELECT COALESCE(MAX(HocKy), 1) AS HocKy
       FROM HocBa WHERE MaHocSinh = ? AND NamHoc = ?`,
      [maHocSinh, namHoc]
    );
    const hocKy = rows[0]?.HocKy || 1;
    await db.execute(
      `INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, NhanXet)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE NhanXet = VALUES(NhanXet)`,
      [maHocSinh, namHoc, hocKy, nhanXet]
    );
    return true;
  }

  static async updateCommentMultiple(maHocSinhList = [], namHoc, nhanXet) {
    if (!maHocSinhList.length || !namHoc) return false;
    // Lấy học kỳ mới nhất (hoặc 1) cho từng học sinh trong danh sách
    const hocKyMap = {};
    for (const maHS of maHocSinhList) {
      const [rows] = await db.execute(
        `SELECT COALESCE(MAX(HocKy), 1) AS HocKy FROM HocBa WHERE MaHocSinh = ? AND NamHoc = ?`,
        [maHS, namHoc]
      );
      hocKyMap[maHS] = rows[0]?.HocKy || 1;
    }
    const promises = maHocSinhList.map(maHS =>
      db.execute(
        `INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, NhanXet)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE NhanXet = VALUES(NhanXet)`,
        [maHS, namHoc, hocKyMap[maHS], nhanXet]
      )
    );
    await Promise.all(promises);
    return true;
  }
}

module.exports = NhanXetHocSinhModel;
