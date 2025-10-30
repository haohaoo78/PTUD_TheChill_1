const db = require('../config/database');

class QLModel {
  // NĂM HỌC
  static async getNamHocList() {
    const [rows] = await db.execute(
      'SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC'
    );
    return rows;
  }

  // GIÁO VIÊN CHỦ NHIỆM
  static async getTeacherList(namHoc) {
    let sql = `
      SELECT DISTINCT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GVChuNhiem gvc
      JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
    `;
    const params = [];
    if (namHoc) { sql += ' WHERE gvc.NamHoc = ?'; params.push(namHoc); }
    sql += ' ORDER BY gv.TenGiaoVien';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  // LẤY LỚP THEO GIÁO VIÊN, NĂM HỌC, CÓ THỂ LỌC THEO MÃ LỚP
  static async getClasses(maGiaoVien, namHoc, maLop) {
    if (!namHoc) return []; // bắt buộc năm học

    let sql = `
      SELECT l.MaLop, l.TenLop
      FROM Lop l
      JOIN GVChuNhiem gvc ON l.MaLop = gvc.MaLop
      WHERE gvc.NamHoc = ?
    `;
    const params = [namHoc];

    if (maGiaoVien) {
      sql += ' AND gvc.MaGVCN = ?';
      params.push(maGiaoVien);
    }

    sql += ' ORDER BY l.TenLop';
    const [rows] = await db.execute(sql, params);

    if (maLop) {
      return rows.filter(l => l.MaLop === maLop);
    }
    return rows;
  }

  // HỌC SINH
  static async getStudentList(maLop, namHoc) {
    if (!namHoc) return [];
    let sql = `
      SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
             l.MaLop, l.TenLop
      FROM HocSinh hs
      JOIN Lop l ON hs.MaLop = l.MaLop
      WHERE hs.KhoaHoc = ?
    `;
    const params = [namHoc];
    if (maLop) { sql += ' AND l.MaLop = ?'; params.push(maLop); }
    sql += ' ORDER BY hs.TenHocSinh ASC';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getStudentById(MaHocSinh) {
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
              hs.MaLop, l.TenLop
       FROM HocSinh hs
       JOIN Lop l ON hs.MaLop = l.MaLop
       WHERE hs.MaHocSinh = ?`,
      [MaHocSinh]
    );
    return rows[0] || null;
  }

  static async addStudent(data) {
    const { MaHocSinh, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc } = data;
    await db.execute(
      `INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [MaHocSinh, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai || 'Đang học', KhoaHoc]
    );
  }

  static async updateStudent(MaHocSinh, data) {
    const fields = [];
    const params = [];
    if (data.TenHocSinh) fields.push('TenHocSinh = ?'), params.push(data.TenHocSinh);
    if (data.Birthday) fields.push('Birthday = ?'), params.push(data.Birthday);
    if (data.GioiTinh) fields.push('GioiTinh = ?'), params.push(data.GioiTinh);
    if (data.MaLop) fields.push('MaLop = ?'), params.push(data.MaLop);
    if (data.TrangThai) fields.push('TrangThai = ?'), params.push(data.TrangThai);
    if (data.KhoaHoc) fields.push('KhoaHoc = ?'), params.push(data.KhoaHoc);
    if (fields.length === 0) return;
    const sql = `UPDATE HocSinh SET ${fields.join(', ')} WHERE MaHocSinh = ?`;
    params.push(MaHocSinh);
    await db.execute(sql, params);
  }

  static async deleteStudent(MaHocSinh) {
    await db.execute(
      `UPDATE HocSinh SET TrangThai = 'Ngưng học' WHERE MaHocSinh = ?`,
      [MaHocSinh]
    );
  }

  // TRƯỜNG
  static async getTruongList() {
    const [rows] = await db.execute(
      'SELECT MaTruong, TenTruong FROM Truong ORDER BY TenTruong'
    );
    return rows;
  }
  // Hạnh kiểm / Rèn luyện
static async getHocBa(maHS, namHoc, hocKy) {
  const [rows] = await db.execute(
    `SELECT HanhKiem, RenLuyen 
     FROM HocBa 
     WHERE MaHocSinh = ? AND NamHoc = ? AND HocKy = ?`,
    [maHS, namHoc, hocKy]
  );
  return rows[0] || null;
}

static async updateHocBa(maHS, namHoc, hocKy, data) {
  const fields = [];
  const params = [];
  if (data.HanhKiem) fields.push('HanhKiem = ?'), params.push(data.HanhKiem);
  if (data.RenLuyen) fields.push('RenLuyen = ?'), params.push(data.RenLuyen);
  if (fields.length === 0) return;
  const sql = `UPDATE HocBa SET ${fields.join(', ')} WHERE MaHocSinh = ? AND NamHoc = ? AND HocKy = ?`;
  params.push(maHS, namHoc, hocKy);
  await db.execute(sql, params);
}

}

module.exports = QLModel;
