// models/PhanLopModel.js
const db = require('../config/database');

class PhanLopModel {
  static async getKhoiList(maTruong) {
    try {
      const [rows] = await db.execute(`
        SELECT DISTINCT k.MaKhoi, k.TenKhoi
        FROM Khoi k
        JOIN Lop l ON l.Khoi = k.MaKhoi
        WHERE l.MaTruong = ?
        ORDER BY k.MaKhoi
      `, [maTruong]);
      return rows;
    } catch (error) {
      console.error('❌ Error in getKhoiList:', error);
      throw error;
    }
  }

  // Học sinh đã có lớp: lọc theo MaTruong của lớp
  // Học sinh chưa có lớp: lọc theo MaTruong của học sinh (giả sử có cột MaTruong trong HocSinh hoặc từ trường nhập học)
  static async getStudentsByKhoi(maKhoi, maTruong) {
    try {
      console.log('🔍 Getting students for khoi:', maKhoi, 'Trường:', maTruong);

      let namBatDau = '2025';
      const [namHocRows] = await db.execute(
        'SELECT NamHoc FROM HocKy WHERE TrangThai = "Đang học" ORDER BY NamHoc DESC LIMIT 1'
      );
      if (namHocRows.length > 0) {
        const namHocHienTai = namHocRows[0].NamHoc;
        const namHienTai = parseInt(namHocHienTai.split('-')[0]);
        if (maKhoi === 'K02') namBatDau = (namHienTai - 1).toString();
        else if (maKhoi === 'K03') namBatDau = (namHienTai - 2).toString();
        else namBatDau = namHienTai.toString();
      }

      const sql = `
        SELECT hs.MaHocSinh, hs.TenHocSinh, hs.KhoaHoc, hs.GioiTinh,
               hs.ToHop AS MaToHop, COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop,
               hs.TrangThai, hs.MaLop
        FROM HocSinh hs
        LEFT JOIN ToHopMon th ON hs.ToHop = th.MaToHop
        LEFT JOIN Lop l ON hs.MaLop = l.MaLop
        WHERE hs.TrangThai = 'Đang học'
          AND hs.MaTruong = ?  -- LỌC THEO MÃ TRƯỜNG CỦA HỌC SINH
          AND (
            (hs.MaLop IS NOT NULL AND hs.MaLop != '' AND l.Khoi = ?)  -- HS đã có lớp thuộc khối
            OR
            (hs.MaLop IS NULL OR hs.MaLop = '') AND LEFT(hs.KhoaHoc, 4) = ?  -- HS chưa lớp, năm học phù hợp
          )
        ORDER BY hs.MaLop, hs.ToHop, hs.TenHocSinh
      `;
      const [rows] = await db.execute(sql, [maTruong, maKhoi, namBatDau]);
      console.log(`✅ Found ${rows.length} students for khoi ${maKhoi} in school ${maTruong}`);
      return rows;
    } catch (error) {
      console.error('❌ Error in getStudentsByKhoi:', error);
      throw error;
    }
  }

  static async getClassesByKhoi(maKhoi, maTruong) {
    try {
      const [rows] = await db.execute(`
        SELECT l.MaLop, l.TenLop, l.SiSo, l.MaToHop,
               COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop,
               COALESCE(COUNT(hs.MaHocSinh), 0) AS CurrentCount
        FROM Lop l
        LEFT JOIN ToHopMon th ON l.MaToHop = th.MaToHop
        LEFT JOIN HocSinh hs ON l.MaLop = hs.MaLop AND hs.TrangThai = 'Đang học'
        WHERE l.Khoi = ? AND l.MaTruong = ? AND l.TrangThai = 'Đang học'
        GROUP BY l.MaLop, l.TenLop, l.SiSo, l.MaToHop, th.TenToHop
        ORDER BY l.TenLop
      `, [maKhoi, maTruong]);
      return rows;
    } catch (error) {
      console.error('❌ Error in getClassesByKhoi:', error);
      throw error;
    }
  }

  static async saveAssignments(assignments, maTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const { MaHocSinh, MaLop } of assignments) {
        if (MaLop) {
          const [lopCheck] = await conn.execute('SELECT 1 FROM Lop WHERE MaLop = ? AND MaTruong = ?', [MaLop, maTruong]);
          if (lopCheck.length === 0) continue;
        }

        await conn.execute(
          'UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ? AND MaTruong = ?',
          [MaLop || null, MaHocSinh, maTruong]
        );
      }
      await conn.commit();
      return { success: true, message: 'Phân lớp thành công!' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getStudentsInClass(maLop, maTruong) {
    try {
      const [lopCheck] = await db.execute('SELECT 1 FROM Lop WHERE MaLop = ? AND MaTruong = ?', [maLop, maTruong]);
      if (lopCheck.length === 0) return [];

      const [rows] = await db.execute(`
        SELECT hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh, hs.TrangThai,
               hs.ToHop AS MaToHop, COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop
        FROM HocSinh hs
        LEFT JOIN ToHopMon th ON hs.ToHop = th.MaToHop
        WHERE hs.MaLop = ? AND hs.TrangThai = 'Đang học' AND hs.MaTruong = ?
        ORDER BY hs.TenHocSinh
      `, [maLop, maTruong]);
      return rows;
    } catch (error) {
      console.error('❌ Error in getStudentsInClass:', error);
      throw error;
    }
  }

  static async updateStudentClass(maHocSinh, maLop, maTruong) {
    try {
      if (maLop) {
        const [lopCheck] = await db.execute('SELECT 1 FROM Lop WHERE MaLop = ? AND MaTruong = ?', [maLop, maTruong]);
        if (lopCheck.length === 0) return false;
      }

      const [result] = await db.execute(
        'UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ? AND MaTruong = ?',
        [maLop || null, maHocSinh, maTruong]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error in updateStudentClass:', error);
      throw error;
    }
  }

  static async getToHopList() {
    try {
      const [rows] = await db.execute('SELECT MaToHop, TenToHop FROM ToHopMon ORDER BY MaToHop');
      return rows;
    } catch (error) {
      console.error('❌ Error in getToHopList:', error);
      throw error;
    }
  }
}

module.exports = PhanLopModel;