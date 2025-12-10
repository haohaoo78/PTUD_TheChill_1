// models/PhanCongChuNhiemBoMonModel.js
const db = require('../config/database');

class PhanCongModel {

  // =======================
  // 1. HỌC KỲ – NĂM HỌC
  // =======================
  static async getNamHocList() {
    const [rows] = await db.execute(`SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC`);
    return rows.map(r => r.NamHoc);
  }

  static async getKyHocList(namHoc) {
    const [rows] = await db.execute(`
      SELECT KyHoc, NgayBatDau, NgayKetThuc, TrangThai
      FROM HocKy
      WHERE NamHoc = ?
      ORDER BY KyHoc
    `, [namHoc]);
    return rows;
  }

  static async getHocKyStatus(namHoc, kyHoc) {
    const [rows] = await db.execute(`
      SELECT TrangThai
      FROM HocKy
      WHERE NamHoc = ? AND KyHoc = ?
    `, [namHoc, kyHoc]);
    return rows[0]?.TrangThai || null;
  }

  // =======================
  // 2. KHỐI – LỚP
  // =======================
  static async getKhoiList() {
    const [rows] = await db.execute(`SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY TenKhoi`);
    return rows;
  }

  static async getClassesByNamHoc(namHoc) {
    const [rows] = await db.execute(`
      SELECT l.MaLop, l.TenLop,
             COALESCE(gv.MaGiaoVien, '') AS MaGVCN,
             COALESCE(gv.TenGiaoVien, '') AS TenGVCN
      FROM Lop l
      LEFT JOIN GVChuNhiem gvc
          ON l.MaLop = gvc.MaLop AND gvc.NamHoc = ?
      LEFT JOIN GiaoVien gv
          ON gvc.MaGVCN = gv.MaGiaoVien
      ORDER BY l.TenLop
    `, [namHoc]);
    return rows;
  }

  static async getGVCNByClass(maLop, namHoc) {
    const nH = namHoc || '2025-2026'; // Use default if undefined
    const [rows] = await db.execute(`
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GVChuNhiem gvc
      JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
      WHERE gvc.MaLop = ? AND gvc.NamHoc = ?
    `, [maLop, nH]);
    return rows[0] || null;
  }

  static async getAvailableTeachersForChunhiem(namHoc, maLop) {
    let sql = `
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GiaoVien gv
      WHERE gv.TrangThai = 'Đang công tác'
    `;
    const params = [];

    if (maLop) {
      sql += `
        AND (gv.MaGiaoVien NOT IN (
              SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ?
             )
             OR gv.MaGiaoVien IN (
              SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ? AND MaLop = ?
             ))
      `;
      params.push(namHoc, namHoc, maLop);
    } else {
      sql += `
        AND gv.MaGiaoVien NOT IN (
          SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ?
        )
      `;
      params.push(namHoc);
    }

    sql += ` ORDER BY gv.TenGiaoVien`;

    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async assignChunhiem(maLop, namHoc, maGVCN) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?`,
        [maLop, namHoc]
      );

      await conn.execute(
        `INSERT INTO GVChuNhiem (MaGVCN, MaLop, NamHoc)
         VALUES (?, ?, ?)`,
        [maGVCN, maLop, namHoc]
      );

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteChunhiem(maLop, namHoc) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?`,
        [maLop, namHoc]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // =======================
  // 3. PHÂN CÔNG BỘ MÔN
  // =======================

  static async getSubjectsByKhoi(maKhoi) {
    const [rows] = await db.execute(`
      SELECT TenMonHoc
      FROM MonHoc
      WHERE Khoi = ?
      ORDER BY TenMonHoc
    `, [maKhoi]);
    return rows.map(r => r.TenMonHoc);
  }

  static async getClassesByKhoi(maKhoi) {
    const [rows] = await db.execute(`
      SELECT MaLop, TenLop
      FROM Lop
      WHERE Khoi = ?
      ORDER BY TenLop
    `, [maKhoi]);
    return rows;
  }

  static async getTeachersBySubject(tenMonHoc, namHoc = null, kyHoc = null) {
    const [rows] = await db.execute(`
      SELECT gv.MaGiaoVien, gv.TenGiaoVien, gv.TenMonHoc
      FROM GiaoVien gv
      WHERE (TRIM(gv.TenMonHoc) = TRIM(?) OR gv.TenMonHoc LIKE CONCAT('%', ?, '%'))
        AND gv.TrangThai = 'Đang công tác'
      ORDER BY gv.TenGiaoVien
    `, [tenMonHoc, tenMonHoc]);
    for (let row of rows) {
      row.load = await this.getTeacherWeeklyLoad(row.MaGiaoVien, namHoc, kyHoc);
      row.remaining = 40 - row.load;
    }
    return rows.filter(r => r.remaining > 0);
  }

  // Lấy tổng số tiết 1 GV dạy trong TKB
  static async getTeacherWeeklyLoad(maGiaoVien, namHoc, kyHoc) {
    // Use defaults if undefined to avoid SQL NULL bind errors
    const nH = namHoc || '2025-2026';
    const kH = kyHoc || '1';
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS SoTietTuan
      FROM ThoiKhoaBieu
      WHERE MaGiaoVien = ?
        AND NamHoc = ?
        AND KyHoc = ?
    `, [maGiaoVien, nH, kH]);
    return rows[0]?.SoTietTuan || 0;
  }

  // Số tiết của môn trong 1 lớp
  static async getSubjectWeeklyCountForClass(maLop, namHoc, kyHoc, tenMonHoc) {
    // Use defaults if undefined to avoid SQL NULL bind errors
    const nH = namHoc || '2025-2026';
    const kH = kyHoc || '1';
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS SoTietTuan
      FROM ThoiKhoaBieu
      WHERE MaLop = ?
        AND NamHoc = ?
        AND KyHoc = ?
        AND TenMonHoc = ?
    `, [maLop, nH, kH, tenMonHoc]);
    return rows[0]?.SoTietTuan || 0;
  }

  static async assignBoMonForTeacher(maGiaoVien, classList, namHoc, kyHoc, tenMonHoc) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Validate inputs
      if (!maGiaoVien || !classList.length || !namHoc || !kyHoc || !tenMonHoc) {
        await conn.rollback();
        return { success: false, message: 'Thiếu thông tin phân công.' };
      }

      // Get current load from ThoiKhoaBieu
      const [loadRows] = await conn.execute(`
        SELECT COUNT(*) AS SoTiet
        FROM ThoiKhoaBieu
        WHERE MaGiaoVien = ? AND NamHoc = ? AND KyHoc = ?
      `, [maGiaoVien, namHoc, kyHoc]);
      const currentLoad = loadRows[0]?.SoTiet || 0;

      // Calculate additional load from selected classes
      let addedLoad = 0;
      for (const MaLop of classList) {
        const [countRows] = await conn.execute(`
          SELECT COUNT(*) AS SoTiet
          FROM ThoiKhoaBieu
          WHERE MaLop = ? AND NamHoc = ? AND KyHoc = ? AND TenMonHoc = ?
        `, [MaLop, namHoc, kyHoc, tenMonHoc]);
        addedLoad += countRows[0]?.SoTiet || 0;
      }

      const MAX_LOAD = 40;
      if (currentLoad + addedLoad > MAX_LOAD) {
        await conn.rollback();
        return {
          success: false,
          message: `Số tiết dạy của giáo viên vượt quá giới hạn. Số tiết hiện tại: ${currentLoad}, số tiết sẽ thêm: ${addedLoad}, tối đa: ${MAX_LOAD}.`
        };
      }

      // Insert into GVBoMon
      for (const MaLop of classList) {
        const [checkRows] = await conn.execute(`
          SELECT * FROM GVBoMon
          WHERE MaGVBM = ? AND MaLop = ? AND NamHoc = ? AND HocKy = ? AND BoMon = ?
        `, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);

        if (!checkRows.length) {
          await conn.execute(`
            INSERT INTO GVBoMon (MaGVBM, MaLop, NamHoc, HocKy, BoMon)
            VALUES (?, ?, ?, ?, ?)
          `, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);
        }
      }

      await conn.commit();
      return { success: true, message: 'Phân công bộ môn thành công.' };

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

static async listAssignments(namHoc, kyHoc) {
    const [rows] = await db.execute(`
      SELECT 
        k.TenKhoi AS Khoi,
        gv.BoMon AS TenMonHoc,
        g.TenGiaoVien,
        gv.MaLop,
        l.TenLop,
        gv.NamHoc,
        gv.HocKy
      FROM GVBoMon gv
      JOIN Lop l ON gv.MaLop = l.MaLop
      JOIN GiaoVien g ON gv.MaGVBM = g.MaGiaoVien
      JOIN Khoi k ON l.Khoi = k.MaKhoi
      WHERE gv.NamHoc = ? AND gv.HocKy = ?
      ORDER BY k.TenKhoi, gv.BoMon, g.TenGiaoVien, l.TenLop
    `, [namHoc, kyHoc]);
    return rows;
  }
}

module.exports = PhanCongModel;