const db = require('../config/database');

const DangKyModel = {
  // Kiểm tra tài khoản trùng (username = phone)
  findByUsername: async (phone) => {
    const [rows] = await db.execute(
      'SELECT * FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [phone]
    );
    return rows[0];
  },

  // Kiểm tra mã học sinh tồn tại (chỉ kiểm tra có hay không)
  findStudentById: async (studentId) => {
    const [rows] = await db.execute(
      'SELECT 1 FROM HocSinh WHERE MaHocSinh = ?',
      [studentId]
    );
    return rows[0];
  },

  // Lấy thông tin tên + lớp để hiển thị realtime
  findStudentInfoById: async (maHocSinh) => {
    const query = `
      SELECT 
        hs.TenHocSinh, 
        COALESCE(l.TenLop, 'Chưa phân lớp') AS TenLop
      FROM HocSinh hs
      LEFT JOIN Lop l ON hs.MaLop = l.MaLop
      WHERE hs.MaHocSinh = ?
    `;
    const [rows] = await db.query(query, [maHocSinh.trim()]);
    return rows.length > 0 ? rows[0] : null;
  },

  // Kiểm tra xem học sinh đã có phụ huynh đăng ký chưa
  checkParentExists: async (studentId) => {
    const [rows] = await db.execute(
      'SELECT HoTen, SDT FROM PhuHuynh WHERE MaHocSinh = ?',
      [studentId]
    );
    return rows[0] || null;
  },

  // Tạo tài khoản phụ huynh
  createUser: async (username, password, studentId, phone, fullName) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Thêm vào bảng TaiKhoan
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
      console.log('✅ Đăng ký phụ huynh thành công cho học sinh:', studentId);
    } catch (err) {
      await conn.rollback();
      console.error('❌ Lỗi khi tạo tài khoản phụ huynh:', err);
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = DangKyModel;