const db = require('../config/database');

class PhanLopModel {
  // Lấy danh sách khối
  static async getKhoiList() {
    try {
      const [rows] = await db.execute('SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY MaKhoi');
      console.log('✅ Khối list:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getKhoiList:', error);
      throw error;
    }
  }

  // Lấy học sinh thuộc khối (sửa theo QL: JOIN Lop + Khoi, + HS chưa lớp với KhoaHoc filter)
  static async getStudentsByKhoi(maKhoi) {
    try {
      console.log('🔍 Getting students for khoi:', maKhoi);
      
      // Fallback năm nếu no HocKy
      let namBatDau = '2025'; // Hardcode fallback cho K01
      const [namHocRows] = await db.execute(
        'SELECT NamHoc FROM HocKy WHERE TrangThai = "Đang học" ORDER BY NamHoc DESC LIMIT 1'
      );
      if (namHocRows.length > 0) {
        const namHocHienTai = namHocRows[0].NamHoc;
        const namHienTai = parseInt(namHocHienTai.split('-')[0]);
        if (maKhoi === 'K02') namBatDau = (namHienTai - 1).toString();
        else if (maKhoi === 'K03') namBatDau = (namHienTai - 2).toString();
        else namBatDau = namHienTai.toString();
        console.log('📅 Năm bắt đầu cho khối:', namBatDau);
      } else {
        console.warn('⚠️ No HocKy "Đang học", fallback namBatDau=2025');
      }

      // Query: HS có lớp (JOIN Lop + Khoi) + HS chưa lớp (KhoaHoc filter)
      const sql = `
        SELECT hs.MaHocSinh, hs.TenHocSinh, hs.KhoaHoc, hs.GioiTinh,
               hs.ToHop AS MaToHop, COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop,
               hs.TrangThai, hs.MaLop
        FROM HocSinh hs
        LEFT JOIN ToHopMon th ON hs.ToHop = th.MaToHop
        LEFT JOIN Lop l ON hs.MaLop = l.MaLop
        WHERE hs.TrangThai = 'Đang học'
          AND (
            (l.Khoi = ? )  -- HS có lớp thuộc khối
            OR 
            (hs.MaLop IS NULL OR hs.MaLop = '' ) AND LEFT(hs.KhoaHoc, 4) = ?  -- HS chưa lớp, KhoaHoc khớp năm khối
          )
        ORDER BY hs.MaLop, hs.ToHop, hs.TenHocSinh
      `;
      const [rows] = await db.execute(sql, [maKhoi, namBatDau]);
      console.log(`✅ Found ${rows.length} students for khoi ${maKhoi} (year: ${namBatDau})`);
      if (rows.length === 0) {
        console.warn('⚠️ No students: Check HocSinh.TrangThai="Đang học", Lop.Khoi, or KhoaHoc starts with', namBatDau);
      }
      return rows;
    } catch (error) {
      console.error('❌ Error in getStudentsByKhoi:', error);
      throw error;
    }
  }

  // Lấy danh sách lớp theo khối (giữ nguyên, thêm warn nếu 0)
  static async getClassesByKhoi(maKhoi) {
    try {
      console.log('🔍 Getting classes for khoi:', maKhoi);
      const [rows] = await db.execute(`
        SELECT l.MaLop, l.TenLop, l.SiSo, l.MaToHop,
               COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop,
               COALESCE(COUNT(hs.MaHocSinh), 0) AS CurrentCount
        FROM Lop l
        LEFT JOIN ToHopMon th ON l.MaToHop = th.MaToHop
        LEFT JOIN HocSinh hs ON l.MaLop = hs.MaLop AND hs.TrangThai = 'Đang học'
        WHERE l.Khoi = ? AND l.TrangThai = 'Đang học'
        GROUP BY l.MaLop, l.TenLop, l.SiSo, l.MaToHop, th.TenToHop
        ORDER BY l.TenLop
      `, [maKhoi]);
      console.log(`✅ Found ${rows.length} classes for khoi ${maKhoi}`);
      if (rows.length === 0) {
        console.warn('⚠️ No classes: Check Lop.Khoi=? and TrangThai="Đang học"');
      }
      return rows;
    } catch (error) {
      console.error('❌ Error in getClassesByKhoi:', error);
      throw error;
    }
  }

  // Các method khác giữ nguyên (saveAssignments, getStudentsInClass, updateStudentClass, getToHopList)
  static async saveAssignments(assignments) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      console.log(`💾 Saving ${assignments.length} assignments...`);
      for (const { MaHocSinh, MaLop } of assignments) {
        await conn.execute(
          'UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ?',
          [MaLop || null, MaHocSinh]
        );
        console.log(` ✅ Updated ${MaHocSinh} -> ${MaLop}`);
      }
      await conn.commit();
      console.log('✅ All assignments saved successfully');
      return { success: true, message: 'Phân lớp thành công!' };
    } catch (err) {
      await conn.rollback();
      console.error('❌ Error in saveAssignments:', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getStudentsInClass(maLop) {
    try {
      const [rows] = await db.execute(`
        SELECT hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh, hs.TrangThai,
               hs.ToHop AS MaToHop, COALESCE(th.TenToHop, 'Chưa chọn') AS TenToHop
        FROM HocSinh hs
        LEFT JOIN ToHopMon th ON hs.ToHop = th.MaToHop
        WHERE hs.MaLop = ? AND hs.TrangThai = 'Đang học'
        ORDER BY hs.TenHocSinh
      `, [maLop]);
      console.log(`✅ Found ${rows.length} students in class ${maLop}`);
      return rows;
    } catch (error) {
      console.error('❌ Error in getStudentsInClass:', error);
      throw error;
    }
  }

  static async updateStudentClass(maHocSinh, maLop) {
    try {
      const [result] = await db.execute(
        'UPDATE HocSinh SET MaLop = ? WHERE MaHocSinh = ?',
        [maLop || null, maHocSinh]
      );
      console.log(`✅ Updated student ${maHocSinh} to class ${maLop}`);
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