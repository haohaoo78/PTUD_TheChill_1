// models/QLModel.js
const db = require('../config/database');

class QLModel {
  // ==================== HỌC SINH ====================

  static async getNamHocList() {
    const [rows] = await db.execute(
      'SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC'
    );
    return rows.map(r => r.NamHoc);
  }

  static async getKhoiList() {
    const [rows] = await db.execute(
      'SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY MaKhoi'
    );
    return rows;
  }

  static async getClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute(
      'SELECT MaLop, TenLop FROM Lop WHERE Khoi = ? ORDER BY TenLop',
      [MaKhoi]
    );
    return rows;
  }

  static async getStudentList() {
    const sql = `
      SELECT 
        hs.MaHocSinh,
        hs.TenHocSinh,
        hs.Birthday,
        hs.GioiTinh,
        hs.TrangThai,
        hs.KhoaHoc,
        l.MaLop,
        l.TenLop,
        k.MaKhoi,
        k.TenKhoi
      FROM HocSinh hs
      JOIN Lop l ON hs.MaLop = l.MaLop
      JOIN Khoi k ON l.Khoi = k.MaKhoi
      ORDER BY hs.TenHocSinh ASC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  }

  static async getStudentById(MaHS) {
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
              hs.MaLop, l.TenLop, l.Khoi
       FROM HocSinh hs
       JOIN Lop l ON hs.MaLop = l.MaLop
       WHERE hs.MaHocSinh = ?`,
      [MaHS]
    );
    return rows[0] || null;
  }

  static async addStudent(data) {
    const { MaHS, TenHS, NgaySinh, GioiTinh, MaLop, TrangThai, KhoaHoc } = data;
    await db.execute(
      `INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [MaHS, TenHS, NgaySinh, GioiTinh, MaLop, TrangThai || 'Đang học', KhoaHoc]
    );
  }

  static async updateStudent(MaHS, data) {
    const { TenHS, NgaySinh, GioiTinh, MaLop, TrangThai, KhoaHoc } = data;
    await db.execute(
      `UPDATE HocSinh
       SET TenHocSinh = ?, Birthday = ?, GioiTinh = ?, MaLop = ?, TrangThai = ?, KhoaHoc = ?
       WHERE MaHocSinh = ?`,
      [TenHS, NgaySinh, GioiTinh, MaLop, TrangThai, KhoaHoc, MaHS]
    );
  }

  static async deleteStudent(MaHS) {
    await db.execute(
      `UPDATE HocSinh SET TrangThai = 'Ngưng học' WHERE MaHocSinh = ?`,
      [MaHS]
    );
  }

  // ==================== GIÁO VIÊN ====================

  static async getTeacherList(BoMon, TrangThai) {
    let query = `
      SELECT MaGiaoVien, TenGiaoVien, GioiTinh, NgaySinh, Email, SDT,
             TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai,
             TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong
      FROM GiaoVien WHERE 1=1
    `;
    const params = [];

    if (BoMon) {
      query += ' AND TenMonHoc = ?';
      params.push(BoMon);
    }
    if (TrangThai) {
      query += ' AND TrangThai = ?';
      params.push(TrangThai);
    }

    query += ' ORDER BY TenGiaoVien ASC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async getTeacherById(MaGV) {
    const [rows] = await db.execute(
      `SELECT MaGiaoVien, TenGiaoVien, GioiTinh, NgaySinh, Email, SDT,
              TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai,
              TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong
       FROM GiaoVien WHERE MaGiaoVien = ?`,
      [MaGV]
    );
    return rows[0] || null;
  }

  static async addTeacher(data) {
    const {
      MaGV, TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
      DiaChi, NgayVaoTruong, TenMonHoc, TinhTrangHonNhan,
      ChucVu, ThamNien, MaTruong, TrangThai
    } = data;

    await db.execute(
      `INSERT INTO GiaoVien 
       (MaGiaoVien, TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
        DiaChi, NgayVaoTruong, TrangThai, TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaGV, TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
        DiaChi, NgayVaoTruong, TrangThai || 'Đang công tác', TenMonHoc,
        TinhTrangHonNhan, ChucVu, ThamNien, MaTruong
      ]
    );
  }

  static async updateTeacher(MaGV, data) {
    const {
      TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
      DiaChi, NgayVaoTruong, TrangThai, TenMonHoc, TinhTrangHonNhan,
      ChucVu, ThamNien, MaTruong
    } = data;

    await db.execute(
      `UPDATE GiaoVien
       SET TenGiaoVien = ?, NgaySinh = ?, GioiTinh = ?, Email = ?, SDT = ?, TrinhDoChuyenMon = ?,
           DiaChi = ?, NgayVaoTruong = ?, TrangThai = ?, TenMonHoc = ?, 
           TinhTrangHonNhan = ?, ChucVu = ?, ThamNien = ?, MaTruong = ?
       WHERE MaGiaoVien = ?`,
      [
        TenGiaoVien, NgaySinh, GioiTinh, Email, SDT, TrinhDoChuyenMon,
        DiaChi, NgayVaoTruong, TrangThai, TenMonHoc,
        TinhTrangHonNhan, ChucVu, ThamNien, MaTruong, MaGV
      ]
    );
  }

  static async deleteTeacher(MaGV) {
    await db.execute(
      `UPDATE GiaoVien SET TrangThai = 'Nghỉ việc' WHERE MaGiaoVien = ?`,
      [MaGV]
    );
  }
}

module.exports = QLModel;
