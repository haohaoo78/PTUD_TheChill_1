const db = require('../config/database');

class DuyetYeuCauSuaDiemModel {

  // ==========================
  // Duyệt yêu cầu
  // ==========================
  static async approveRequest(maYeuCau, maHieuTruong, maTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(`
        SELECT yc.*
        FROM YeuCauSuaDiem yc
        JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
        JOIN Lop l ON hs.MaLop = l.MaLop
        WHERE yc.MaYeuCau = ?
          AND yc.TrangThai = 'DangXuLy'
          AND l.MaTruong = ?
      `, [maYeuCau, maTruong]);

      if (!rows.length) {
        throw new Error('Yêu cầu không tồn tại hoặc không thuộc trường');
      }

      const yc = rows[0];

      const columnMap = {
        ThuongXuyen1: 'ThuongXuyen1',
        ThuongXuyen2: 'ThuongXuyen2',
        ThuongXuyen3: 'ThuongXuyen3',
        Diem15_1: 'Diem15_1',
        Diem15_2: 'Diem15_2',
        GK: 'GK',
        CK: 'CK'
      };

      const col = columnMap[yc.LoaiDiem];
      if (!col) throw new Error('Loại điểm không hợp lệ');

      await conn.execute(`
        UPDATE Diem
        SET ${col} = ?,
            TrungBinhMon = (ThuongXuyen1 + ThuongXuyen2 + ThuongXuyen3
                            + Diem15_1 + Diem15_2 + GK + CK) / 7
        WHERE MaHocSinh = ?
          AND TenMonHoc = ?
          AND NamHoc = ?
          AND HocKi = ?
      `, [yc.DiemMoi, yc.MaHocSinh, yc.Mon, yc.NamHoc, yc.HocKi]);

      await conn.execute(`
        UPDATE YeuCauSuaDiem
        SET TrangThai = 'DaDuyet',
            MaHieuTruong = ?
        WHERE MaYeuCau = ?
      `, [maHieuTruong, maYeuCau]);

      await conn.commit();
      return { success: true, message: 'Duyệt yêu cầu thành công' };

    } catch (err) {
      await conn.rollback();
      console.error(err);
      return { success: false, message: err.message };
    } finally {
      conn.release();
    }
  }

  // ==========================
  // Từ chối yêu cầu
  // ==========================
  static async rejectRequest(maYeuCau, ghiChu, maHieuTruong, maTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(`
        SELECT yc.*
        FROM YeuCauSuaDiem yc
        JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
        JOIN Lop l ON hs.MaLop = l.MaLop
        WHERE yc.MaYeuCau = ?
          AND yc.TrangThai = 'DangXuLy'
          AND l.MaTruong = ?
      `, [maYeuCau, maTruong]);

      if (!rows.length) {
        throw new Error('Yêu cầu không tồn tại hoặc không thuộc trường');
      }

      await conn.execute(`
        UPDATE YeuCauSuaDiem
        SET TrangThai = 'BiTuChoi',
            GhiChu = ?,
            MaHieuTruong = ?
        WHERE MaYeuCau = ?
      `, [ghiChu, maHieuTruong, maYeuCau]);

      await conn.commit();
      return { success: true, message: 'Đã từ chối yêu cầu' };

    } catch (err) {
      await conn.rollback();
      console.error(err);
      return { success: false, message: err.message };
    } finally {
      conn.release();
    }
  }

  // ==========================
  // Lấy danh sách theo trạng thái + trường
  // ==========================
  static async getRequestsByStatus(status, maTruong) {
    let dbStatus;
    switch (status) {
      case 'pending': dbStatus = 'DangXuLy'; break;
      case 'daduyet': dbStatus = 'DaDuyet'; break;
      case 'bituchoi': dbStatus = 'BiTuChoi'; break;
      default: dbStatus = status;
    }

    const [rows] = await db.execute(`
      SELECT yc.MaYeuCau, hs.MaHocSinh, hs.TenHocSinh, l.TenLop,
             yc.Mon AS TenMonHoc, yc.LoaiDiem,
             yc.DiemCu, yc.DiemMoi, yc.LyDo,
             gv.TenGiaoVien, yc.TrangThai, yc.GhiChu
      FROM YeuCauSuaDiem yc
      JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
      JOIN Lop l ON hs.MaLop = l.MaLop
      LEFT JOIN GiaoVien gv ON yc.MaGiaoVien = gv.MaGiaoVien
      WHERE yc.TrangThai = ?
        AND l.MaTruong = ?
      ORDER BY yc.MaYeuCau DESC
    `, [dbStatus, maTruong]);

    return rows;
  }

  // ==========================
  // Lấy chi tiết yêu cầu
  // ==========================
  static async getRequestDetails(maYeuCau, maTruong) {
    const [rows] = await db.execute(`
      SELECT yc.*, hs.TenHocSinh, l.TenLop,
             gv.TenGiaoVien, gv.Email, gv.SDT
      FROM YeuCauSuaDiem yc
      JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
      JOIN Lop l ON hs.MaLop = l.MaLop
      LEFT JOIN GiaoVien gv ON yc.MaGiaoVien = gv.MaGiaoVien
      WHERE yc.MaYeuCau = ?
        AND l.MaTruong = ?
    `, [maYeuCau, maTruong]);

    return rows[0] || null;
  }
}

module.exports = DuyetYeuCauSuaDiemModel;
