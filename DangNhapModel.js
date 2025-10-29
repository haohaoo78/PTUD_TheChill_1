const db = require('../config/database');
const bcrypt = require('bcrypt');

class TaiKhoan {
  static async login(username, password) {
    try {
      // Lấy thông tin tài khoản
      const [rows] = await db.execute(
        `SELECT 
          TenTaiKhoan,
          MatKhau,
          LoaiTaiKhoan,
          CASE 
            WHEN LoaiTaiKhoan = 'HieuTruong' THEN 
              (SELECT MaHieuTruong FROM HieuTruong WHERE TenTaiKhoan = ?)
            WHEN LoaiTaiKhoan = 'GiaoVien' THEN 
              (SELECT MaGiaoVien FROM GiaoVien WHERE TenTaiKhoan = ?)
            WHEN LoaiTaiKhoan = 'HocSinh' THEN 
              (SELECT MaHocSinh FROM HocSinh WHERE TenTaiKhoan = ?)
            ELSE NULL
          END as UserId
        FROM TaiKhoan 
        WHERE TenTaiKhoan = ?`,
        [username, username, username, username]
      );

      if (rows.length === 0) return null;

      const user = rows[0];

      // So sánh mật khẩu nhập với mật khẩu đã mã hoá
      const isMatch = await bcrypt.compare(password, user.MatKhau);
      if (!isMatch) return null;

      // Xoá trường mật khẩu trước khi trả về
      delete user.MatKhau;

      return user;
    } catch (error) {
      console.error('❌ Lỗi trong TaiKhoan.login:', error);
      throw error;
    }
  }

  static async exists(username) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [username]
    );
    return rows[0].count > 0;
  }

  static async create(username, password, role = 'User') {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, VaiTro) VALUES (?, ?, ?)',
      [username, hashed, role]
    );
  }
}

module.exports = TaiKhoan;
