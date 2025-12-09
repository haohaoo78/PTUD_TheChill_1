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

  // Save multiple nguyện vọng for a ThiSinh (returns array of maNguyenVong)
  static async saveNguyenVong(maThiSinh, nguyenVongArray) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        `SELECT COUNT(*) AS cnt FROM NguyenVong WHERE MaThiSinh = ?`,
        [maThiSinh]
      );
      const currentCount = existing[0].cnt || 0;
      if (currentCount + nguyenVongArray.length > 3) {
        throw new Error('Mỗi thí sinh chỉ được tối đa 3 nguyện vọng');
      }

      const insertedIds = [];
      let thuTu = currentCount + 1;
      for (let nv of nguyenVongArray) {
        const maNguyenVong = await this.getNextMaNguyenVong();
        await connection.query(
          `INSERT INTO NguyenVong (MaNguyenVong, MaThiSinh, MaTruong, ThuTuNguyenVong, ToHopMon, TrangThai) VALUES (?, ?, ?, ?, ?, 'Đang xét')`,
          [maNguyenVong, maThiSinh, nv.MaTruong, thuTu, nv.ToHopMon]
        );
        // If first in list and thuTu == 1, update KetQuaTuyenSinh
        if (thuTu === 1) {
          const [exist] = await connection.query(`SELECT 1 FROM KetQuaTuyenSinh WHERE MaThiSinh = ?`, [maThiSinh]);
          if (exist.length === 0) {
            await connection.query(
              `INSERT INTO KetQuaTuyenSinh (MaThiSinh, NguyenVongTrungTuyen, KhoaHoc, TinhTrang, DiemTrungTuyen, MaToHop) VALUES (?, ?, '2025-2026', 'Chờ xét', NULL, ?)`,
              [maThiSinh, maNguyenVong, nv.ToHopMon]
            );
          } else {
            await connection.query(`UPDATE KetQuaTuyenSinh SET NguyenVongTrungTuyen = ?, MaToHop = ? WHERE MaThiSinh = ?`, [maNguyenVong, nv.ToHopMon, maThiSinh]);
          }
        }

        insertedIds.push(maNguyenVong);
        thuTu++;
      }
      await connection.commit();
      return insertedIds;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async deleteNguyenVong(maNguyenVong) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(`SELECT MaThiSinh FROM NguyenVong WHERE MaNguyenVong = ?`, [maNguyenVong]);
      if (!rows.length) throw new Error('Nguyện vọng không tồn tại');
      const maThiSinh = rows[0].MaThiSinh;

      // If this nguyện vọng is current trúng tuyển, clear
      await connection.query(`UPDATE KetQuaTuyenSinh SET NguyenVongTrungTuyen = NULL WHERE MaThiSinh = ? AND NguyenVongTrungTuyen = ?`, [maThiSinh, maNguyenVong]);

      await connection.query(`DELETE FROM NguyenVong WHERE MaNguyenVong = ?`, [maNguyenVong]);
      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = DangKyTuyenSinhModel;
