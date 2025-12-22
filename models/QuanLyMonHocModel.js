// models/QuanLyMonHocModel.js
const db = require('../config/database');

class MonHocModel {
  static async getList(khoi = '', trangthai = '', search = '') {
  let sql = `SELECT TenMonHoc, SoTiet, MaToHop, Khoi, TrangThai 
             FROM MonHoc 
             WHERE TenMonHoc != 'EMPTY_WEEK'`;  // ← THÊM DÒNG NÀY ĐỂ ẨN
  const params = [];

  if (khoi) {
    const map = { '10': 'K01', '11': 'K02', '12': 'K03' };
    sql += ' AND Khoi = ?';
    params.push(map[khoi]);
  }
  if (trangthai !== '') {
    sql += ' AND TrangThai = ?';
    params.push(trangthai === '1' ? 'Đang dạy' : 'Ngưng dạy');
  }

  // Tìm kiếm theo tên hoặc mã ảo
  if (search) {
    const s = search.trim();
    if (s.toUpperCase().startsWith('MH')) {
      const num = parseInt(s.substring(2));
      if (!isNaN(num) && num > 0) {
        sql = `SELECT TenMonHoc, SoTiet, MaToHop, Khoi, TrangThai 
               FROM MonHoc 
               WHERE TenMonHoc != 'EMPTY_WEEK'`;
        params.length = 0;
        if (khoi) {
          sql += ' AND Khoi = ?';
          params.push(map[khoi]);
        }
        if (trangthai !== '') {
          sql += ' AND TrangThai = ?';
          params.push(trangthai === '1' ? 'Đang dạy' : 'Ngưng dạy');
        }
        sql += ` ORDER BY TenMonHoc ASC LIMIT 1 OFFSET ${num - 1}`;
      } else {
        sql += ' AND TenMonHoc LIKE ?';
        params.push(`%${s}%`);
      }
    } else {
      sql += ' AND TenMonHoc LIKE ?';
      params.push(`%${s}%`);
    }
  } else {
    sql += ' ORDER BY TenMonHoc ASC';
  }

  const [rows] = await db.execute(sql, params);

  // Tạo map thứ tự (loại trừ EMPTY_WEEK)
  const [all] = await db.execute(`SELECT TenMonHoc FROM MonHoc WHERE TenMonHoc != 'EMPTY_WEEK' ORDER BY TenMonHoc ASC`);
  const orderMap = new Map();
  all.forEach((r, i) => orderMap.set(r.TenMonHoc, i + 1));

  return rows.map(row => ({
    MaMonHoc: `MH${String(orderMap.get(row.TenMonHoc)).padStart(3, '0')}`,
    TenMonHoc: row.TenMonHoc,
    SoTiet: row.SoTiet,
    MaToHop: row.MaToHop || '',
    Khoi: row.Khoi === 'K01' ? 10 : row.Khoi === 'K02' ? 11 : 12,
    TrangThai: row.TrangThai === 'Đang dạy' ? 1 : 0
  }));
}

  // Khi lấy 1 môn để sửa
  static async getById(tenMonHoc) {
  if (tenMonHoc === 'EMPTY_WEEK') return null; // Không cho sửa EMPTY_WEEK

  const [rows] = await db.execute(
    `SELECT TenMonHoc, SoTiet, MaToHop, Khoi, TrangThai 
     FROM MonHoc 
     WHERE TenMonHoc = ? AND TenMonHoc != 'EMPTY_WEEK'`,
    [tenMonHoc]
  );
  if (!rows[0]) return null;

  const [all] = await db.execute(`SELECT TenMonHoc FROM MonHoc WHERE TenMonHoc != 'EMPTY_WEEK' ORDER BY TenMonHoc ASC`);
  const orderMap = new Map();
  all.forEach((r, i) => orderMap.set(r.TenMonHoc, i + 1));

  const row = rows[0];
  return {
    MaMonHoc: `MH${String(orderMap.get(tenMonHoc)).padStart(3, '0')}`,
    TenMonHoc: row.TenMonHoc,
    SoTiet: row.SoTiet,
    MaToHop: row.MaToHop || '',
    Khoi: row.Khoi === 'K01' ? 10 : row.Khoi === 'K02' ? 11 : 12,
    TrangThai: row.TrangThai === 'Đang dạy' ? 1 : 0
  };
}

  // Các hàm còn lại giữ nguyên (add, update, toggleStatus)
  static async add(mon) {
    const { TenMonHoc, SoTiet, MaToHop, Khoi } = mon;
    const khoiMap = { 10: 'K01', 11: 'K02', 12: 'K03' };

    const [exists] = await db.execute('SELECT 1 FROM MonHoc WHERE TenMonHoc = ?', [TenMonHoc]);
    if (exists.length > 0) throw new Error('Môn học đã tồn tại');

    await db.execute(
      `INSERT INTO MonHoc (TenMonHoc, SoTiet, MaToHop, TrangThai, Khoi) VALUES (?, ?, ?, 'Đang dạy', ?)`,
      [TenMonHoc, SoTiet, MaToHop || null, khoiMap[Khoi]]
    );
  }

  static async update(tenMonHoc, data) {
    const fields = [];
    const params = [];

    if (data.TenMonHoc && data.TenMonHoc !== tenMonHoc) {
      fields.push('TenMonHoc = ?');
      params.push(data.TenMonHoc);
    }
    if (data.SoTiet !== undefined) { fields.push('SoTiet = ?'); params.push(data.SoTiet); }
    if (data.MaToHop !== undefined) { fields.push('MaToHop = ?'); params.push(data.MaToHop || null); }
    if (data.Khoi) {
      const map = { 10: 'K01', 11: 'K02', 12: 'K03' };
      fields.push('Khoi = ?'); params.push(map[data.Khoi]);
    }
    if (data.TrangThai !== undefined) {
      fields.push('TrangThai = ?');
      params.push(data.TrangThai === 1 ? 'Đang dạy' : 'Ngưng dạy');
    }

    if (fields.length === 0) return;
    const sql = `UPDATE MonHoc SET ${fields.join(', ')} WHERE TenMonHoc = ?`;
    params.push(tenMonHoc);
    await db.execute(sql, params);
  }

  static async toggleStatus(tenMonHoc) {
    await db.execute(
      `UPDATE MonHoc SET TrangThai = IF(TrangThai = 'Đang dạy', 'Ngưng dạy', 'Đang dạy') WHERE TenMonHoc = ?`,
      [tenMonHoc]
    );
  }
}

module.exports = MonHocModel;