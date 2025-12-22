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
    // ==================== QUẢN LÝ HIỆU TRƯỞNG ====================

  // Lấy thông tin hiệu trưởng của một trường (nếu có)
  static async getHieuTruongByMaTruong(MaTruong) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM HieuTruong WHERE MaTruong = ?`,
        [MaTruong]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Lỗi getHieuTruongByMaTruong:', err);
      throw err;
    }
  }

  // Thêm hiệu trưởng mới cho trường
  static async createHieuTruong(hieuTruongData) {
    const {
      MaHieuTruong,
      TenHieuTruong,
      NgaySinh,
      GioiTinh,
      Email,
      SDT,
      NgayNhanChuc,
      DiaChi,
      GhiChu,
      ThoiGianCongTac = 0,
      MaTruong
    } = hieuTruongData;

    try {
      // Kiểm tra xem trường đã có hiệu trưởng chưa
      const existing = await this.getHieuTruongByMaTruong(MaTruong);
      if (existing) {
        throw new Error('Trường này đã có hiệu trưởng');
      }

      const [result] = await db.execute(
        `INSERT INTO HieuTruong 
         (MaHieuTruong, TenHieuTruong, NgaySinh, GioiTinh, Email, SDT, 
          NgayNhanChuc, DiaChi, GhiChu, ThoiGianCongTac, MaTruong)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [MaHieuTruong, TenHieuTruong, NgaySinh, GioiTinh, Email, SDT,
         NgayNhanChuc, DiaChi, GhiChu, ThoiGianCongTac, MaTruong]
      );
      return result;
    } catch (err) {
      console.error('Lỗi createHieuTruong:', err);
      throw err;
    }
  }

  // Cập nhật thông tin hiệu trưởng
  static async updateHieuTruong(MaTruong, hieuTruongData) {
    const {
      TenHieuTruong,
      NgaySinh,
      GioiTinh,
      Email,
      SDT,
      NgayNhanChuc,
      DiaChi,
      GhiChu,
      ThoiGianCongTac
    } = hieuTruongData;

    try {
      const [result] = await db.execute(
        `UPDATE HieuTruong 
         SET TenHieuTruong = ?, NgaySinh = ?, GioiTinh = ?, Email = ?, SDT = ?,
             NgayNhanChuc = ?, DiaChi = ?, GhiChu = ?, ThoiGianCongTac = ?
         WHERE MaTruong = ?`,
        [TenHieuTruong, NgaySinh, GioiTinh, Email, SDT,
         NgayNhanChuc, DiaChi, GhiChu, ThoiGianCongTac || 0, MaTruong]
      );
      return result;
    } catch (err) {
      console.error('Lỗi updateHieuTruong:', err);
      throw err;
    }
  }

  // Xóa hiệu trưởng của trường (nếu cần)
  static async deleteHieuTruong(MaTruong) {
    try {
      const [result] = await db.execute(
        `DELETE FROM HieuTruong WHERE MaTruong = ?`,
        [MaTruong]
      );
      return result;
    } catch (err) {
      console.error('Lỗi deleteHieuTruong:', err);
      throw err;
    }
  }

  // Kiểm tra email hiệu trưởng đã tồn tại chưa (tránh trùng)
  static async isEmailHieuTruongExists(Email, excludeMaTruong = null) {
    let query = `SELECT COUNT(*) as count FROM HieuTruong WHERE Email = ?`;
    let params = [Email];
    if (excludeMaTruong) {
      query += ` AND MaTruong != ?`;
      params.push(excludeMaTruong);
    }
    const [rows] = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = QuanLyTruongModel;
