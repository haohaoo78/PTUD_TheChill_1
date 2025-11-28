const db = require('../config/database');

class ThoiKhoaBieu {
  static db = db;

  // ====================
  // Danh sách khối, lớp, năm học, kỳ học
  // ====================
  static async getKhoiList() {
    const [rows] = await db.execute('SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY MaKhoi');
    return rows;
  }

  static async getClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute(
      'SELECT MaLop, TenLop FROM Lop WHERE Khoi=? ORDER BY TenLop',
      [MaKhoi]
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

  // ====================
  // Giáo viên & môn
  // ====================
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
      SELECT DISTINCT m.TenMonHoc, g.TenGiaoVien
      FROM GVBoMon gbm
      JOIN GiaoVien g ON gbm.MaGVBM = g.MaGiaoVien
      JOIN MonHoc m ON m.TenMonHoc = g.TenMonHoc
      WHERE gbm.MaLop=? AND gbm.NamHoc=? AND gbm.HocKy=?
      ORDER BY m.TenMonHoc
    `, [MaLop, NamHoc, KyHoc]);
    return rows;
  }

  // ====================
  // Grid TKB
  // ====================
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
      if (!grid[r.Thu]) grid[r.Thu] = {};
      grid[r.Thu][r.TietHoc] = { subject: r.TenMonHoc, teacher: r.TenGiaoVien };
    });
    return grid;
  }

  // ====================
  // Thao tác cell
  // ====================
  static async deleteCell(MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc) {
    const [result] = await db.execute(`
      DELETE FROM ThoiKhoaBieu
      WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND LoaiTKB=? AND Thu=? AND TietHoc=?
    `, [MaLop, NamHoc, KyHoc, LoaiTKB, Thu, TietHoc]);
    return result;
  }
// ====================
// Cập nhật nhiều cell + tuần rỗng
// ====================
static async updateMultiple(cells, startDate) {
  const baseDate = new Date(startDate);
  if (isNaN(baseDate.getTime())) throw new Error('Ngày bắt đầu học kỳ không hợp lệ');

  // Tìm Thứ 2 đầu tiên
  const firstMonday = new Date(baseDate);
  const day = firstMonday.getDay(); // 0=CN, 1=T2
  const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  firstMonday.setDate(firstMonday.getDate() + offset);

  // Lọc cell có môn học
  const validCells = cells.filter(c => c.TenMonHoc && c.TenMonHoc.trim() !== '');

  // Nếu không có cell nào, tạo 1 dòng ảo
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
      ON DUPLICATE KEY UPDATE
        TenMonHoc = VALUES(TenMonHoc)
    `, [LoaiTKB, MaLop, 'EMPTY_WEEK', 1, KyHoc, 2, '2111-01-01', 'GV000', NamHoc]);

    return;
  }

  for (const cell of validCells) {
    const { MaLop, LoaiTKB, NamHoc, KyHoc, Thu, TietHoc, TenMonHoc } = cell;

    const weekNumber = LoaiTKB?.startsWith('Tuan') ? parseInt(LoaiTKB.replace('Tuan', '')) : 1;
    const thuOffset = Thu === 'CN' ? 6 : parseInt(Thu) - 2;
    const ngayObj = new Date(firstMonday);
    ngayObj.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + thuOffset);
    const Ngay = new Date(ngayObj.getTime() - ngayObj.getTimezoneOffset() * 60000)
      .toISOString().split('T')[0];

    // Lấy MaGiaoVien
    const [gvRows] = await db.execute(`
      SELECT g.MaGiaoVien
      FROM GVBoMon gbm
      JOIN GiaoVien g ON gbm.MaGVBM = g.MaGiaoVien
      WHERE gbm.MaLop=? AND g.TenMonHoc=? LIMIT 1
    `, [MaLop, TenMonHoc]);
    const MaGiaoVien = gvRows[0]?.MaGiaoVien || null;

    // 🔹 Dùng INSERT ... ON DUPLICATE KEY UPDATE để tránh lỗi duplicate
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

// ====================
// Lấy grid TKB (bỏ dòng ảo)
// ====================
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
    if (r.TenMonHoc === 'EMPTY_WEEK') return; // bỏ qua dòng ảo
    if (!grid[r.Thu]) grid[r.Thu] = {};
    grid[r.Thu][r.TietHoc] = { subject: r.TenMonHoc, teacher: r.TenGiaoVien };
  });
  return grid;
}


  static async resetWeek(MaLop, NamHoc, KyHoc, LoaiTKB) {
    if (LoaiTKB === 'Chuan') return;
    await db.execute(`
      DELETE FROM ThoiKhoaBieu WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND LoaiTKB=?
    `, [MaLop, NamHoc, KyHoc, LoaiTKB]);
  }
static async getSubjectWeeklyLimit(TenMonHoc) {
  const [rows] = await db.execute(`
    SELECT SoTiet FROM MonHoc
    WHERE TenMonHoc=? AND TrangThai='Đang dạy' LIMIT 1
  `, [TenMonHoc]);
  return rows[0]?.SoTiet || 0;
}

static async countSubjectWeeklyInDB(MaLop, NamHoc, KyHoc, TenMonHoc, LoaiTKB) {
  let query = `
    SELECT COUNT(*) AS SoTietTuan
    FROM ThoiKhoaBieu
    WHERE MaLop=? AND NamHoc=? AND KyHoc=? AND TenMonHoc=? AND LoaiTKB=?
  `;
  const params = [MaLop, NamHoc, KyHoc, TenMonHoc, LoaiTKB];
  const [rows] = await db.execute(query, params);
  return rows[0]?.SoTietTuan || 0;
}

static async getAvailableTeachersForSlot(TenMonHoc, NamHoc, KyHoc, Thu, TietHoc, MaLop = null) {
  // Thu/TietHoc expected as numbers, MaLop optional. Exclude teachers scheduled at the same slot in other classes.
  const baseSQL = `
    SELECT DISTINCT g.MaGiaoVien, g.TenGiaoVien
    FROM GiaoVien g
    LEFT JOIN GVBoMon gbm ON gbm.MaGVBM = g.MaGiaoVien
    WHERE (TRIM(g.TenMonHoc) = TRIM(?) OR gbm.BoMon LIKE CONCAT('%', ?, '%'))
      AND g.TrangThai = 'Đang công tác'`;

  let sql = baseSQL;
  const params = [TenMonHoc, TenMonHoc];
  if (NamHoc && KyHoc && Thu != null && TietHoc != null) {
    sql += ` AND g.MaGiaoVien NOT IN (
      SELECT t.MaGiaoVien FROM ThoiKhoaBieu t
      WHERE t.NamHoc = ? AND t.KyHoc = ? AND t.Thu = ? AND t.TietHoc = ?`;
    params.push(NamHoc, KyHoc, Thu, TietHoc);
    if (MaLop) {
      sql += ' AND t.MaLop != ?';
      params.push(MaLop);
    }
    sql += ')';
  }
  sql += '\n    ORDER BY g.TenGiaoVien';
  const [rows] = await db.execute(sql, params);
  return rows;
}

}
module.exports = ThoiKhoaBieu;