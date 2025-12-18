const db = require('../config/database');

const NhapHocModel = {

  // =========================
  // LẤY TRẠNG THÁI
  // =========================
  getStatus: async (maTS) => {
    if (!maTS) {
      return {
        HoTen: 'Thí sinh',
        TrangThaiNhapHoc: 'Không xác định thí sinh'
      };
    }

    try {
      // Lấy họ tên + kết quả
      const [rows] = await db.execute(`
        SELECT 
          ts.HoTen,
          kq.TinhTrang,
          nh.KhoiHoc
        FROM ThiSinhDuThi ts
        LEFT JOIN KetQuaTuyenSinh kq ON ts.MaThiSinh = kq.MaThiSinh
        LEFT JOIN NhapHoc nh ON ts.MaThiSinh = nh.MaThiSinh
        WHERE ts.MaThiSinh = ?
      `, [maTS]);

      if (!rows.length) {
        return {
          HoTen: 'Thí sinh',
          TrangThaiNhapHoc: 'Chưa có dữ liệu'
        };
      }

      // Đã nhập học
      if (rows[0].KhoiHoc) {
        return {
          HoTen: rows[0].HoTen,
          TrangThaiNhapHoc: 'Đã nhập học',
          KhoiHoc: rows[0].KhoiHoc
        };
      }

      return {
        HoTen: rows[0].HoTen,
        TrangThaiNhapHoc: rows[0].TinhTrang || 'Chờ xét'
      };

    } catch (err) {
      console.error(err);
      return {
        HoTen: 'Thí sinh',
        TrangThaiNhapHoc: 'Lỗi hệ thống'
      };
    }
  },

  // =========================
  // XÁC NHẬN NHẬP HỌC
  // =========================
  confirm: async (maTS, khoiHoc) => {

    if (!['KHTN', 'KHXH'].includes(khoiHoc)) {
      throw new Error('Khối học không hợp lệ');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Check trúng tuyển
      const [kq] = await conn.execute(
        `SELECT TinhTrang FROM KetQuaTuyenSinh WHERE MaThiSinh = ?`,
        [maTS]
      );

      if (!kq.length || kq[0].TinhTrang !== 'Đậu') {
        throw new Error('Chỉ thí sinh trúng tuyển mới được nhập học');
      }

      // 2. Check đã nhập học chưa
      const [exist] = await conn.execute(
        `SELECT 1 FROM NhapHoc WHERE MaThiSinh = ?`,
        [maTS]
      );

      if (exist.length) {
        throw new Error('Bạn đã xác nhận nhập học rồi');
      }

      // 3. Insert nhập học
      await conn.execute(
        `INSERT INTO NhapHoc (MaThiSinh, KhoiHoc)
         VALUES (?, ?)`,
        [maTS, khoiHoc]
      );

      await conn.commit();
      return true;

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
  // === Hàm riêng: Thêm học sinh trúng tuyển vào bảng HocSinh ===
  insertAllocatedStudents: async (results, nam_thi) => {
    const khoaHoc = await PhanBoHocSinhVaoTruongModel.getKhoaHoc(nam_thi);

    for (const r of results) {
      const [thiSinh] = await db.execute(`
        SELECT HoTen, NgaySinh, GioiTinh 
        FROM ThiSinhDuThi 
        WHERE MaThiSinh = ?
      `, [r.MaThiSinh]);

      if (thiSinh.length === 0) continue; // Bỏ qua nếu không tìm thấy thí sinh

      const insertHSQuery = `
        INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, KhoaHoc, GioiTinh, TrangThai, MaLop, MaTruong, ToHop)
        VALUES (?, ?, ?, ?, ?, 'Đang học', NULL, ?, ?)
        ON DUPLICATE KEY UPDATE
          TenHocSinh = VALUES(TenHocSinh),
          Birthday = VALUES(Birthday),
          KhoaHoc = VALUES(KhoaHoc),
          GioiTinh = VALUES(GioiTinh),
          TrangThai = 'Đang học',
          MaLop = NULL,
          MaTruong = VALUES(MaTruong),
          ToHop = VALUES(ToHop)
      `;

      await db.execute(insertHSQuery, [
        r.MaThiSinh,
        thiSinh[0].HoTen,
        thiSinh[0].NgaySinh,
        khoaHoc,
        thiSinh[0].GioiTinh || 'Nam',
        r.MaTruong,
        r.ToHopMon
      ]);
    }
  },

};

module.exports = NhapHocModel;
