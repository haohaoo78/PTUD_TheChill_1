const db = require('../config/database');

class DuyetYeuCauSuaDiemModel {
  // ==========================
  // Duyệt yêu cầu
  // ==========================
  static async approveRequest(maYeuCau, maHieuTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Lấy thông tin yêu cầu đang chờ xử lý
      const [rows] = await conn.execute(
        `SELECT * FROM YeuCauSuaDiem WHERE MaYeuCau = ? AND TrangThai = 'DangXuLy'`,
        [maYeuCau]
      );

      if (!rows.length) throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');
      const yc = rows[0];

      // 2. Cập nhật điểm mới trong bảng Diem theo loại điểm
      const columnMap = {
        'ThuongXuyen1': 'ThuongXuyen1',
        'ThuongXuyen2': 'ThuongXuyen2',
        'ThuongXuyen3': 'ThuongXuyen3',
        'Diem15_1': 'Diem15_1',
        'Diem15_2': 'Diem15_2',
        'GK': 'GK',
        'CK': 'CK'
      };

      const col = columnMap[yc.LoaiDiem];
      if (!col) throw new Error('Loại điểm không hợp lệ');

      const [updateResult] = await conn.execute(
        `UPDATE Diem SET ${col} = ?, TrungBinhMon = (ThuongXuyen1 + ThuongXuyen2 + ThuongXuyen3 + Diem15_1 + Diem15_2 + GK + CK) / 7
         WHERE MaHocSinh = ? AND TenMonHoc = ? AND NamHoc = ? AND HocKi = ?`,
        [yc.DiemMoi, yc.MaHocSinh, yc.Mon, yc.NamHoc, yc.HocKi]
      );

      if (updateResult.affectedRows === 0) throw new Error('Không tìm thấy bản ghi điểm cần cập nhật');

      // 3. Cập nhật trạng thái yêu cầu
      await conn.execute(
        `UPDATE YeuCauSuaDiem SET TrangThai = ?, MaHieuTruong = ? WHERE MaYeuCau = ?`,
        ['DaDuyet', maHieuTruong, maYeuCau]
      );

      await conn.commit();
      return { success: true, message: 'Duyệt yêu cầu và cập nhật điểm thành công', data: { newStatus: 'DaDuyet', maYeuCau } };
    } catch (err) {
      await conn.rollback();
      console.error('Lỗi khi duyệt yêu cầu:', err);
      return { success: false, message: err.message || 'Lỗi khi duyệt yêu cầu', error: err };
    } finally {
      conn.release();
    }
  }

  // ==========================
  // Từ chối yêu cầu
  // ==========================
  static async rejectRequest(maYeuCau, ghiChu, maHieuTruong) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        `SELECT * FROM YeuCauSuaDiem WHERE MaYeuCau = ? AND TrangThai = 'DangXuLy'`,
        [maYeuCau]
      );

      if (!rows.length) throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý');

      const [result] = await conn.execute(
        `UPDATE YeuCauSuaDiem SET TrangThai = 'BiTuChoi', GhiChu = ?, MaHieuTruong = ? WHERE MaYeuCau = ?`,
        [ghiChu, maHieuTruong, maYeuCau]
      );

      if (result.affectedRows === 0) throw new Error('Không thể cập nhật trạng thái yêu cầu');

      await conn.commit();
      return { success: true, message: 'Từ chối yêu cầu thành công', data: { newStatus: 'BiTuChoi', maYeuCau } };
    } catch (err) {
      await conn.rollback();
      console.error('Lỗi khi từ chối yêu cầu:', err);
      return { success: false, message: err.message || 'Lỗi khi từ chối yêu cầu', error: err };
    } finally {
      if (conn) conn.release();
    }
  }

  // ==========================
  // Lấy danh sách yêu cầu theo trạng thái
  // ==========================
  static async getRequestsByStatus(status) {
    try {
      console.log('Model - Lọc theo trạng thái:', status);

      let dbStatus;
      switch (status) {
        case 'pending': dbStatus = 'DangXuLy'; break;
        case 'daduyet': dbStatus = 'DaDuyet'; break;
        case 'bituchoi': dbStatus = 'BiTuChoi'; break;
        default: dbStatus = status;
      }

      console.log('Trạng thái tìm kiếm trong DB:', dbStatus);

      let query = `
        SELECT yc.MaYeuCau, hs.MaHocSinh, hs.TenHocSinh, l.TenLop,
               yc.Mon as TenMonHoc, yc.LoaiDiem, yc.DiemCu, yc.DiemMoi,
               yc.LyDo, gv.TenGiaoVien, yc.TrangThai, yc.GhiChu
        FROM YeuCauSuaDiem yc
        JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
        LEFT JOIN Lop l ON hs.MaLop = l.MaLop
        LEFT JOIN GiaoVien gv ON yc.MaGiaoVien = gv.MaGiaoVien
      `;
      if (dbStatus) query += ' WHERE yc.TrangThai = ?';
      query += ' ORDER BY yc.MaYeuCau DESC';

      const [rows] = dbStatus ? await db.execute(query, [dbStatus]) : await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu cầu:', error);
      throw new Error('Không thể lấy danh sách yêu cầu');
    }
  }

  // ==========================
  // Lấy danh sách yêu cầu đang xử lý (DangXuLy)
  // ==========================
  static async getPendingRequests() {
    try {
      const [rows] = await db.execute(`
        SELECT yc.MaYeuCau, hs.MaHocSinh, hs.TenHocSinh, l.TenLop AS TenLop,
               yc.NamHoc, yc.HocKi, mh.TenMonHoc, yc.DiemCu, yc.DiemMoi,
               yc.LoaiDiem, yc.LyDo, yc.TrangThai, gv.TenGiaoVien
        FROM YeuCauSuaDiem yc
        JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
        LEFT JOIN Lop l ON l.MaLop = hs.MaLop
        JOIN MonHoc mh ON TRIM(yc.Mon) = TRIM(mh.TenMonHoc)
        JOIN GiaoVien gv ON yc.MaGiaoVien = gv.MaGiaoVien
        JOIN Diem d ON d.MaHocSinh = yc.MaHocSinh
                     AND d.TenMonHoc = yc.Mon
                     AND d.NamHoc = yc.NamHoc
                     AND d.HocKi = yc.HocKi
        WHERE yc.TrangThai = 'DangXuLy'
      `);
      return rows;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu cầu đang xử lý:', error);
      throw new Error('Không thể lấy danh sách yêu cầu');
    }
  }

  // ==========================
  // Lấy chi tiết một yêu cầu
  // ==========================
  static async getRequestDetails(maYeuCau) {
    const [rows] = await db.execute(`
      SELECT yc.MaYeuCau, yc.TrangThai, yc.DiemCu, yc.DiemMoi, yc.LyDo,
             yc.MinhChung, yc.LoaiDiem, yc.Mon, yc.NamHoc, yc.HocKi,
             hs.MaHocSinh, hs.TenHocSinh, hs.GioiTinh AS GioiTinhHS,
             l.TenLop AS TenLop,
             mh.TenMonHoc, gv.TenGiaoVien, gv.Email AS EmailGV, gv.SDT AS SDTGV
      FROM YeuCauSuaDiem yc
      JOIN HocSinh hs ON yc.MaHocSinh = hs.MaHocSinh
      LEFT JOIN Lop l ON l.MaLop = hs.MaLop
      JOIN MonHoc mh ON TRIM(yc.Mon) = TRIM(mh.TenMonHoc)
      JOIN GiaoVien gv ON yc.MaGiaoVien = gv.MaGiaoVien
      WHERE yc.MaYeuCau = ?
    `, [maYeuCau]);

    if (!rows.length) return null;

    const yc = rows[0];
    yc.MinhChung = yc.MinhChung ? yc.MinhChung.split(',') : [];
    return yc;
  }

  // ==========================
  // Lấy thông tin ghi chú / lịch sử của yêu cầu
  // ==========================
  static async getRequestNotes(maYeuCau) {
    try {
      const [rows] = await db.execute(`
        SELECT yc.MaYeuCau, yc.TrangThai, yc.GhiChu, ht.TenHieuTruong
        FROM YeuCauSuaDiem yc
        LEFT JOIN HieuTruong ht ON yc.MaHieuTruong = ht.MaHieuTruong
        WHERE yc.MaYeuCau = ?
      `, [maYeuCau]);
      return { success: true, data: rows[0] || null };
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử ghi chú:', error);
      return { success: false, message: 'Không thể lấy thông tin ghi chú' };
    }
  }
}

module.exports = DuyetYeuCauSuaDiemModel;
