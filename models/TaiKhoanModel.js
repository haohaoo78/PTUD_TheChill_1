const db = require('../config/database');
const bcrypt = require('bcrypt');

const TaiKhoanModel = {

  // Lấy danh sách tài khoản, có lọc search, loai, trangthai
  async getList({ search = '', loai = '', trangthai = '' } = {}) {
    let sql = `SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai, MatKhauGoc FROM TaiKhoan WHERE 1=1`;
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

  // Lấy tất cả tài khoản
  async getAll() {
    const [rows] = await db.execute(
      'SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai, MatKhauGoc FROM TaiKhoan ORDER BY TenTaiKhoan'
    );
    return rows;
  },

  // Lấy 1 tài khoản theo TenTaiKhoan
  async getOne(ma) {
    const [rows] = await db.execute(
      'SELECT TenTaiKhoan, LoaiTaiKhoan, TrangThai, MatKhauGoc FROM TaiKhoan WHERE TenTaiKhoan = ? LIMIT 1',
      [ma]
    );
    return rows[0] || null;
  },

  // Kiểm tra tài khoản có tồn tại
  async isExists(ma) {
    const [rows] = await db.execute(
      'SELECT 1 FROM TaiKhoan WHERE TenTaiKhoan = ? LIMIT 1',
      [ma]
    );
    return rows.length > 0;
  },

  // Tạo mới tài khoản
  async create(ma, password, loaiTK, trangThai = 1) {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, MatKhauGoc, LoaiTaiKhoan, TrangThai) VALUES (?, ?, ?, ?, ?)',
      [ma, hashed, password, loaiTK, trangThai]
    );
  },

  // Cập nhật tài khoản
  async update(ma, data) {
    const fields = [];
    const values = [];

    if (data.MatKhau) {
      const hashed = await bcrypt.hash(data.MatKhau, 10);
      fields.push('MatKhau = ?', 'MatKhauGoc = ?');
      values.push(hashed, data.MatKhau);
    }

    if (data.LoaiTaiKhoan) {
      fields.push('LoaiTaiKhoan = ?');
      values.push(data.LoaiTaiKhoan);
    }

    if (data.TrangThai !== undefined) {
      fields.push('TrangThai = ?');
      values.push(data.TrangThai);
    }

    if (fields.length === 0) return;
    values.push(ma);

    await db.execute(
      `UPDATE TaiKhoan SET ${fields.join(', ')} WHERE TenTaiKhoan = ?`,
      values
    );
  },

  // Xóa tài khoản
  async delete(ma) {
    await db.execute(
      'DELETE FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [ma]
    );
  }
};

module.exports = TaiKhoanModel;
