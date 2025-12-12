const db = require('../config/database');
const bcrypt = require('bcrypt');

const TaiKhoanModel = {

  // ==================== LẤY DANH SÁCH (có lọc search, loại, trạng thái) ====================
  async getList({ search = '', loai = '', trangthai = '' } = {}) {
    let sql = `SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai FROM TaiKhoan WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND TenTaiKhoan LIKE ?`;
      params.push(`%${search}%`);
    }
    if (loai) {
      sql += ` AND LoaiTaiKhoan = ?`;
      params.push(loai);
    }
    if (trangthai !== '' && trangthai !== null) {
      sql += ` AND TrangThai = ?`;
      params.push(parseInt(trangthai));
    }

    sql += ` ORDER BY TenTaiKhoan`;
    const [rows] = await db.execute(sql, params);
    return rows;
  },

  // ==================== LẤY TẤT CẢ ====================
  async getAll() {
    const [rows] = await db.execute(
      'SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai FROM TaiKhoan ORDER BY TenTaiKhoan'
    );
    return rows;
  },

  // ==================== LẤY 1 TÀI KHOẢN ====================
  async getOne(ma) {
    const [rows] = await db.execute(
      'SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai FROM TaiKhoan WHERE TenTaiKhoan = ? LIMIT 1',
      [ma]
    );
    return rows[0] || null;
  },

  // ==================== KIỂM TRA TỒN TẠI ====================
  async isExists(ma) {
    const [rows] = await db.execute(
      'SELECT 1 FROM TaiKhoan WHERE TenTaiKhoan = ? LIMIT 1',
      [ma]
    );
    return rows.length > 0;
  },

  // ==================== TẠO MỚI TÀI KHOẢN ====================
  async create(ma, password, loaiTK, trangThai = 1) {
    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan, TrangThai) VALUES (?, ?, ?, ?)',
      [ma, hashed, loaiTK, trangThai]
    );
  },

  // ==================== CẬP NHẬT TÀI KHOẢN ====================
  async update(ma, data) {
    const fields = [];
    const values = [];

    // Cập nhật mật khẩu
    if (data.MatKhau) {
      const hashed = await bcrypt.hash(data.MatKhau, 10);
      fields.push('MatKhau = ?');
      values.push(hashed);
    }

    // Cập nhật loại tài khoản
    if (data.LoaiTaiKhoan) {
      fields.push('LoaiTaiKhoan = ?');
      values.push(data.LoaiTaiKhoan);
    }

    // Cập nhật trạng thái
    if (data.TrangThai !== undefined) {
      fields.push('TrangThai = ?');
      values.push(data.TrangThai);
    }

    if (fields.length === 0) return; // Không có gì để cập nhật

    values.push(ma);

    await db.execute(
      `UPDATE TaiKhoan SET ${fields.join(', ')} WHERE TenTaiKhoan = ?`,
      values
    );
  },

  // ==================== XOÁ TÀI KHOẢN ====================
  async delete(ma) {
    await db.execute(
      'DELETE FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [ma]
    );
  }
};

module.exports = TaiKhoanModel;
