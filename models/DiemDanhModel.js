const db = require('../config/database');

class DiemDanhModel {
  static async getCurrentNamHoc() {
    const [rows] = await db.execute(
      `SELECT NamHoc FROM HocKy WHERE TrangThai = 'Đang học' ORDER BY NamHoc DESC LIMIT 1`
    );
    return rows[0]?.NamHoc || null;
  }

  // Danh sách lớp có lịch dạy trong ngày cho giáo viên bộ môn
  static async getClassesToday(maGV, namHoc, ngayISO) {
    if (!maGV || !namHoc || !ngayISO) return [];
    const [rows] = await db.execute(
      `SELECT DISTINCT l.MaLop, l.TenLop, t.TietHoc, t.TenMonHoc
       FROM ThoiKhoaBieu t
       JOIN Lop l ON l.MaLop = t.MaLop
       WHERE t.MaGiaoVien = ?
         AND t.NamHoc = ?
         AND t.Ngay = ?
         AND l.TrangThai = 'Đang học'
       ORDER BY l.TenLop, t.TietHoc`,
      [maGV, namHoc, ngayISO]
    );
    return rows;
  }

  static async getStudentsByClass(maLop, namHoc, ngayISO = null, tietHoc = null, tenMonHoc = null) {
    if (!maLop || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh, hs.Birthday, hs.TrangThai, hs.KhoaHoc, hs.MaLop,
              dd.TrangThai AS DiemDanh
       FROM HocSinh hs
       LEFT JOIN DiemDanh dd
         ON dd.MaHocSinh = hs.MaHocSinh
        AND (? IS NOT NULL AND dd.Ngay = ?)
        AND (? IS NOT NULL AND dd.Tiet = ?)
        AND (? IS NOT NULL AND dd.TenMonHoc = ?)
       WHERE hs.MaLop = ? AND hs.KhoaHoc = ? AND hs.TrangThai = 'Đang học'
       ORDER BY hs.TenHocSinh`,
      [ngayISO, ngayISO, tietHoc, tietHoc, tenMonHoc, tenMonHoc, maLop, namHoc]
    );
    return rows;
  }

  static async saveAttendance({ maLop, tenMonHoc, ngayISO, tietHoc, records = [] }) {
    if (!tenMonHoc || !ngayISO || !tietHoc || !records.length) return false;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const rec of records) {
        if (!rec.TrangThai) continue;
        const status = ['k', 'v', 'p'].includes((rec.TrangThai || '').toLowerCase())
          ? rec.TrangThai.toLowerCase()
          : null;
        if (!status) continue;
        // Kiểm tra xem đã có bản ghi cùng ngày + tiết cho học sinh chưa
        const [exist] = await conn.execute(
          `SELECT 1 FROM DiemDanh WHERE MaHocSinh = ? AND Ngay = ? AND Tiet = ? LIMIT 1`,
          [rec.MaHocSinh, ngayISO, tietHoc]
        );
        if (exist.length) {
          await conn.execute(
            `UPDATE DiemDanh
             SET TrangThai = ?, TenMonHoc = ?
             WHERE MaHocSinh = ? AND Ngay = ? AND Tiet = ?`,
            [status, tenMonHoc, rec.MaHocSinh, ngayISO, tietHoc]
          );
        } else {
          await conn.execute(
            `INSERT INTO DiemDanh (MaHocSinh, TenMonHoc, Ngay, TrangThai, Tiet)
             VALUES (?, ?, ?, ?, ?)`,
            [rec.MaHocSinh, tenMonHoc, ngayISO, status, tietHoc]
          );
        }
      }
      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteAttendance({ ngayISO, tietHoc, maHocSinhList = [] }) {
    if (!ngayISO || !tietHoc || !maHocSinhList.length) return false;
    await db.execute(
      `DELETE FROM DiemDanh
       WHERE Ngay = ? AND Tiet = ? AND MaHocSinh IN (${maHocSinhList.map(() => '?').join(',')})`,
      [ngayISO, tietHoc, ...maHocSinhList]
    );
    return true;
  }
}

module.exports = DiemDanhModel;
