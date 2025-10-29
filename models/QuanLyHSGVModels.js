const db = require('../config/database');

class QLModel {
  // ==================== HỌC SINH ====================
  static async getNamHocList() {
    const [rows] = await db.execute(
      'SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC'
    );
    return rows;
  }

  static async getKhoiList() {
    const [rows] = await db.execute(
      'SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY MaKhoi'
    );
    return rows;
  }

  static async getClassesByKhoi(maKhoi) {
    const [rows] = await db.execute(
      'SELECT MaLop, TenLop FROM Lop WHERE Khoi = ? ORDER BY TenLop',
      [maKhoi]
    );
    return rows;
  }

  static async getStudentList(namHoc, maKhoi, maLop) {
    let sql = `
      SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
             hs.KhoaHoc, l.MaLop, l.TenLop, k.MaKhoi, k.TenKhoi
      FROM HocSinh hs
      JOIN Lop l ON hs.MaLop = l.MaLop
      JOIN Khoi k ON l.Khoi = k.MaKhoi
      WHERE 1=1
    `;
    const params = [];
    if (namHoc) { sql += ' AND hs.KhoaHoc = ?'; params.push(namHoc); }
    if (maKhoi) { sql += ' AND k.MaKhoi = ?'; params.push(maKhoi); }
    if (maLop) { sql += ' AND l.MaLop = ?'; params.push(maLop); }
    sql += ' ORDER BY hs.TenHocSinh ASC';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getStudentById(MaHocSinh) {
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
              hs.MaLop, l.TenLop, l.Khoi
       FROM HocSinh hs
       JOIN Lop l ON hs.MaLop = l.MaLop
       WHERE hs.MaHocSinh = ?`,
      [MaHocSinh]
    );
    return rows[0] || null;
  }

  static async addStudent(data) {
    const {
      MaHocSinh,
      TenHocSinh,
      Birthday,
      GioiTinh,
      MaLop,
      TrangThai,
      KhoaHoc
    } = data;

    await db.execute(
      `INSERT INTO HocSinh 
       (MaHocSinh, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        MaHocSinh,
        TenHocSinh,
        Birthday,
        GioiTinh,
        MaLop,
        TrangThai || 'Đang học',
        KhoaHoc
      ]
    );
  }

  // ========== UPDATE HỌC SINH - CHỈ CẬP NHẬT FIELD HỢP LỆ ==========
  static async updateStudent(MaHocSinh, data) {
    const fields = [];
    const params = [];

    if (data.TenHocSinh) { fields.push('TenHocSinh = ?'); params.push(data.TenHocSinh); }
    if (data.Birthday) { fields.push('Birthday = ?'); params.push(data.Birthday); }
    if (data.GioiTinh) { fields.push('GioiTinh = ?'); params.push(data.GioiTinh); }
    if (data.MaLop) { fields.push('MaLop = ?'); params.push(data.MaLop); }
    if (data.TrangThai) { fields.push('TrangThai = ?'); params.push(data.TrangThai); }
    if (data.KhoaHoc) { fields.push('KhoaHoc = ?'); params.push(data.KhoaHoc); }

    if (fields.length === 0) return; // không có gì để update

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

  // ==================== GIÁO VIÊN ====================
  static async getTeacherList(BoMon, TrangThai) {
    let query = `
      SELECT MaGiaoVien, TenGiaoVien, GioiTinh, NgaySinh, Email, SDT,
             TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai,
             TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong
      FROM GiaoVien WHERE 1=1
    `;
    const params = [];
    if (BoMon) { query += ' AND TenMonHoc LIKE ?'; params.push(`%${BoMon}%`); }
    if (TrangThai) { query += ' AND TrangThai = ?'; params.push(TrangThai); }
    query += ' ORDER BY TenGiaoVien ASC';
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async getMonHocList() {
    const [rows] = await db.execute(
      "SELECT TenMonHoc FROM MonHoc WHERE TrangThai='Đang dạy' ORDER BY TenMonHoc"
    );
    return rows.map(r => r.TenMonHoc);
  }

  static async getTeacherById(MaGiaoVien) {
    const [rows] = await db.execute(
      `SELECT MaGiaoVien, TenGiaoVien, GioiTinh, NgaySinh, Email, SDT,
              TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai,
              TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong
       FROM GiaoVien WHERE MaGiaoVien = ?`,
      [MaGiaoVien]
    );
    return rows[0] || null;
  }

  static async addTeacher(data) {
    const {
      MaGiaoVien,
      TenGiaoVien,
      NgaySinh,
      GioiTinh,
      Email,
      SDT,
      TrinhDoChuyenMon,
      DiaChi,
      NgayVaoTruong,
      TenMonHoc,
      TinhTrangHonNhan,
      ChucVu,
      ThamNien,
      MaTruong,
      TrangThai
    } = data;

    await db.execute(
      `INSERT INTO GiaoVien
       (MaGiaoVien, TenGiaoVien, NgaySinh, GioiTinh, Email, SDT,
        TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai,
        TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaGiaoVien,
        TenGiaoVien,
        NgaySinh,
        GioiTinh,
        Email,
        SDT,
        TrinhDoChuyenMon,
        DiaChi,
        NgayVaoTruong,
        TrangThai || 'Đang công tác',
        TenMonHoc,
        TinhTrangHonNhan,
        ChucVu,
        ThamNien,
        MaTruong
      ]
    );
  }

  // ========== UPDATE GIÁO VIÊN - CHỈ CẬP NHẬT FIELD HỢP LỆ ==========
  static async updateTeacher(MaGiaoVien, data) {
    const fields = [];
    const params = [];

    if (data.TenGiaoVien) fields.push('TenGiaoVien = ?'), params.push(data.TenGiaoVien);
    if (data.NgaySinh) fields.push('NgaySinh = ?'), params.push(data.NgaySinh);
    if (data.GioiTinh) fields.push('GioiTinh = ?'), params.push(data.GioiTinh);
    if (data.Email) fields.push('Email = ?'), params.push(data.Email);
    if (data.SDT) fields.push('SDT = ?'), params.push(data.SDT);
    if (data.TrinhDoChuyenMon) fields.push('TrinhDoChuyenMon = ?'), params.push(data.TrinhDoChuyenMon);
    if (data.DiaChi) fields.push('DiaChi = ?'), params.push(data.DiaChi);
    if (data.NgayVaoTruong) fields.push('NgayVaoTruong = ?'), params.push(data.NgayVaoTruong);
    if (data.TrangThai) fields.push('TrangThai = ?'), params.push(data.TrangThai);
    if (data.TenMonHoc) fields.push('TenMonHoc = ?'), params.push(data.TenMonHoc);
    if (data.TinhTrangHonNhan) fields.push('TinhTrangHonNhan = ?'), params.push(data.TinhTrangHonNhan);
    if (data.ChucVu) fields.push('ChucVu = ?'), params.push(data.ChucVu);
    if (data.ThamNien) fields.push('ThamNien = ?'), params.push(data.ThamNien);
    if (data.MaTruong) fields.push('MaTruong = ?'), params.push(data.MaTruong);

    if (fields.length === 0) return;

    const sql = `UPDATE GiaoVien SET ${fields.join(', ')} WHERE MaGiaoVien = ?`;
    params.push(MaGiaoVien);

    await db.execute(sql, params);
  }

  static async deleteTeacher(MaGiaoVien) {
    await db.execute(
      `UPDATE GiaoVien SET TrangThai = 'Nghỉ việc' WHERE MaGiaoVien = ?`,
      [MaGiaoVien]
    );
  }
}

module.exports = QLModel;
