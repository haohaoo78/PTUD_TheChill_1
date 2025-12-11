// models/DangKyTuyenSinhModel.js
const db = require('../config/database');

class DangKyTuyenSinhModel {

  static async getThiSinh(maThiSinh) {
    const [rows] = await db.query(
      `SELECT * FROM ThiSinhDuThi WHERE MaThiSinh = ?`,
      [maThiSinh]
    );
    return rows[0] || null;
  }

  static async getDanhSachTruong() {
    const [rows] = await db.query(
      `SELECT MaTruong, TenTruong FROM Truong WHERE TrangThai = 1 ORDER BY TenTruong`
    );
    return rows;
  }

  static async getDanhSachToHop() {
    const [rows] = await db.query(
      `SELECT MaToHop, TenToHop FROM ToHopMon ORDER BY MaToHop`
    );
    return rows;
  }

  static async getNguyenVong(maThiSinh) {
    const [rows] = await db.query(
      `SELECT nv.*, t.TenTruong, th.TenToHop 
       FROM NguyenVong nv
       JOIN Truong t ON nv.MaTruong = t.MaTruong
       JOIN ToHopMon th ON nv.ToHopMon = th.MaToHop
       WHERE nv.MaThiSinh = ?
       ORDER BY nv.ThuTuNguyenVong`,
      [maThiSinh]
    );
    return rows;
  }

  static async getNextMaNguyenVong() {
    const [rows] = await db.query(
      `SELECT MaNguyenVong FROM NguyenVong ORDER BY MaNguyenVong DESC LIMIT 1`
    );
    if (!rows.length) return 'NV001';
    const last = rows[0].MaNguyenVong;
    const num = parseInt(last.replace('NV', ''), 10) + 1;
    return 'NV' + String(num).padStart(3, '0');
  }

  static async themNguyenVong(maNguyenVong, maThiSinh, maTruong, thuTu, toHopMon) {
    await db.query(
      `INSERT INTO NguyenVong 
       (MaNguyenVong, MaThiSinh, MaTruong, ThuTuNguyenVong, ToHopMon, TrangThai)
       VALUES (?, ?, ?, ?, ?, 'Đang xét')`,
      [maNguyenVong, maThiSinh, maTruong, thuTu, toHopMon]
    );
  }

  static async capNhatKetQuaTuyenSinh(maThiSinh, maNguyenVong, toHopMon) {
    const [exist] = await db.query(
      `SELECT 1 FROM KetQuaTuyenSinh WHERE MaThiSinh = ?`,
      [maThiSinh]
    );

    if (exist.length === 0) {
      await db.query(
        `INSERT INTO KetQuaTuyenSinh 
         (MaThiSinh, NguyenVongTrungTuyen, KhoaHoc, TinhTrang, DiemTrungTuyen, MaToHop)
         VALUES (?, ?, '2025-2026', 'Chờ xét', NULL, ?)`,
        [maThiSinh, maNguyenVong, toHopMon]
      );
    } else {
      await db.query(
        `UPDATE KetQuaTuyenSinh 
         SET NguyenVongTrungTuyen = ?, MaToHop = ? 
         WHERE MaThiSinh = ?`,
        [maNguyenVong, toHopMon, maThiSinh]
      );
    }
  }

  // ⭐ LẤY THÔNG TIN PHÒNG THI
  static async getThongTinPhongThi(maThiSinh) {
    const [rows] = await db.query(
      `
      SELECT 
        pt.MaPhongThi,
        pt.DiaDiemThi,
        pt.NgayThi,
        t.TenTruong
      FROM NguyenVong nv
      JOIN Truong t ON nv.MaTruong = t.MaTruong
      JOIN PhongThi pt ON t.MaTruong = pt.MaTruong
      WHERE nv.MaThiSinh = ?
      ORDER BY nv.ThuTuNguyenVong ASC
      LIMIT 1
      `,
      [maThiSinh]
    );
    return rows[0] || null;
  }

  static async checkTrungNV(maThiSinh, maTruong, toHop) {
  const [rows] = await db.query(
    `SELECT 1 FROM NguyenVong WHERE MaThiSinh=? AND MaTruong=? AND ToHopMon=?`,
    [maThiSinh, maTruong, toHop]
  );
  return rows.length > 0;
}
}


module.exports = DangKyTuyenSinhModel;
