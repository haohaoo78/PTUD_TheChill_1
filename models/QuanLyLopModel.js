const db = require('../config/database');

class QuanLyLopModel {
  static async getKhoiList() {
    const [rows] = await db.execute('SELECT MaKhoi, TenKhoi FROM Khoi ORDER BY TenKhoi');
    return rows;
  }

  static async getClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute('SELECT MaLop, TenLop, Khoi, MaToHop, TrangThai, SiSo FROM Lop WHERE Khoi = ? ORDER BY TenLop', [MaKhoi]);
    return rows;
  }

  static async countClassesByKhoi(MaKhoi) {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM Lop WHERE Khoi = ?', [MaKhoi]);
    return rows[0]?.cnt || 0;
  }

  static async classExists(TenLop) {
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM Lop WHERE TenLop = ?', [TenLop]);
    return rows[0]?.cnt > 0;
  }

  static async createClasses(MaKhoi, number, maTruong=null) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // ensure MaTruong exist; if not try to fetch the first
      const [tr] = await db.execute('SELECT MaTruong FROM Truong LIMIT 1');
      if (tr && tr[0] && !maTruong) maTruong = tr[0].MaTruong;
      const count = await this.countClassesByKhoi(MaKhoi);
      const inserts = [];
      for (let i = 1; i <= number; i++) {
        const seq = count + i;
        const maLop = `${MaKhoi}${seq}`;
        const tenLop = `${MaKhoi}${seq}`;
        inserts.push([maLop, tenLop, null, 'Đang học', MaKhoi, 0, maTruong]);
      }
      await conn.query(`INSERT INTO Lop (MaLop, TenLop, MaToHop, TrangThai, Khoi, SiSo, MaTruong) VALUES ?`, [inserts]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getTeachers() {
    const [rows] = await db.execute('SELECT MaGiaoVien, TenGiaoVien FROM GiaoVien WHERE TrangThai = "Đang công tác" ORDER BY TenGiaoVien');
    return rows;
  }

  static async updateClass(maLop, data) {
    const fields = [];
    const params = [];
    if (data.TenLop) { fields.push('TenLop = ?'); params.push(data.TenLop); }
    if (data.Khoi) { fields.push('Khoi = ?'); params.push(data.Khoi); }
    if (data.MaToHop) { fields.push('MaToHop = ?'); params.push(data.MaToHop); }
    if (data.TrangThai) { fields.push('TrangThai = ?'); params.push(data.TrangThai); }
    if (data.SiSo !== undefined) { fields.push('SiSo = ?'); params.push(data.SiSo); }
    if (fields.length === 0) return { success: false, message: 'Không có dữ liệu để cập nhật' };
    params.push(maLop);
    const sql = `UPDATE Lop SET ${fields.join(', ')} WHERE MaLop = ?`;
    const [result] = await db.execute(sql, params);
    return { success: true, changedRows: result.affectedRows };
  }

  static async assignGVCN(maLop, maGVCN, NamHoc=null) {
    const conn = await db.getConnection();
    try {
      // find latest NamHoc if not provided
      if (!NamHoc) {
        const [rows] = await db.execute('SELECT NamHoc FROM HocKy ORDER BY NamHoc DESC LIMIT 1');
        NamHoc = rows[0]?.NamHoc || null;
      }
      if (!NamHoc) return { success: false, message: 'Không có năm học để gán giáo viên chủ nhiệm' };
      await conn.beginTransaction();
      await conn.execute('DELETE FROM GVChuNhiem WHERE MaLop = ? AND NamHoc = ?', [maLop, NamHoc]);
      await conn.execute('INSERT INTO GVChuNhiem (MaGVCN, MaLop, NamHoc) VALUES (?, ?, ?)', [maGVCN, maLop, NamHoc]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteClass(maLop) {
    // check students count
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM HocSinh WHERE MaLop = ?', [maLop]);
    const cnt = rows[0]?.cnt || 0;
    if (cnt > 0) return { success: false, message: 'Lớp còn học sinh. Không thể xóa.' };

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM Lop WHERE MaLop = ?', [maLop]);
      // Also possibly delete entries in GVChuNhiem, GVBoMon for the class
      await conn.execute('DELETE FROM GVChuNhiem WHERE MaLop = ?', [maLop]);
      await conn.execute('DELETE FROM GVBoMon WHERE MaLop = ?', [maLop]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = QuanLyLopModel;