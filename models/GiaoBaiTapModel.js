const db = require('../config/database');

class GiaoBaiTapModel {
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
       WHERE g.MaGVBM = ? AND g.NamHoc = ?
       ORDER BY l.TenLop`,
      [maGV, namHoc]
    );
    return rows;
  }

  static async getAssignmentsByClass(maLop, maGV) {
    if (!maLop || !maGV) return [];
    const [rows] = await db.execute(
      `SELECT MaBaiTap, NoiDung, NgayGiao, NgayHetHan, MaLop, MaGiaoVien
       FROM BaiTap
       WHERE MaLop = ? AND MaGiaoVien = ?
       ORDER BY MaBaiTap`,
      [maLop, maGV]
    );
    return rows;
  }

  static async _generateNewId() {
    const [rows] = await db.execute(
      `SELECT MaBaiTap FROM BaiTap ORDER BY MaBaiTap DESC LIMIT 1`
    );
    const last = rows[0]?.MaBaiTap || 'BT000';
    const num = parseInt(last.replace(/[^0-9]/g, ''), 10) || 0;
    const next = num + 1;
    return `BT${next.toString().padStart(3, '0')}`;
  }

  static async createAssignment({ NoiDung, NgayHetHan, MaLop, MaGiaoVien, NgayGiao }) {
    const id = await this._generateNewId();
    await db.execute(
      `INSERT INTO BaiTap (MaBaiTap, NoiDung, NgayGiao, NgayHetHan, MaLop, MaGiaoVien)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, NoiDung, NgayGiao, NgayHetHan, MaLop, MaGiaoVien]
    );
    return id;
  }

  static async updateAssignment(maBaiTap, maGV, { NoiDung, NgayHetHan }) {
    const [result] = await db.execute(
      `UPDATE BaiTap
       SET NoiDung = ?, NgayHetHan = ?
       WHERE MaBaiTap = ? AND MaGiaoVien = ?`,
      [NoiDung, NgayHetHan, maBaiTap, maGV]
    );
    return result.affectedRows > 0;
  }

  static async getAssignmentById(maBaiTap, maGV) {
    if (!maBaiTap || !maGV) return null;
    const [rows] = await db.execute(
      `SELECT MaBaiTap, NoiDung, NgayGiao, NgayHetHan, MaLop, MaGiaoVien
       FROM BaiTap
       WHERE MaBaiTap = ? AND MaGiaoVien = ?
       LIMIT 1`,
      [maBaiTap, maGV]
    );
    return rows[0] || null;
  }
}

module.exports = GiaoBaiTapModel;
