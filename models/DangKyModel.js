const db = require('../config/database');

const DangKyModel = {
  // 🔍 Kiểm tra tài khoản trùng (username = phone)
  findByUsername: async (phone) => {
    const [rows] = await db.execute(
      'SELECT * FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [phone]
    );
    return rows[0];
  },

  // 🔍 Kiểm tra mã học sinh tồn tại
  findStudentById: async (studentId) => {
    const [rows] = await db.execute(
      'SELECT * FROM HocSinh WHERE MaHocSinh = ?',
      [studentId]
    );
    return rows[0];
  },

  // 🧩 Tạo tài khoản và phụ huynh
  createUser: async (username, password, studentId, phone, fullName) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Thêm vào bảng TaiKhoan (username = phone)
      await conn.execute(
        `INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan)
         VALUES (?, ?, 'Phụ huynh')`,
        [username, password]
      );

      // Thêm vào bảng PhuHuynh
      await conn.execute(
        `INSERT INTO PhuHuynh (HoTen, SDT, MaHocSinh)
         VALUES (?, ?, ?)`,
        [fullName, phone, studentId]
      );

      await conn.commit();
      console.log('✅ Tạo tài khoản và phụ huynh thành công!');
    } catch (err) {
      await conn.rollback();
      console.error('❌ Lỗi khi tạo tài khoản:', err);
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = DangKyModel;
