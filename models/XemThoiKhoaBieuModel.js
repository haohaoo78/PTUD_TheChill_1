const db = require('../config/database');

class ThoiKhoaBieu {
  static db = db;

  static async getKhoiList(MaTruong) {
    const [rows] = await db.execute(`
      SELECT DISTINCT k.MaKhoi, k.TenKhoi 
      FROM Khoi k 
      JOIN Lop l ON k.MaKhoi = l.Khoi 
      WHERE l.MaTruong = ? 
      ORDER BY k.MaKhoi
    `, [MaTruong]);
    return rows;
  }

  static async getClassesByKhoi(MaKhoi, MaTruong) {
    const [rows] = await db.execute(
      'SELECT MaLop, TenLop FROM Lop WHERE Khoi=? AND MaTruong=? ORDER BY TenLop',
      [MaKhoi, MaTruong]
    );
    return rows;
  }

  static async getNamHocList() {
    const [rows] = await db.execute('SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc');
    return rows.map(r => r.NamHoc);
  }

  static async getKyHocList(NamHoc) {
    const [rows] = await db.execute(
      'SELECT KyHoc, NgayBatDau FROM HocKy WHERE NamHoc=? ORDER BY KyHoc',
      [NamHoc]
    );
    return rows;
  }

  static async getTeacher(MaLop, TenMonHoc) {
    const [rows] = await db.execute(`
      SELECT g.MaGiaoVien, g.TenGiaoVien
      FROM GVBoMon gbm
      JOIN GiaoVien g ON gbm.MaGVBM = g.MaGiaoVien
      WHERE gbm.MaLop=? AND g.TenMonHoc=? LIMIT 1
    `, [MaLop, TenMonHoc]);
    return rows[0] || { TenGiaoVien: '' };
  }

  static async getSubjectsWithTeacherByClass(MaLop, NamHoc, KyHoc) {
    if (!MaLop || !NamHoc || !KyHoc) return [];
    const [rows] = await db.execute(`
      SELECT DISTINCT m.TenMonHoc, g.TenGiaoVien, g.MaGiaoVien
      FROM GVBoMon gbm
      JOIN GiaoVien g ON gbm.MaGVBM = g.MaGiaoVien
      JOIN MonHoc m ON m.TenMonHoc = g.TenMonHoc
      WHERE gbm.MaLop=? AND gbm.NamHoc=? AND gbm.HocKy=?
      ORDER BY m.TenMonHoc
    `, [MaLop, NamHoc, KyHoc]);
    return rows;
  }

  static async getGrid(MaLop, LoaiTKB, NamHoc, KyHoc) {
    let [rows] = await db.execute(`
      SELECT t.Thu, t.TietHoc, t.TenMonHoc, g.TenGiaoVien
      FROM ThoiKhoaBieu t
      JOIN GiaoVien g ON t.MaGiaoVien = g.MaGiaoVien
      WHERE t.MaLop=? AND t.NamHoc=? AND t.KyHoc=? AND t.LoaiTKB=?
      ORDER BY Thu, TietHoc
    `, [MaLop, NamHoc, KyHoc, LoaiTKB]);

    if (rows.length === 0 && LoaiTKB !== 'Chuan') {
      [rows] = await db.execute(`
        SELECT t.Thu, t.TietHoc, t.TenMonHoc, g.TenGiaoVien
        FROM ThoiKhoaBieu t
        JOIN GiaoVien g ON t.MaGiaoVien = g.MaGiaoVien
        WHERE t.MaLop=? AND t.NamHoc=? AND t.KyHoc=? AND t.LoaiTKB='Chuan'
        ORDER BY Thu, TietHoc
      `, [MaLop, NamHoc, KyHoc]);
    }

    const grid = {};
    rows.forEach(r => {
      if (r.TenMonHoc === 'EMPTY_WEEK') return;
      if (!grid[r.Thu]) grid[r.Thu] = {};
      grid[r.Thu][r.TietHoc] = { subject: r.TenMonHoc, teacher: r.TenGiaoVien };
    });
    return grid;
  }

  static async deleteCell(MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc) {
    const [result] = await db.execute(`
      DELETE FROM ThoiKhoaBieu
      WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND LoaiTKB=? AND Thu=? AND TietHoc=?
    `, [MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc]);
    return result;
  }

  static async updateMultiple(cells, startDate) {
    const baseDate = new Date(startDate);
    if (isNaN(baseDate.getTime())) throw new Error('Ngày bắt đầu học kỳ không hợp lệ');

    const firstMonday = new Date(baseDate);
    const day = firstMonday.getDay();
    const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
    firstMonday.setDate(firstMonday.getDate() + offset);

    const validCells = cells.filter(c => c.TenMonHoc && c.TenMonHoc.trim() !== '');

    if (validCells.length === 0 && cells.length > 0) {
      const { MaLop, LoaiTKB, NamHoc, KyHoc } = cells[0];
      await db.execute(`
        DELETE FROM ThoiKhoaBieu
        WHERE MaLop=? AND LoaiTKB=? AND KyHoc=? AND NamHoc=?
      `, [MaLop, LoaiTKB, KyHoc, NamHoc]);

      await db.execute(`
        INSERT INTO ThoiKhoaBieu
          (LoaiTKB, MaLop, TenMonHoc, TietHoc, KyHoc, Thu, Ngay, MaGiaoVien, NamHoc)
        VALUES (?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE TenMonHoc = VALUES(TenMonHoc)
      `, [LoaiTKB, MaLop, 'EMPTY_WEEK', 1, KyHoc, 2, '2111-01-01', 'GV000', NamHoc]);
      return;
    }

    for (const cell of validCells) {
      const { MaLop, LoaiTKB, NamHoc, KyHoc, Thu, TietHoc, TenMonHoc } = cell;

      const weekNumber = LoaiTKB?.startsWith('Tuan') ? parseInt(LoaiTKB.replace('Tuan', '')) : 1;
      const thuOffset = Thu === 'CN' ? 6 : parseInt(Thu) - 2;
      const ngayObj = new Date(firstMonday);
      ngayObj.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + thuOffset);
      const Ngay = ngayObj.toISOString().split('T')[0];

      const [gvRows] = await db.execute(`
        SELECT g.MaGiaoVien FROM GVBoMon gbm
        JOIN GiaoVien g ON gbm.MaGVBM = g.MaGiaoVien
        WHERE gbm.MaLop=? AND g.TenMonHoc=? LIMIT 1
      `, [MaLop, TenMonHoc]);
      const MaGiaoVien = gvRows[0]?.MaGiaoVien || null;

      await db.execute(`
        INSERT INTO ThoiKhoaBieu
          (LoaiTKB, MaLop, TenMonHoc, TietHoc, KyHoc, Thu, Ngay, MaGiaoVien, NamHoc)
        VALUES (?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          TenMonHoc = VALUES(TenMonHoc),
          MaGiaoVien = VALUES(MaGiaoVien),
          Ngay = VALUES(Ngay)
      `, [LoaiTKB, MaLop, TenMonHoc, TietHoc, KyHoc, Thu, Ngay, MaGiaoVien, NamHoc]);
    }
  }

  static async resetWeek(MaLop, NamHoc, KyHoc, LoaiTKB) {
    if (LoaiTKB === 'Chuan') return;
    await db.execute(`
      DELETE FROM ThoiKhoaBieu WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND LoaiTKB=?
    `, [MaLop, NamHoc, KyHoc, LoaiTKB]);
  }

  static async getSubjectWeeklyLimit(TenMonHoc) {
    const [rows] = await db.execute(`
      SELECT SoTiet FROM MonHoc WHERE TenMonHoc=? AND TrangThai='Đang dạy' LIMIT 1
    `, [TenMonHoc]);
    return rows[0]?.SoTiet || 0;
  }

  static async countSubjectWeeklyInDB(MaLop, NamHoc, KyHoc, TenMonHoc, LoaiTKB) {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS SoTietTuan FROM ThoiKhoaBieu
      WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND TenMonHoc=? AND LoaiTKB=?
    `, [MaLop, NamHoc, KyHoc, TenMonHoc, LoaiTKB]);
    return rows[0]?.SoTietTuan || 0;
  }

  static async getAvailableTeachersForSlot(TenMonHoc, NamHoc, KyHoc, Thu, TietHoc, MaLop = null) {
    let sql = `
      SELECT DISTINCT g.MaGiaoVien, g.TenGiaoVien
      FROM GiaoVien g
      LEFT JOIN GVBoMon gbm ON gbm.MaGVBM = g.MaGiaoVien
      WHERE (TRIM(g.TenMonHoc) = TRIM(?) OR gbm.BoMon LIKE CONCAT('%', ?, '%'))
        AND g.TrangThai = 'Đang công tác'
    `;
    const params = [TenMonHoc, TenMonHoc];
    if (NamHoc && KyHoc && Thu != null && TietHoc != null) {
      sql += ` AND g.MaGiaoVien NOT IN (
        SELECT t.MaGiaoVien FROM ThoiKhoaBieu t
        WHERE t.NamHoc = ? AND t.KyHoc = ? AND t.Thu = ? AND t.TietHoc = ?
      `;
      params.push(NamHoc, KyHoc, Thu, TietHoc);
      if (MaLop) {
        sql += ' AND t.MaLop != ?';
        params.push(MaLop);
      }
      sql += ')';
    }
    sql += ' ORDER BY g.TenGiaoVien';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getSchoolOfClass(MaLop) {
    const [rows] = await db.execute('SELECT MaTruong FROM Lop WHERE MaLop = ?', [MaLop]);
    return rows[0]?.MaTruong || null;
  }

  // ===== KIỂM TRA TRÙNG TIẾT =====
  
  // Kiểm tra giáo viên có trùng tiết với TKB chuẩn của lớp khác không
  static async checkTeacherConflictChuan(MaGiaoVien, NamHoc, KyHoc, Thu, TietHoc, MaLopHienTai) {
    const [rows] = await db.execute(`
      SELECT t.MaLop, l.TenLop, t.LoaiTKB
      FROM ThoiKhoaBieu t
      JOIN Lop l ON t.MaLop = l.MaLop
      WHERE t.MaGiaoVien = ?
        AND t.NamHoc = ?
        AND t.KyHoc = ?
        AND t.Thu = ?
        AND t.TietHoc = ?
        AND t.LoaiTKB = 'Chuan'
        AND t.MaLop != ?
      LIMIT 1
    `, [MaGiaoVien, NamHoc, KyHoc, Thu, TietHoc, MaLopHienTai]);
    
    return rows[0] || null;
  }

  // Kiểm tra giáo viên có trùng tiết với TKB tuần của lớp khác không
  static async checkTeacherConflictTuan(MaGiaoVien, NamHoc, KyHoc, Thu, TietHoc, MaLopHienTai, LoaiTKBHienTai) {
    const [rows] = await db.execute(`
      SELECT t.MaLop, l.TenLop, t.LoaiTKB
      FROM ThoiKhoaBieu t
      JOIN Lop l ON t.MaLop = l.MaLop
      WHERE t.MaGiaoVien = ?
        AND t.NamHoc = ?
        AND t.KyHoc = ?
        AND t.Thu = ?
        AND t.TietHoc = ?
        AND t.LoaiTKB != 'Chuan'
        AND t.MaLop != ?
      ORDER BY t.LoaiTKB
      LIMIT 1
    `, [MaGiaoVien, NamHoc, KyHoc, Thu, TietHoc, MaLopHienTai]);
    
    return rows[0] || null;
  }
}

module.exports = ThoiKhoaBieu;