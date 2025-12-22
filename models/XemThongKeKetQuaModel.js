const db = require('../config/database');

class XemThongKeKetQuaModel {
  // Lấy danh sách lớp theo vai trò
  static async getClassesByRole(user) {
    let query = '';
    let params = [];
    if (user.role === 'Hiệu trưởng') {
      query = `SELECT MaLop, TenLop FROM Lop WHERE MaTruong = (SELECT MaTruong FROM HieuTruong WHERE MaHieuTruong = ?) AND TrangThai = 'Đang học' ORDER BY TenLop`;
      params = [user.username];
    } else if (user.role === 'Giáo viên chủ nhiệm') {
      query = `SELECT l.MaLop, l.TenLop FROM Lop l JOIN GVChuNhiem gvcn ON l.MaLop = gvcn.MaLop WHERE gvcn.MaGVCN = ? AND l.TrangThai = 'Đang học' ORDER BY l.TenLop`;
      params = [user.username];
    } else if (user.role === 'Giáo vụ') {
      query = `SELECT MaLop, TenLop FROM Lop WHERE TrangThai = 'Đang học' ORDER BY TenLop`;
      params = [];
    } else {
      query = `SELECT MaLop, TenLop FROM Lop WHERE TrangThai = 'Đang học' ORDER BY TenLop`;
      params = [];
    }
    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Lấy môn học
  static async getSubjects() {
    const [rows] = await db.execute("SELECT DISTINCT TenMonHoc FROM MonHoc WHERE TrangThai = 'Đang dạy' ORDER BY TenMonHoc");
    return rows;
  }

  // Lấy năm học
  static async getSemesters() {
    const [rows] = await db.execute("SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC");
    return rows;
  }

  // Thống kê cho Hiệu trưởng: Thống kê điểm theo lớp, môn
  static async getStatsForPrincipal(maTruong, filters) {
    const { namHoc, kyHoc, maLop, tenMonHoc } = filters;
    let query = `
      SELECT
        l.TenLop,
        m.TenMonHoc,
        COUNT(d.MaHocSinh) AS TongHS,
        ROUND(AVG(d.TrungBinhMon), 2) AS DiemTB,
        ROUND((SUM(CASE WHEN d.TrungBinhMon >= 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(d.MaHocSinh)), 2) AS TyLeDat,
        ROUND((SUM(CASE WHEN d.TrungBinhMon < 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(d.MaHocSinh)), 2) AS TyLeKhongDat
      FROM Diem d
      JOIN HocSinh hs ON d.MaHocSinh = hs.MaHocSinh
      JOIN Lop l ON hs.MaLop = l.MaLop
      JOIN MonHoc m ON d.TenMonHoc = m.TenMonHoc
      WHERE l.MaTruong = ? AND d.NamHoc = ? AND d.HocKi = ?
    `;
    const params = [maTruong, namHoc, kyHoc];
    if (maLop) {
      query += " AND l.MaLop = ?";
      params.push(maLop);
    }
    if (tenMonHoc) {
      query += " AND m.TenMonHoc = ?";
      params.push(tenMonHoc);
    }
    query += " GROUP BY l.TenLop, m.TenMonHoc ORDER BY l.TenLop, DiemTB DESC";
    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Thống kê cho Giáo viên chủ nhiệm: Thống kê trong lớp mình
  static async getStatsForClassTeacher(maGV, filters) {
    const { namHoc, kyHoc } = filters;
    // Lấy lớp chủ nhiệm
    const [classRows] = await db.execute(`
      SELECT l.MaLop, l.TenLop
      FROM Lop l
      JOIN GVChuNhiem gvcn ON l.MaLop = gvcn.MaLop
      WHERE gvcn.MaGVCN = ? AND gvcn.NamHoc = ?
    `, [maGV, namHoc]);
    if (classRows.length === 0) return { classInfo: null, stats: [] };

    const maLop = classRows[0].MaLop;
    const tenLop = classRows[0].TenLop;

    // Thống kê điểm trung bình
    const [scoreStats] = await db.execute(`
      SELECT
        COUNT(*) AS TongHS,
        SUM(CASE WHEN TrungBinhMon >= 8 THEN 1 ELSE 0 END) AS Gioi,
        SUM(CASE WHEN TrungBinhMon >= 6.5 AND TrungBinhMon < 8 THEN 1 ELSE 0 END) AS Kha,
        SUM(CASE WHEN TrungBinhMon >= 5 AND TrungBinhMon < 6.5 THEN 1 ELSE 0 END) AS TrungBinh,
        SUM(CASE WHEN TrungBinhMon < 5 THEN 1 ELSE 0 END) AS Yeu
      FROM Diem d
      JOIN HocSinh hs ON d.MaHocSinh = hs.MaHocSinh
      WHERE hs.MaLop = ? AND d.NamHoc = ? AND d.HocKi = ?
    `, [maLop, namHoc, kyHoc]);

    // Thống kê hạnh kiểm, học lực từ HocBa
    const [conductStats] = await db.execute(`
      SELECT
        HanhKiem,
        COUNT(*) AS SoLuong
      FROM HocBa
      WHERE MaHocSinh IN (SELECT MaHocSinh FROM HocSinh WHERE MaLop = ?) AND NamHoc = ? AND HocKy = ?
      GROUP BY HanhKiem
    `, [maLop, namHoc, kyHoc]);

    const [learningStats] = await db.execute(`
      SELECT
        HocLuc,
        COUNT(*) AS SoLuong
      FROM HocBa
      WHERE MaHocSinh IN (SELECT MaHocSinh FROM HocSinh WHERE MaLop = ?) AND NamHoc = ? AND HocKy = ?
      GROUP BY HocLuc
    `, [maLop, namHoc, kyHoc]);

    // Thống kê số ngày nghỉ từ DiemDanh (giả sử TrangThai = 'Nghỉ')
    const [absenceStats] = await db.execute(`
      SELECT
        COUNT(*) AS TongNgayNghi
      FROM DiemDanh dd
      JOIN HocSinh hs ON dd.MaHocSinh = hs.MaHocSinh
      WHERE hs.MaLop = ? AND dd.TrangThai = 'Nghỉ' AND YEAR(dd.Ngay) = LEFT(?, 4)
    `, [maLop, namHoc]);

    return {
      classInfo: { MaLop: maLop, TenLop: tenLop },
      stats: {
        scoreStats: scoreStats[0] || {},
        conductStats,
        learningStats,
        absenceStats: absenceStats[0] || { TongNgayNghi: 0 }
      }
    };
  }

  // Thống kê cho Giáo vụ: Tổng quan trường
  static async getStatsForAdmin(filters) {
    const { namHoc, kyHoc, maTruong } = filters;
    let whereClause = '';
    let params = [];
    if (maTruong) {
      whereClause = 'WHERE MaTruong = ?';
      params.push(maTruong);
    }

    // Số lớp
    const [classCount] = await db.execute(`SELECT COUNT(*) AS SoLop FROM Lop ${whereClause}`, params);

    // Số giáo viên
    const [teacherCount] = await db.execute(`SELECT COUNT(*) AS SoGV FROM GiaoVien ${whereClause}`, params);

    // Số học sinh
    const [studentCount] = await db.execute(`SELECT COUNT(*) AS SoHS FROM HocSinh ${whereClause}`, params);

    // Học sinh theo tổ hợp
    const [studentsByToHop] = await db.execute(`
      SELECT th.TenToHop, COUNT(hs.MaHocSinh) AS SoHS
      FROM HocSinh hs
      JOIN ToHopMon th ON hs.ToHop = th.MaToHop
      ${whereClause}
      GROUP BY th.TenToHop
    `, params);

    // Giáo viên nghỉ học
    const [teachersOnLeave] = await db.execute(`SELECT COUNT(*) AS SoGVNghi FROM GiaoVien WHERE TrangThai = 'Nghỉ việc' ${whereClause ? 'AND ' + whereClause.substring(6) : ''}`, params.slice(1));

    // Học sinh nghỉ học
    const [studentsOnLeave] = await db.execute(`SELECT COUNT(*) AS SoHSNghi FROM HocSinh WHERE TrangThai = 'Nghỉ học' ${whereClause ? 'AND ' + whereClause.substring(6) : ''}`, params.slice(1));

    // Thống kê điểm nếu có namHoc, kyHoc
    let scoreStats = [];
    if (namHoc && kyHoc) {
      const scoreQuery = `
        SELECT
          m.TenMonHoc,
          COUNT(d.MaHocSinh) AS TongHS,
          ROUND(AVG(d.TrungBinhMon), 2) AS DiemTB
        FROM Diem d
        JOIN HocSinh hs ON d.MaHocSinh = hs.MaHocSinh
        JOIN MonHoc m ON d.TenMonHoc = m.TenMonHoc
        WHERE d.NamHoc = ? AND d.HocKi = ? ${maTruong ? 'AND hs.MaTruong = ?' : ''}
        GROUP BY m.TenMonHoc
      `;
      const scoreParams = [namHoc, kyHoc];
      if (maTruong) scoreParams.push(maTruong);
      [scoreStats] = await db.execute(scoreQuery, scoreParams);
    }

    return {
      summary: {
        SoLop: classCount[0].SoLop,
        SoGV: teacherCount[0].SoGV,
        SoHS: studentCount[0].SoHS,
        SoGVNghi: teachersOnLeave[0].SoGVNghi,
        SoHSNghi: studentsOnLeave[0].SoHSNghi
      },
      studentsByToHop,
      scoreStats
    };
  }
}

module.exports = XemThongKeKetQuaModel;