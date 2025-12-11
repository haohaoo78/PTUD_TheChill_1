// models/QuanLyTruongModels.js
const db = require('../config/database');

class QuanLyTruongModel {

  // ==================== LỌC ====================
  static async getFiltered(keyword, trangthai) {
    try {
      let query = `
        SELECT t.*, COALESCE(h.TenHieuTruong, 'Chưa có') AS TenHieuTruong
        FROM Truong t
        LEFT JOIN HieuTruong h ON t.MaTruong = h.MaTruong
        WHERE 1=1
      `;
      let params = [];

      if (keyword) {
        query += ` AND (t.MaTruong LIKE ? OR t.TenTruong LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      if (trangthai === '1' || trangthai === '0') {
        query += ` AND t.TrangThai = ?`;
        params.push(trangthai);
      }

      query += ` ORDER BY t.MaTruong`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (err) {
      console.error('Lỗi getFiltered:', err);
      return [];
    }
  }

  // ==================== LẤY TẤT CẢ ====================
  static async getAll(filters) {
  try {
    let query = `
      SELECT 
        t.MaTruong, t.TenTruong, t.DiaChi, t.Email, t.SDT, t.TrangThai,
        COALESCE(h.TenHieuTruong, 'Chưa có') AS TenHieuTruong
      FROM Truong t
      LEFT JOIN HieuTruong h ON t.MaTruong = h.MaTruong
      WHERE 1 = 1
    `;

    const params = [];

    // Lọc theo Mã Trường
    if (filters.MaTruong) {
      query += ` AND t.MaTruong LIKE ?`;
      params.push(`%${filters.MaTruong}%`);
    }

    // Lọc theo Tên Trường
    if (filters.TenTruong) {
      query += ` AND t.TenTruong LIKE ?`;
      params.push(`%${filters.TenTruong}%`);
    }

    // Lọc theo Trạng Thái
    if (filters.TrangThai && filters.TrangThai !== "all") {
      query += ` AND t.TrangThai = ?`;
      params.push(filters.TrangThai);
    }

    query += ` ORDER BY t.MaTruong`;

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    console.error('Lỗi getAll:', err);
    return [];
  }
}

  static async getById(MaTruong) {
    const [rows] = await db.execute(`SELECT * FROM Truong WHERE MaTruong = ?`, [MaTruong]);
    return rows[0] || null;
  }

  static async create(truong) {
    const { MaTruong, TenTruong, DiaChi, Email, SDT } = truong;
    const TrangThai = 1;

    const [result] = await db.execute(
      `INSERT INTO Truong (MaTruong, TenTruong, DiaChi, Email, SDT, TrangThai)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [MaTruong, TenTruong, DiaChi, Email, SDT, TrangThai]
    );
    return result;
  }

  static async update(MaTruong, t) {
    const { TenTruong, DiaChi, Email, SDT, TrangThai } = t;

    const [res] = await db.execute(
      `UPDATE Truong SET TenTruong=?, DiaChi=?, Email=?, SDT=?, TrangThai=? WHERE MaTruong=?`,
      [TenTruong, DiaChi, Email, SDT, TrangThai ?? 1, MaTruong]
    );
    return res;
  }

  static async delete(MaTruong) {
    const [res] = await db.execute('DELETE FROM Truong WHERE MaTruong=?', [MaTruong]);
    return res;
  }

  static async isMaTruongExists(MaTruong, exclude = null) {
    let q = `SELECT COUNT(*) as count FROM Truong WHERE MaTruong=?`;
    let p = [MaTruong];
    if (exclude) {
      q += ` AND MaTruong != ?`;
      p.push(exclude);
    }
    const [rows] = await db.execute(q, p);
    return rows[0].count > 0;
  }

  static async isEmailExists(Email, exclude = null) {
    let q = `SELECT COUNT(*) as count FROM Truong WHERE Email=?`;
    let p = [Email];
    if (exclude) {
      q += ` AND MaTruong != ?`;
      p.push(exclude);
    }
    const [rows] = await db.execute(q, p);
    return rows[0].count > 0;
  }
}

module.exports = QuanLyTruongModel;
