const db = require('../config/database');

class PhanCongModel {
  static async getNamHocList() {
    const [rows] = await db.execute(`SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC`);
    return rows.map(r => r.NamHoc);
  }

  static async getKyHocList(namHoc) {
    const [rows] = await db.execute(`SELECT KyHoc, NgayBatDau, NgayKetThuc, TrangThai FROM HocKy WHERE NamHoc = ? ORDER BY KyHoc`, [namHoc]);
    return rows;
  }

  static async getKhoiList() {
    const [rows] = await db.execute(`SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY TenKhoi`);
    return rows;
  }

  static async getHocKyStatus(namHoc, kyHoc) {
    const [rows] = await db.execute(`SELECT TrangThai FROM HocKy WHERE NamHoc = ? AND KyHoc = ?`, [namHoc, kyHoc]);
    return rows[0]?.TrangThai || null;
  }

  static async getClassesByNamHoc(namHoc) {
    // Return list of classes and current GVCN if any
    const [rows] = await db.execute(`
      SELECT l.MaLop, l.TenLop, COALESCE(gv.MaGiaoVien, '') AS MaGVCN, COALESCE(gv.TenGiaoVien, '') AS TenGVCN
      FROM Lop l
      LEFT JOIN GVChuNhiem gvc ON l.MaLop = gvc.MaLop AND gvc.NamHoc = ?
      LEFT JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
      ORDER BY l.TenLop
    `, [namHoc]);
    return rows;
  }

  static async getGVCNByClass(maLop, namHoc) {
    const [rows] = await db.execute(`
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GVChuNhiem gvc
      JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
      WHERE gvc.MaLop = ? AND gvc.NamHoc = ?
    `, [maLop, namHoc]);
    return rows[0] || null;
  }

  static async getAvailableTeachersForChunhiem(namHoc, maLop) {
    // include teachers that are not GVCN for other classes in the same year
    // if maLop is provided, include current GVCN for that class
    let sql = `SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GiaoVien gv
      WHERE gv.TrangThai = 'Đang công tác'`;
    const params = [];
    if (maLop) {
      // allow current teacher for the class (if exists), exclude others assigned
      sql += ` AND (gv.MaGiaoVien NOT IN (SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ?) OR gv.MaGiaoVien IN (SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ? AND MaLop = ?))`;
      params.push(namHoc, namHoc, maLop);
    } else {
      sql += ` AND gv.MaGiaoVien NOT IN (SELECT MaGVCN FROM GVChuNhiem WHERE NamHoc = ?)`;
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
      // Remove existing GVCN for this class and year (if any)
      await conn.execute(`DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?`, [maLop, namHoc]);
      // Insert new one
      await conn.execute(`INSERT INTO GVChuNhiem (MaGVCN, MaLop, NamHoc) VALUES (?, ?, ?)`, [maGVCN, maLop, namHoc]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ---------- Bo Mon (subject) ----------
  static async getSubjectsByKhoi(maKhoi) {
    const [rows] = await db.execute(`SELECT TenMonHoc FROM MonHoc WHERE Khoi = ? ORDER BY TenMonHoc`, [maKhoi]);
    return rows.map(r => r.TenMonHoc);
  }

  static async getClassesByKhoi(maKhoi) {
    const [rows] = await db.execute(`SELECT MaLop, TenLop FROM Lop WHERE Khoi = ? ORDER BY TenLop`, [maKhoi]);
    return rows;
  }

  static async getTeachersBySubject(tenMonHoc, NamHoc = null, KyHoc = null, Thu = null, TietHoc = null, MaLop = null) {
    // If time slot provided (Thu + TietHoc + NamHoc + KyHoc), exclude teachers that are already scheduled at that time for other classes
    let sql = `
      SELECT DISTINCT gv.MaGiaoVien, gv.TenGiaoVien, gv.TenMonHoc
      FROM GiaoVien gv
      LEFT JOIN GVBoMon gbm ON gbm.MaGVBM = gv.MaGiaoVien
      WHERE (TRIM(gv.TenMonHoc) = TRIM(?) OR gbm.BoMon LIKE CONCAT('%', ?, '%')) AND gv.TrangThai = 'Đang công tác'
    `;
    const params = [tenMonHoc];
    if (NamHoc && KyHoc && Thu && TietHoc) {
      sql += ` AND gv.MaGiaoVien NOT IN (
          SELECT t.MaGiaoVien FROM ThoiKhoaBieu t
          WHERE t.NamHoc = ? AND t.KyHoc = ? AND t.Thu = ? AND t.TietHoc = ?`;
      params.push(NamHoc, KyHoc, Thu, TietHoc);
      if (MaLop) {
        sql += ' AND (t.MaLop != ?)';
        params.push(MaLop);
      }
      sql += ')';
    }
    sql += ' ORDER BY gv.TenGiaoVien';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getTeacherWeeklyLoad(maGiaoVien, namHoc, kyHoc) {
    const [rows] = await db.execute(`
      SELECT COUNT(*) as SoTietTuan
      FROM ThoiKhoaBieu
      WHERE MaGiaoVien = ? AND NamHoc = ? AND KyHoc = ?
    `, [maGiaoVien, namHoc, kyHoc]);
    return rows[0]?.SoTietTuan || 0;
  }

  static async getSubjectWeeklyCountForClass(maLop, namHoc, kyHoc, tenMonHoc) {
    const [rows] = await db.execute(`
      SELECT COUNT(*) as SoTietTuan
      FROM ThoiKhoaBieu
      WHERE MaLop = ? AND NamHoc = ? AND KyHoc = ? AND TenMonHoc = ?
    `, [maLop, namHoc, kyHoc, tenMonHoc]);
    return rows[0]?.SoTietTuan || 0;
  }

  static async assignBoMonForTeacher(maGiaoVien, classList, namHoc, kyHoc, tenMonHoc) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // check teacher current load
      const currentLoad = await this.getTeacherWeeklyLoad(maGiaoVien, namHoc, kyHoc);
      let addedLoad = 0;
      for (const MaLop of classList) {
        const soTiet = await this.getSubjectWeeklyCountForClass(MaLop, namHoc, kyHoc, tenMonHoc);
        addedLoad += soTiet;
      }

      const MAX_LOAD = 40; // arbitrary weekly limit - can be changed
      if (currentLoad + addedLoad > MAX_LOAD) {
        await conn.rollback();
        return { success: false, message: 'Số tiết của giáo viên sau khi phân công sẽ vượt quá giới hạn.' };
      }

      // insert assignments, if exists ignore/replace
      for (const MaLop of classList) {
        // check if already assigned
        const [rows] = await conn.execute(`SELECT * FROM GVBoMon WHERE MaGVBM = ? AND MaLop = ? AND NamHoc = ? AND HocKy = ? AND BoMon = ?`, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);
        if (!rows.length) {
          await conn.execute(`INSERT INTO GVBoMon (MaGVBM, MaLop, NamHoc, HocKy, BoMon) VALUES (?, ?, ?, ?, ?)`, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);
        }
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
}

module.exports = PhanCongModel;
