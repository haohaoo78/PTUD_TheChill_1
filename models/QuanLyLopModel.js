// models/QuanLyLopModel.js
const db = require('../config/database');

class QuanLyLopModel {
  static async getKhoiList() {
    const [rows] = await db.execute('SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY TenKhoi');
    return rows;
  }

  static async getClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute(`
      SELECT DISTINCT l.MaLop, l.TenLop, l.Khoi, l.MaToHop, l.TrangThai, l.SiSo,
             (SELECT TenGiaoVien FROM GiaoVien gv 
              INNER JOIN GVChuNhiem gvcn ON gv.MaGiaoVien = gvcn.MaGVCN 
              WHERE gvcn.MaLop = l.MaLop LIMIT 1) AS TenGVCN
      FROM Lop l
      WHERE l.Khoi = ?
      ORDER BY l.TenLop
    `, [MaKhoi]);
    return rows;
  }

  static async countClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM Lop WHERE Khoi = ?', [MaKhoi]);
    return rows[0]?.cnt || 0;
  }

  static async classExists(TenLop, MaLop = null) {
    let sql = 'SELECT COUNT(*) as cnt FROM Lop WHERE TenLop = ?';
    const params = [TenLop];
    if (MaLop) {
      sql += ' AND MaLop != ?';
      params.push(MaLop);
    }
    const [rows] = await db.execute(sql, params);
    return rows[0]?.cnt > 0;
  }

static async createClasses(MaKhoi, number) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get the highest existing sequence number for this Khoi
    const [maxRes] = await conn.execute(`
      SELECT MAX(CAST(SUBSTRING(MaLop, 4) AS UNSIGNED)) AS MaxSeq
      FROM Lop
      WHERE Khoi = ?
    `, [MaKhoi]);
    const maxSeq = maxRes[0]?.MaxSeq || 0;
    
    const [truongRes] = await conn.execute('SELECT MaTruong FROM Truong LIMIT 1');
    const maTruong = truongRes[0]?.MaTruong || 'T01';
    
    for (let i = 1; i <= number; i++) {
      const seq = maxSeq + i;
      const maLop = `${MaKhoi}${seq.toString().padStart(2, '0')}`;
      
      // Check if MaLop already exists
      const [existing] = await conn.execute('SELECT MaLop FROM Lop WHERE MaLop = ?', [maLop]);
      if (existing.length > 0) {
        continue; // Skip if already exists
      }
      
      const tenLop = `Lớp ${seq.toString().padStart(2, '0')} Khối ${MaKhoi.replace('K', '')}`;

      // ❗❗ FIXED: Gửi trạng thái đúng ENUM
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


  static async getTeachers() {
    const [rows] = await db.execute('SELECT MaGiaoVien, TenGiaoVien FROM GiaoVien WHERE TrangThai = "Đang công tác" ORDER BY TenGiaoVien');
    return rows;
  }

  static async updateClass(maLop, data) {
    const fields = [];
    const params = [];
    if (data.TenLop) {
      if (await this.classExists(data.TenLop, maLop)) throw new Error('Tên lớp đã tồn tại');
      if (!/^[a-zA-ZÀ-ỹ0-9\s]+$/.test(data.TenLop)) throw new Error('Tên lớp không hợp lệ');
      fields.push('TenLop = ?');
      params.push(data.TenLop);
    }
    if (data.Khoi) { fields.push('Khoi = ?'); params.push(data.Khoi); }
    if (data.TrangThai) { fields.push('TrangThai = ?'); params.push(data.TrangThai); }
    if (data.SiSo !== undefined) { fields.push('SiSo = ?'); params.push(data.SiSo); }
    params.push(maLop);
    if (fields.length === 0) throw new Error('Không có dữ liệu để cập nhật');
    const sql = `UPDATE Lop SET ${fields.join(', ')} WHERE MaLop = ?`;
    await db.execute(sql, params);
  }

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