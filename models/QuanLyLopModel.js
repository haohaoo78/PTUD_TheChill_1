// models/QuanLyLopModel.js
const db = require('../config/database');

class QuanLyLopModel {
  static async getKhoiList(maTruong) {
    // Lọc khối chỉ thuộc trường
    const [rows] = await db.execute(`
      SELECT DISTINCT k.MaKhoi, k.TenKhoi
      FROM Khoi k
      JOIN Lop l ON l.Khoi = k.MaKhoi
      WHERE l.MaTruong = ?
      ORDER BY k.TenKhoi
    `, [maTruong]);
    return rows;
  }

  static async getClassesByKhoi(MaKhoi, maTruong) {
    const [rows] = await db.execute(`
      SELECT DISTINCT l.MaLop, l.TenLop, l.Khoi, l.MaToHop, l.TrangThai, l.SiSo,
             (SELECT TenGiaoVien FROM GiaoVien gv 
              INNER JOIN GVChuNhiem gvcn ON gv.MaGiaoVien = gvcn.MaGVCN 
              WHERE gvcn.MaLop = l.MaLop LIMIT 1) AS TenGVCN
      FROM Lop l
      WHERE l.Khoi = ? AND l.MaTruong = ?
      ORDER BY l.TenLop
    `, [MaKhoi, maTruong]);
    return rows;
  }

  static async countClassesByKhoi(MaKhoi, maTruong) {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM Lop WHERE Khoi = ? AND MaTruong = ?', [MaKhoi, maTruong]);
    return rows[0]?.cnt || 0;
  }


  static async createClasses(MaKhoi, number, maTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [maxRes] = await conn.execute(`
        SELECT MAX(CAST(SUBSTRING(MaLop, 4) AS UNSIGNED)) AS MaxSeq
        FROM Lop
        WHERE Khoi = ? AND MaTruong = ?
      `, [MaKhoi, maTruong]);
      const maxSeq = maxRes[0]?.MaxSeq || 0;

      for (let i = 1; i <= number; i++) {
        const seq = maxSeq + i;
        const maLop = `${MaKhoi}${seq.toString().padStart(2, '0')}`;

        const [existing] = await conn.execute('SELECT MaLop FROM Lop WHERE MaLop = ? AND MaTruong = ?', [maLop, maTruong]);
        if (existing.length > 0) {
          continue;
        }

        const tenLop = `Lớp ${seq.toString().padStart(2, '0')} Khối ${MaKhoi.replace('K', '')}`;
        const trangThaiMacDinh = "Đang học";

        await conn.execute(`
          INSERT INTO Lop (MaLop, TenLop, MaToHop, TrangThai, Khoi, SiSo, MaTruong)
          VALUES (?, ?, NULL, ?, ?, 0, ?)
        `, [maLop, tenLop, trangThaiMacDinh, MaKhoi, maTruong]);
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

  static async getTeachers(maTruong) {
    // Chỉ lấy giáo viên thuộc trường
    const [rows] = await db.execute(`
      SELECT MaGiaoVien, TenGiaoVien 
      FROM GiaoVien 
      WHERE TrangThai = "Đang công tác" AND MaTruong = ?
      ORDER BY TenGiaoVien
    `, [maTruong]);
    return rows;
  }

  // models/QuanLyLopModel.js
// ... (giữ nguyên các hàm khác)

  static async classExists(TenLop, maTruong, MaLop = null) {
    if (!maTruong) return false; // Nếu không có mã trường thì coi như không tồn tại (an toàn)

    let sql = 'SELECT COUNT(*) as cnt FROM Lop WHERE TenLop = ? AND MaTruong = ?';
    const params = [TenLop, maTruong];
    if (MaLop) {
      sql += ' AND MaLop != ?';
      params.push(MaLop);
    }
    const [rows] = await db.execute(sql, params);
    return rows[0]?.cnt > 0;
  }

  static async updateClass(maLop, data) {
    const { TenLop, Khoi, TrangThai, SiSo, maTruong } = data; // Lấy maTruong từ data

    const fields = [];
    const params = [];

    if (TenLop !== undefined) {
      if (await this.classExists(TenLop, maTruong, maLop)) {
        throw new Error('Tên lớp đã tồn tại trong trường của bạn');
      }
      if (!/^[a-zA-ZÀ-ỹ0-9\s]+$/.test(TenLop)) {
        throw new Error('Tên lớp không hợp lệ');
      }
      fields.push('TenLop = ?');
      params.push(TenLop);
    }
    if (Khoi !== undefined) { fields.push('Khoi = ?'); params.push(Khoi); }
    if (TrangThai !== undefined) { fields.push('TrangThai = ?'); params.push(TrangThai); }
    if (SiSo !== undefined) { fields.push('SiSo = ?'); params.push(parseInt(SiSo, 10)); }

    if (fields.length === 0) throw new Error('Không có dữ liệu để cập nhật');

    params.push(maLop);
    const sql = `UPDATE Lop SET ${fields.join(', ')} WHERE MaLop = ?`;
    await db.execute(sql, params);
  }

// ... (giữ nguyên các hàm khác)
  static async assignGVCN(maLop, maGVCN, namHoc = '2025-2026') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?', [maLop, namHoc]);
      if (maGVCN) {
        await conn.execute('INSERT INTO GVChuNhiem (MaGVCN, MaLop, NamHoc) VALUES (?, ?, ?)', [maGVCN, maLop, namHoc]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteClass(maLop) {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM HocSinh WHERE MaLop = ?', [maLop]);
    if (rows[0].cnt > 0) throw new Error('Không thể xóa lớp vì còn học sinh. Vui lòng xử lý dữ liệu trước.');
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM GVChuNhiem WHERE MaLop = ?', [maLop]);
      await conn.execute('DELETE FROM GVBoMon WHERE MaLop = ?', [maLop]);
      await conn.execute('DELETE FROM Lop WHERE MaLop = ?', [maLop]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = QuanLyLopModel;