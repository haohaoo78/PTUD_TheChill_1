// models/DangKyModel.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

const DangKyModel = {

  // Kiểm tra số điện thoại đã đăng ký chưa (username = phone)
  findByUsername: async (phone) => {
    const [rows] = await db.execute(
      'SELECT * FROM TaiKhoan WHERE TenTaiKhoan = ?',
      [phone]
    );
    return rows[0];
  },

  // Kiểm tra mã học sinh tồn tại
  findStudentById: async (studentId) => {
    const [rows] = await db.execute(
      'SELECT * FROM HocSinh WHERE MaHocSinh = ?',
      [studentId]
    );
    return rows[0];
  },

  // LẤY DANH SÁCH TRƯỜNG
  getSchools: async () => {
    const [rows] = await db.execute(
      `SELECT MaTruong, TenTruong 
       FROM Truong 
       WHERE TrangThai = 1 
       ORDER BY TenTruong`
    );
    return rows;
  },

  // LẤY DANH SÁCH LỚP THEO TRƯỜNG (bảng đúng: Lop)
  getClassesBySchool: async (schoolId) => {
    const [rows] = await db.execute(
      `SELECT MaLop, TenLop 
       FROM Lop 
       WHERE MaTruong = ? AND TrangThai = 'Đang học' 
       ORDER BY TenLop`,
      [schoolId]
    );
    return rows;
  },

  // LẤY DANH SÁCH HỌC SINH THEO LỚP (SỬA: HoTen → TenHocSinh)
  getStudentsByClass: async (classId) => {
    const [rows] = await db.execute(
      `SELECT MaHocSinh, TenHocSinh AS HoTen 
       FROM HocSinh 
       WHERE MaLop = ? AND TrangThai = 'Đang học' 
       ORDER BY TenHocSinh`,
      [classId]
    );
    return rows;
  },

  // TẠO TÀI KHOẢN + PHỤ HUYNH
  createUser: async (username, password, studentId, phone, fullName) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan)
         VALUES (?, ?, 'Phụ huynh')`,
        [username, password]
      );

      await conn.execute(
        `INSERT INTO PhuHuynh (HoTen, SDT, MaHocSinh)
         VALUES (?, ?, ?)`,
        [fullName, phone, studentId]
      );

      await conn.commit();
      console.log('Tạo tài khoản phụ huynh thành công! Mã học sinh:', studentId);
    } catch (err) {
      await conn.rollback();
      console.error('Lỗi khi tạo tài khoản phụ huynh:', err);
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = DangKyModel;