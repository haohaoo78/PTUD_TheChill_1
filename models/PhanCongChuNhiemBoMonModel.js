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
  // 2. KHỐI – LỚP – GIÁO VIÊN CHỦ NHIỆM
  // =======================
  static async getKhoiList(maTruong) {
    const [rows] = await db.execute(`
      SELECT DISTINCT k.MaKhoi, k.TenKhoi
      FROM Khoi k
      JOIN Lop l ON l.Khoi = k.MaKhoi
      WHERE l.MaTruong = ?
      ORDER BY k.TenKhoi
    `, [maTruong]);
    return rows;
  }

  static async getClassesByNamHoc(namHoc, maTruong) {
    const [rows] = await db.execute(`
      SELECT l.MaLop, l.TenLop,
             COALESCE(gv.MaGiaoVien, '') AS MaGVCN,
             COALESCE(gv.TenGiaoVien, '') AS TenGVCN
      FROM Lop l
      LEFT JOIN GVChuNhiem gvc ON l.MaLop = gvc.MaLop AND gvc.NamHoc = ?
      LEFT JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
      WHERE l.MaTruong = ?
      ORDER BY l.TenLop
    `, [namHoc, maTruong]);
    return rows;
  }

  static async getGVCNByClass(maLop, namHoc, maTruong) {
    const nH = namHoc || '2025-2026';
    const [rows] = await db.execute(`
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GVChuNhiem gvc
      JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
      JOIN Lop l ON gvc.MaLop = l.MaLop
      WHERE gvc.MaLop = ? AND gvc.NamHoc = ? AND l.MaTruong = ?
    `, [maLop, nH, maTruong]);
    return rows[0] || null;
  }

  // LOẠI BỎ GV ẢO KHI LẤY DANH SÁCH GIÁO VIÊN CÓ THỂ PHÂN CÔNG CHỦ NHIỆM
  static async getAvailableTeachersForChunhiem(namHoc, maLop, maTruong) {
    let sql = `
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GiaoVien gv
      WHERE gv.TrangThai = 'Đang công tác' 
        AND gv.MaTruong = ?
        AND gv.TenGiaoVien != 'GV Ảo'
    `;
    const params = [maTruong];

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
      await conn.execute(`DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?`, [maLop, namHoc]);
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

  static async deleteChunhiem(maLop, namHoc) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?`, [maLop, namHoc]);
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

  // LOẠI BỎ "EMPTY_WEEK" VÀ MÔN TRỐNG KHI LẤY DANH SÁCH MÔN HỌC THEO KHỐI
  static async getSubjectsByKhoi(maKhoi) {
    const [rows] = await db.execute(`
      SELECT DISTINCT TenMonHoc
      FROM MonHoc
      WHERE Khoi = ?
        AND COALESCE(TRIM(TenMonHoc), '') != ''
        AND TenMonHoc != 'EMPTY_WEEK'
      ORDER BY TenMonHoc
    `, [maKhoi]);
    return rows.map(r => r.TenMonHoc);
  }

  static async getClassesByKhoi(maKhoi, maTruong) {
    const [rows] = await db.execute(`
      SELECT MaLop, TenLop
      FROM Lop
      WHERE Khoi = ? AND MaTruong = ?
      ORDER BY TenLop
    `, [maKhoi, maTruong]);
    return rows;
  }

  // LOẠI BỎ GV ẢO + MÔN TRỐNG KHI LẤY DANH SÁCH GIÁO VIÊN THEO MÔN
  static async getTeachersBySubject(tenMonHoc, namHoc = null, kyHoc = null, maTruong) {
    const nH = namHoc || '2025-2026';
    const kH = kyHoc || '1';

    const [rows] = await db.execute(`
      SELECT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GiaoVien gv
      WHERE (TRIM(gv.TenMonHoc) = TRIM(?) OR gv.TenMonHoc LIKE CONCAT('%', ?, '%'))
        AND gv.TrangThai = 'Đang công tác'
        AND gv.MaTruong = ?
        AND gv.TenGiaoVien != 'GV Ảo'
        AND COALESCE(TRIM(gv.TenMonHoc), '') != ''
      ORDER BY gv.TenGiaoVien
    `, [tenMonHoc, tenMonHoc, maTruong]);

    for (let row of rows) {
      const load = await this.getTeacherWeeklyLoad(row.MaGiaoVien, nH, kH);
      row.load = load;
      row.remaining = 30 - load;
    }

    return rows.filter(r => r.remaining > 0);
  }

  static async getTeacherWeeklyLoad(maGiaoVien, namHoc, kyHoc) {
    const nH = namHoc || '2025-2026';
    const kH = kyHoc || '1';

    const [rows] = await db.execute(`
      SELECT COALESCE(SUM(CAST(mh.SoTiet AS UNSIGNED)), 0) AS TongTiet
      FROM GVBoMon gvbm
      JOIN Lop l ON gvbm.MaLop = l.MaLop
      LEFT JOIN MonHoc mh ON gvbm.BoMon = mh.TenMonHoc AND l.Khoi = mh.Khoi
      WHERE gvbm.MaGVBM = ? AND gvbm.NamHoc = ? AND gvbm.HocKy = ?
    `, [maGiaoVien, nH, kH]);

    return parseInt(rows[0]?.TongTiet || 0, 10);
  }

  static async getSubjectWeeklyCountForClass(maLop, namHoc, kyHoc, tenMonHoc) {
    const [rows] = await db.execute(`
      SELECT COALESCE(CAST(mh.SoTiet AS UNSIGNED), 0) AS SoTiet
      FROM Lop l
      LEFT JOIN MonHoc mh ON mh.TenMonHoc = ? AND mh.Khoi = l.Khoi
      WHERE l.MaLop = ?
      LIMIT 1
    `, [tenMonHoc, maLop]);

    return parseInt(rows[0]?.SoTiet || 0, 10);
  }

  // Hàm phân công bộ môn (giữ nguyên logic kiểm tra định mức)
  static async assignBoMonForTeacher(maGiaoVien, classList, namHoc, kyHoc, tenMonHoc) {
    const conn = await db.getConnection();

    console.log('\n=== BẮT ĐẦU PHÂN CÔNG BỘ MÔN ===');
    console.log('Input:', { maGiaoVien, classList, namHoc, kyHoc, tenMonHoc });

    try {
      await conn.beginTransaction();
      console.log('→ Transaction bắt đầu');

      if (!maGiaoVien || !Array.isArray(classList) || classList.length === 0 || !namHoc || !kyHoc || !tenMonHoc) {
        await conn.rollback();
        console.log('→ Thiếu dữ liệu → rollback');
        return { success: false, message: 'Thiếu thông tin phân công.' };
      }

      const currentLoad = await this.getTeacherWeeklyLoad(maGiaoVien, namHoc, kyHoc);
      console.log(`→ Định mức hiện tại: ${currentLoad} tiết`);

      let addedLoad = 0;
      const validClasses = [];

      for (const MaLop of classList) {
        const soTiet = await this.getSubjectWeeklyCountForClass(MaLop, namHoc, kyHoc, tenMonHoc);
        console.log(`→ Lớp ${MaLop}: môn ${tenMonHoc} = ${soTiet} tiết`);
        if (soTiet > 0) {
          validClasses.push(MaLop);
          addedLoad += soTiet;
        } else {
          console.warn(`→ Lớp ${MaLop}: môn ${tenMonHoc} số tiết = 0 → bỏ qua`);
        }
      }

      if (validClasses.length === 0) {
        await conn.rollback();
        console.log('→ Không có lớp hợp lệ → rollback');
        return { success: false, message: 'Không có lớp nào có số tiết cho môn này. Vui lòng kiểm tra bảng Môn học.' };
      }

      console.log(`→ Số tiết thêm: ${addedLoad} tiết từ ${validClasses.length} lớp`);

      const MAX_LOAD = 30;
      const totalLoad = currentLoad + addedLoad;

      if (totalLoad > MAX_LOAD) {
        await conn.rollback();
        console.log(`→ Tổng: ${totalLoad} > ${MAX_LOAD} → rollback`);
        return {
          success: false,
          message: `Vượt định mức ${MAX_LOAD} tiết (hiện tại ${currentLoad} + thêm ${addedLoad} = ${totalLoad})`
        };
      }

      console.log(`→ Tổng sau phân công: ${totalLoad} ≤ ${MAX_LOAD} → CHO PHÉP`);

      let insertedCount = 0;
      for (const MaLop of validClasses) {
        const [exist] = await conn.execute(`
          SELECT 1 FROM GVBoMon 
          WHERE MaGVBM = ? AND MaLop = ? AND NamHoc = ? AND HocKy = ? AND BoMon = ?
        `, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);

        if (exist.length > 0) {
          console.log(`→ Lớp ${MaLop} đã phân công → bỏ qua`);
          continue;
        }

        await conn.execute(`
          INSERT INTO GVBoMon (MaGVBM, MaLop, NamHoc, HocKy, BoMon)
          VALUES (?, ?, ?, ?, ?)
        `, [maGiaoVien, MaLop, namHoc, kyHoc, tenMonHoc]);

        insertedCount++;
        console.log(`→ Phân công thành công lớp ${MaLop}`);
      }

      await conn.commit();
      console.log(`=== PHÂN CÔNG THÀNH CÔNG - ĐÃ LƯU ${insertedCount} LỚP ===\n`);

      return {
        success: true,
        message: insertedCount > 0 
          ? `Phân công thành công cho ${insertedCount} lớp!` 
          : 'Tất cả lớp đã được phân công trước đó.'
      };

    } catch (err) {
      await conn.rollback();
      console.error('→ LỖI - ROLLBACK:', err);
      return { success: false, message: 'Lỗi hệ thống khi lưu phân công bộ môn.' };
    } finally {
      conn.release();
      console.log('=== KẾT THÚC PHÂN CÔNG ===\n');
    }
  }

  // LOẠI BỎ EMPTY_WEEK VÀ GV ẢO TRONG BẢNG HIỂN THỊ PHÂN CÔNG
  static async listAssignments(namHoc, kyHoc, maTruong) {
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
      WHERE gv.NamHoc = ? 
        AND gv.HocKy = ? 
        AND l.MaTruong = ?
        AND COALESCE(TRIM(gv.BoMon), '') != ''
        AND gv.BoMon != 'EMPTY_WEEK'
        AND g.TenGiaoVien != 'GV Ảo'
      ORDER BY k.TenKhoi, gv.BoMon, g.TenGiaoVien, l.TenLop
    `, [namHoc, kyHoc, maTruong]);
    return rows;
  }
}

module.exports = PhanCongModel;