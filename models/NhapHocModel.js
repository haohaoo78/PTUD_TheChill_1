// models/NhapHocModel.js
const db = require('../config/database');

const NhapHocModel = {
  getToHopMon: async () => {
    const [rows] = await db.execute('SELECT MaToHop, TenToHop FROM ToHopMon');
    return rows;
  },

  getStatus: async (maTS) => {
    const query = `
      SELECT ts.HoTen, 
             IF(hs.MaHocSinh IS NOT NULL, 'Đã nhập học', 
                IF(kq.TinhTrang = 'Đậu', 'Đậu', kq.TinhTrang)) AS TrangThaiNhapHoc,
             hs.ToHop AS KhoiHoc
      FROM ThiSinhDuThi ts
      LEFT JOIN KetQuaTuyenSinh kq ON ts.MaThiSinh = kq.MaThiSinh
      LEFT JOIN HocSinh hs ON ts.MaThiSinh = hs.MaHocSinh
      WHERE ts.MaThiSinh = ?
    `;
    const [rows] = await db.execute(query, [maTS]);
    return rows[0] || { HoTen: '', TrangThaiNhapHoc: 'Chưa trúng tuyển', KhoiHoc: null };
  },

  confirm: async (maTS, toHop) => {
    // Kiểm tra đã nhập học chưa
    const [existing] = await db.execute('SELECT MaHocSinh FROM HocSinh WHERE MaHocSinh = ?', [maTS]);
    if (existing.length > 0) {
      throw new Error('Bạn đã xác nhận nhập học rồi!');
    }

    // Lấy thông tin thí sinh và kết quả tuyển sinh
    const [candidate] = await db.execute(`
      SELECT ts.HoTen, ts.NgaySinh, ts.GioiTinh, 
             nv.MaTruong, kq.MaToHop, kq.KhoaHoc
      FROM ThiSinhDuThi ts
      JOIN KetQuaTuyenSinh kq ON ts.MaThiSinh = kq.MaThiSinh
      JOIN NguyenVong nv ON kq.NguyenVongTrungTuyen = nv.MaNguyenVong
      WHERE ts.MaThiSinh = ? AND kq.TinhTrang = 'Đậu'
    `, [maTS]);

    if (candidate.length === 0) {
      throw new Error('Bạn chưa trúng tuyển hoặc chưa có kết quả phân bổ.');
    }

    const c = candidate[0];

    // Insert vào HocSinh
    await db.execute(`
      INSERT INTO HocSinh 
        (MaHocSinh, TenHocSinh, Birthday, KhoaHoc, GioiTinh, TrangThai, MaLop, MaTruong, ToHop)
      VALUES (?, ?, ?, ?, ?, 'Đang học', NULL, ?, ?)
    `, [
      maTS,
      c.HoTen,
      c.NgaySinh,
      c.KhoaHoc || '2025-2028',
      c.GioiTinh || 'Nam',
      c.MaTruong,
      toHop  // Sử dụng toHop được chọn
    ]);

    // Tạo tài khoản học sinh
    const defaultHash = '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG';
    await db.execute(`
      INSERT IGNORE INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan)
      VALUES (?, ?, 'Học sinh')
    `, [maTS, defaultHash]);

    return { maHocSinh: maTS };
  }
};

module.exports = NhapHocModel;