const db = require('../config/database');

class QLModel {
  // NĂM HỌC
  static async getNamHocList() {
    const [rows] = await db.execute(
      'SELECT DISTINCT NamHoc FROM HocKy ORDER BY NamHoc DESC'
    );
    return rows;
  }

  // Năm học đang diễn ra (ưu tiên trạng thái đang học, fallback năm mới nhất)
  static async getCurrentNamHoc() {
    const [active] = await db.execute(
      `SELECT NamHoc 
       FROM HocKy 
       WHERE TrangThai = 'Đang học'
       ORDER BY NamHoc DESC
       LIMIT 1`
    );
    if (active.length > 0) return active[0].NamHoc;

    const list = await this.getNamHocList();
    return list[0]?.NamHoc || null;
  }

  // GIÁO VIÊN CHỦ NHIỆM
  static async getTeacherList(namHoc) {
    let sql = `
      SELECT DISTINCT gv.MaGiaoVien, gv.TenGiaoVien
      FROM GVChuNhiem gvc
      JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
    `;
    const params = [];
    if (namHoc) {
      sql += ' WHERE gvc.NamHoc = ?';
      params.push(namHoc);
    }
    sql += ' ORDER BY gv.TenGiaoVien';
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  // LỚP THEO GIÁO VIÊN
  static async getClasses(maGiaoVien, namHoc, maLop) {
    if (!namHoc || !maGiaoVien) return [];
    let sql = `
      SELECT l.MaLop, l.TenLop
      FROM Lop l
      JOIN GVChuNhiem gvc ON l.MaLop = gvc.MaLop
      WHERE gvc.NamHoc = ?
    `;
    const params = [namHoc];
    sql += ' AND gvc.MaGVCN = ?';
    params.push(maGiaoVien);
    sql += ' ORDER BY l.TenLop';
    const [rows] = await db.execute(sql, params);
    if (maLop) return rows.filter(l => l.MaLop === maLop);
    return rows;
  }

  // HỌC SINH
  static async getStudentList(maLop, namHoc) {
    if (!maLop || !namHoc) return [];
    let sql = `
      SELECT hs.MaHocSinh, hs.TenHocSinh, hs.Birthday, hs.GioiTinh, hs.TrangThai,
             l.MaLop, l.TenLop,
             hb.HanhKiem,
             hb.RenLuyen,
             hb.NhanXet
      FROM HocSinh hs
      JOIN Lop l ON hs.MaLop = l.MaLop
      LEFT JOIN HocBa hb 
        ON hs.MaHocSinh = hb.MaHocSinh
        AND hb.NamHoc = ?
        AND hb.HocKy = (
          SELECT MAX(HocKy)
          FROM HocBa
          WHERE MaHocSinh = hs.MaHocSinh AND NamHoc = ?
        )
      WHERE l.MaLop = ?
    `;
    const params = [namHoc, namHoc, maLop];
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




  // TRƯỜNG
  static async getTruongList() {
    const [rows] = await db.execute(
      'SELECT MaTruong, TenTruong FROM Truong ORDER BY TenTruong'
    );
    return rows;
  }

  // HẠNH KIỂM / RÈN LUYỆN
  static async getHocBa(maHS, namHoc, hocKy) {
    if (!maHS || !namHoc) return null;
    let sql = `
      SELECT HanhKiem, RenLuyen, NhanXet, HocKy
      FROM HocBa 
      WHERE MaHocSinh = ? AND NamHoc = ?
    `;
    const params = [maHS, namHoc];
    if (hocKy) {
      sql += ' AND HocKy = ?';
      params.push(hocKy);
    } else {
      sql += ' ORDER BY HocKy DESC LIMIT 1';
    }
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  }

  static async updateHocBa(maHS, namHoc, hocKy, data) {
    const hanhKiem = data.HanhKiem || null;
    const renLuyen = data.RenLuyen || null;
    const nhanXet = data.NhanXet || null;
    await db.execute(
      `INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, HanhKiem, RenLuyen, NhanXet)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         HanhKiem = VALUES(HanhKiem),
         RenLuyen = VALUES(RenLuyen),
         NhanXet = VALUES(NhanXet)`,
      [maHS, namHoc, hocKy, hanhKiem, renLuyen, nhanXet]
    );
  }

  // TỔNG HỢP HẠNH KIỂM / RÈN LUYỆN THEO NĂM (HK1 + HK2)
  static async getHocBaNam(maHS, namHoc) {
    if (!maHS || !namHoc) return null;

    // Lấy tất cả học kỳ trong năm
    const [rows] = await db.execute(
      `SELECT HanhKiem, RenLuyen, NhanXet 
       FROM HocBa 
       WHERE MaHocSinh = ? AND NamHoc = ?`,
      [maHS, namHoc]
    );

    if (!rows || rows.length === 0) {
      return {
        HanhKiem: '',
        RenLuyen: '',
        NhanXet: ''
      };
    }

    const order = ['Yếu', 'Trung bình', 'Khá', 'Tốt', 'Xuất sắc'];

    // Hạnh kiểm cao nhất trong năm
    const HanhKiem = rows
      .map(r => r.HanhKiem)
      .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] || '';

    // Rèn luyện cao nhất trong năm
    const RenLuyen = rows
      .map(r => r.RenLuyen)
      .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] || '';

    // Nối nhận xét tất cả HK
    const NhanXet = rows.map(r => r.NhanXet).filter(n => n).join('; ');

    return { HanhKiem, RenLuyen, NhanXet };
  }
}

module.exports = QLModel;
