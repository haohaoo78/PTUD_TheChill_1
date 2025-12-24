const db = require('../config/database');

class QuanLyDiemMonHocModel {
  static async recalcTrungBinhMon(conn, { maHocSinh, tenMonHoc, namHoc, hocKi }) {
    if (!maHocSinh || !tenMonHoc || !namHoc || !hocKi) return;
    await conn.execute(
      `UPDATE Diem
       SET TrungBinhMon = ROUND(
         (ThuongXuyen1 + ThuongXuyen2 + ThuongXuyen3
          + Diem15_1 + Diem15_2
          + GK * 2 + CK * 3) / 10, 2
       )
       WHERE MaHocSinh = ? AND TenMonHoc = ? AND NamHoc = ? AND HocKi = ?
         AND ThuongXuyen1 IS NOT NULL
         AND ThuongXuyen2 IS NOT NULL
         AND ThuongXuyen3 IS NOT NULL
         AND Diem15_1 IS NOT NULL
         AND Diem15_2 IS NOT NULL
         AND GK IS NOT NULL
         AND CK IS NOT NULL`,
      [maHocSinh, tenMonHoc, namHoc, hocKi]
    );
  }

  static async getCurrentNamHoc() {
    const [rows] = await db.execute(
      `SELECT NamHoc
       FROM HocKy
       WHERE TrangThai = 'Đang học'
       ORDER BY NamHoc DESC
       LIMIT 1`
    );
    return rows[0]?.NamHoc || null;
  }

  static async getCurrentHocKy(namHoc) {
    if (!namHoc) return null;
    const [rows] = await db.execute(
      `SELECT KyHoc
       FROM HocKy
       WHERE NamHoc = ? AND TrangThai = 'Đang học'
       ORDER BY KyHoc
       LIMIT 1`,
      [namHoc]
    );
    return rows[0]?.KyHoc || null;
  }

  static async getCurrentNamHocKyHoc() {
    const [rows] = await db.execute(
      `SELECT NamHoc, KyHoc
       FROM HocKy
       WHERE TrangThai = 'Đang học'
       ORDER BY NamHoc DESC, KyHoc
       LIMIT 1`
    );
    return rows[0] || null;
  }

  static async getClassesByTeacher(maGVBM, namHoc) {
    if (!maGVBM || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT DISTINCT l.MaLop, l.TenLop
       FROM GVBOMON g
       JOIN Lop l ON l.MaLop = g.MaLop
       WHERE g.MaGVBM = ? AND g.NamHoc = ? AND l.TrangThai = 'Đang học'
       ORDER BY l.TenLop`,
      [maGVBM, namHoc]
    );
    return rows;
  }

  static async getStudentsByClass(maLop, namHoc) {
    if (!maLop || !namHoc) return [];
    const [rows] = await db.execute(
      `SELECT MaHocSinh, TenHocSinh, Birthday, GioiTinh, TrangThai, MaLop, KhoaHoc
       FROM HocSinh
       WHERE MaLop = ? AND KhoaHoc = ? AND TrangThai = 'Đang học'
       ORDER BY TenHocSinh`,
      [maLop, namHoc]
    );
    return rows;
  }

  static async getSubjectByTeacherClass(maGVBM, maLop, namHoc, hocKy) {
    if (!maGVBM || !maLop || !namHoc || !hocKy) return null;
    const [rows] = await db.execute(
      `SELECT BoMon
       FROM GVBOMON
       WHERE MaGVBM = ? AND MaLop = ? AND NamHoc = ? AND HocKy = ?
       LIMIT 1`,
      [maGVBM, maLop, namHoc, hocKy]
    );
    return rows[0]?.BoMon || null;
  }

  static async getTeacherSchoolId(maGiaoVien) {
    if (!maGiaoVien) return null;
    const [rows] = await db.execute(
      `SELECT MaTruong FROM GiaoVien WHERE MaGiaoVien = ? LIMIT 1`,
      [maGiaoVien]
    );
    return rows[0]?.MaTruong || null;
  }

  static async getPrincipalIdBySchoolId(maTruong) {
    if (!maTruong) return null;
    const [rows] = await db.execute(
      `SELECT MaHieuTruong FROM HieuTruong WHERE MaTruong = ? LIMIT 1`,
      [maTruong]
    );
    return rows[0]?.MaHieuTruong || null;
  }

  static async getNextRequestId() {
    const [rows] = await db.execute(`SELECT MAX(MaYeuCau) AS MaxId FROM YeuCauSuaDiem`);
    const maxId = rows[0]?.MaxId || null;
    if (!maxId) return 'YC001';
    const match = String(maxId).match(/^YC(\d+)$/i);
    const num = match ? parseInt(match[1], 10) : 0;
    const next = num + 1;
    return `YC${String(next).padStart(3, '0')}`;
  }

  static async getOldScoreByType({ maHocSinh, tenMonHoc, namHoc, hocKi, loaiDiem }) {
    if (!maHocSinh || !tenMonHoc || !namHoc || !hocKi || !loaiDiem) return null;
    const columnMap = {
      ThuongXuyen1: 'ThuongXuyen1',
      ThuongXuyen2: 'ThuongXuyen2',
      ThuongXuyen3: 'ThuongXuyen3',
      Diem15_1: 'Diem15_1',
      Diem15_2: 'Diem15_2',
      GK: 'GK',
      CK: 'CK'
    };
    const col = columnMap[loaiDiem];
    if (!col) return null;

    const [rows] = await db.execute(
      `SELECT ${col} AS DiemCu
       FROM Diem
       WHERE MaHocSinh = ? AND TenMonHoc = ? AND NamHoc = ? AND HocKi = ?
       LIMIT 1`,
      [maHocSinh, tenMonHoc, namHoc, hocKi]
    );
    return rows[0]?.DiemCu ?? null;
  }

  static async insertYeuCauSuaDiem({
    maYeuCau,
    maHocSinh,
    mon,
    namHoc,
    hocKi,
    loaiDiem,
    diemCu,
    diemMoi,
    lyDo,
    minhChung,
    maHieuTruong,
    maGiaoVien
  }) {
    await db.execute(
      `INSERT INTO YeuCauSuaDiem
        (MaYeuCau, MaHocSinh, Mon, NamHoc, HocKi, LoaiDiem, DiemCu, DiemMoi, LyDo, MinhChung, MaHieuTruong, MaGiaoVien, TrangThai, GhiChu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DangXuLy', NULL)`,
      [
        maYeuCau,
        maHocSinh,
        mon,
        namHoc,
        hocKi,
        loaiDiem,
        diemCu,
        diemMoi,
        lyDo,
        minhChung,
        maHieuTruong,
        maGiaoVien
      ]
    );
  }

  static async getStudentsByClassWithScores(maLop, namHoc, hocKi, tenMonHoc) {
    if (!maLop || !namHoc || !hocKi || !tenMonHoc) return [];
    const [rows] = await db.execute(
      `SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai, hs.MaLop, hs.KhoaHoc,
              d.ThuongXuyen1, d.ThuongXuyen2, d.ThuongXuyen3, d.Diem15_1, d.Diem15_2, d.GK, d.CK, d.TrungBinhMon,
              CASE WHEN d.MaHocSinh IS NULL THEN 0 ELSE 1 END AS HasScore
       FROM HocSinh hs
       LEFT JOIN Diem d
         ON d.MaHocSinh = hs.MaHocSinh
        AND d.TenMonHoc = ?
        AND d.NamHoc = ?
        AND d.HocKi = ?
       WHERE hs.MaLop = ? AND hs.TrangThai = 'Đang học'
       ORDER BY hs.TenHocSinh`,
      [tenMonHoc, namHoc, hocKi, maLop]
    );
    return rows;
  }

  static async getExistingScoreStudents({ tenMonHoc, namHoc, hocKi, maHocSinhList }) {
    if (!tenMonHoc || !namHoc || !hocKi) return [];
    if (!Array.isArray(maHocSinhList) || maHocSinhList.length === 0) return [];
    const placeholders = maHocSinhList.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT MaHocSinh
       FROM Diem
       WHERE TenMonHoc = ? AND NamHoc = ? AND HocKi = ? AND MaHocSinh IN (${placeholders})`,
      [tenMonHoc, namHoc, hocKi, ...maHocSinhList]
    );
    return rows.map(r => r.MaHocSinh);
  }

  static async insertScoresBulk({ tenMonHoc, namHoc, hocKi, scores }) {
    if (!tenMonHoc || !namHoc || !hocKi) throw new Error('Thiếu thông tin môn/năm học/học kỳ');
    if (!Array.isArray(scores)) throw new Error('Dữ liệu điểm không hợp lệ');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let processed = 0;

      for (const item of scores) {
        const maHocSinh = item?.maHocSinh;
        if (!maHocSinh) continue;

        const values = [
          maHocSinh,
          tenMonHoc,
          namHoc,
          hocKi,
          item.ThuongXuyen1 ?? null,
          item.ThuongXuyen2 ?? null,
          item.ThuongXuyen3 ?? null,
          item.Diem15_1 ?? null,
          item.Diem15_2 ?? null,
          item.GK ?? null,
          item.CK ?? null
        ];

        await conn.execute(
          `INSERT INTO Diem (
             MaHocSinh, TenMonHoc, NamHoc, HocKi,
             ThuongXuyen1, ThuongXuyen2, ThuongXuyen3,
             Diem15_1, Diem15_2, GK, CK
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );
        await QuanLyDiemMonHocModel.recalcTrungBinhMon(conn, { maHocSinh, tenMonHoc, namHoc, hocKi });
        processed += 1;
      }

      await conn.commit();
      return processed;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async supplementScoresBulk({ tenMonHoc, namHoc, hocKi, scores }) {
    if (!tenMonHoc || !namHoc || !hocKi) throw new Error('Thiếu thông tin môn/năm học/học kỳ');
    if (!Array.isArray(scores)) throw new Error('Dữ liệu điểm không hợp lệ');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let processed = 0;

      for (const item of scores) {
        const maHocSinh = item?.maHocSinh;
        if (!maHocSinh) continue;

        const values = [
          maHocSinh,
          tenMonHoc,
          namHoc,
          hocKi,
          item.ThuongXuyen1 ?? null,
          item.ThuongXuyen2 ?? null,
          item.ThuongXuyen3 ?? null,
          item.Diem15_1 ?? null,
          item.Diem15_2 ?? null,
          item.GK ?? null,
          item.CK ?? null
        ];

        await conn.execute(
          `INSERT INTO Diem (
             MaHocSinh, TenMonHoc, NamHoc, HocKi,
             ThuongXuyen1, ThuongXuyen2, ThuongXuyen3,
             Diem15_1, Diem15_2, GK, CK
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             ThuongXuyen1 = IF(ThuongXuyen1 IS NULL, VALUES(ThuongXuyen1), ThuongXuyen1),
             ThuongXuyen2 = IF(ThuongXuyen2 IS NULL, VALUES(ThuongXuyen2), ThuongXuyen2),
             ThuongXuyen3 = IF(ThuongXuyen3 IS NULL, VALUES(ThuongXuyen3), ThuongXuyen3),
             Diem15_1 = IF(Diem15_1 IS NULL, VALUES(Diem15_1), Diem15_1),
             Diem15_2 = IF(Diem15_2 IS NULL, VALUES(Diem15_2), Diem15_2),
             GK = IF(GK IS NULL, VALUES(GK), GK),
             CK = IF(CK IS NULL, VALUES(CK), CK)`,
          values
        );
        await QuanLyDiemMonHocModel.recalcTrungBinhMon(conn, { maHocSinh, tenMonHoc, namHoc, hocKi });
        processed += 1;
      }

      await conn.commit();
      return processed;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async upsertScoresBulk({ tenMonHoc, namHoc, hocKi, scores }) {
    if (!tenMonHoc || !namHoc || !hocKi) throw new Error('Thiếu thông tin môn/năm học/học kỳ');
    if (!Array.isArray(scores)) throw new Error('Dữ liệu điểm không hợp lệ');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let processed = 0;

      for (const item of scores) {
        const maHocSinh = item?.maHocSinh;
        if (!maHocSinh) continue;

        const values = [
          maHocSinh,
          tenMonHoc,
          namHoc,
          hocKi,
          item.ThuongXuyen1 ?? null,
          item.ThuongXuyen2 ?? null,
          item.ThuongXuyen3 ?? null,
          item.Diem15_1 ?? null,
          item.Diem15_2 ?? null,
          item.GK ?? null,
          item.CK ?? null
        ];

        await conn.execute(
          `INSERT INTO Diem (
             MaHocSinh, TenMonHoc, NamHoc, HocKi,
             ThuongXuyen1, ThuongXuyen2, ThuongXuyen3,
             Diem15_1, Diem15_2, GK, CK
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             ThuongXuyen1 = COALESCE(VALUES(ThuongXuyen1), ThuongXuyen1),
             ThuongXuyen2 = COALESCE(VALUES(ThuongXuyen2), ThuongXuyen2),
             ThuongXuyen3 = COALESCE(VALUES(ThuongXuyen3), ThuongXuyen3),
             Diem15_1 = COALESCE(VALUES(Diem15_1), Diem15_1),
             Diem15_2 = COALESCE(VALUES(Diem15_2), Diem15_2),
             GK = COALESCE(VALUES(GK), GK),
             CK = COALESCE(VALUES(CK), CK)`,
          values
        );
        await QuanLyDiemMonHocModel.recalcTrungBinhMon(conn, { maHocSinh, tenMonHoc, namHoc, hocKi });
        processed += 1;
      }

      await conn.commit();
      return processed;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = QuanLyDiemMonHocModel;