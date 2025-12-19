const db = require('../config/database');

const NhapHocModel = {
  getToHopMon: async () => {
    const [rows] = await db.execute('SELECT MaToHop, TenToHop FROM ToHopMon ORDER BY MaToHop');
    return rows;
  },

  getStatus: async (maTS) => {
    const query = `
      SELECT ts.HoTen,
             COALESCE(kq.TinhTrang, 'Chưa có kết quả') AS TrangThaiNhapHoc
      FROM ThiSinhDuThi ts
      LEFT JOIN KetQuaTuyenSinh kq ON ts.MaThiSinh = kq.MaThiSinh
      WHERE ts.MaThiSinh = ?
    `;
    const [rows] = await db.execute(query, [maTS]);

    if (rows.length === 0) {
      return { HoTen: 'Không tìm thấy', TrangThaiNhapHoc: 'Không hợp lệ' };
    }

    return {
      HoTen: rows[0].HoTen,
      TrangThaiNhapHoc: rows[0].TrangThaiNhapHoc
    };
  },

  generateMaHocSinh: async (namThi) => {
    const prefix = `HS${namThi}`;
    const [rows] = await db.execute(`
      SELECT MaHocSinh FROM HocSinh 
      WHERE MaHocSinh LIKE ?
      ORDER BY MaHocSinh DESC LIMIT 1
    `, [`${prefix}%`]);

    let nextNumber = 1;
    if (rows.length > 0) {
      const lastCode = rows[0].MaHocSinh;
      const lastNumber = parseInt(lastCode.replace(prefix, '')) || 0;
      nextNumber = lastNumber + 1;
    }
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  },

  confirm: async (maTS, toHop) => {
    // Kiểm tra trạng thái hiện tại
    const [current] = await db.execute('SELECT TinhTrang FROM KetQuaTuyenSinh WHERE MaThiSinh = ?', [maTS]);
    if (current.length === 0 || current[0].TinhTrang !== 'Đậu') {
      throw new Error('Bạn chưa trúng tuyển hoặc đã xác nhận nhập học rồi');
    }

    // Lấy thông tin thí sinh + trường + năm thi
    const [info] = await db.execute(`
      SELECT ts.HoTen, ts.NgaySinh, ts.GioiTinh, ts.NamThi,
             nv.MaTruong, kq.KhoaHoc
      FROM ThiSinhDuThi ts
      JOIN KetQuaTuyenSinh kq ON ts.MaThiSinh = kq.MaThiSinh
      JOIN NguyenVong nv ON kq.NguyenVongTrungTuyen = nv.MaNguyenVong
      WHERE ts.MaThiSinh = ?
    `, [maTS]);

    if (info.length === 0) throw new Error('Không tìm thấy thông tin trúng tuyển');

    const c = info[0];

    // Tạo mã học sinh mới
    const maHocSinh = await NhapHocModel.generateMaHocSinh(c.NamThi);

    // Insert vào HocSinh với mã mới
    await db.execute(`
      INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, KhoaHoc, GioiTinh, TrangThai, MaLop, MaTruong, ToHop)
      VALUES (?, ?, ?, ?, ?, 'Đang học', NULL, ?, ?)
    `, [
      maHocSinh,
      c.HoTen,
      c.NgaySinh,
      c.KhoaHoc || `${c.NamThi}-${parseInt(c.NamThi) + 3}`,
      c.GioiTinh || 'Nam',
      c.MaTruong,
      toHop
    ]);

    // Tạo tài khoản với tên = maHocSinh mới
    const defaultHash = '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG';
    await db.execute(`
      INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan)
      VALUES (?, ?, 'Học sinh')
    `, [maHocSinh, defaultHash]);

    // Cập nhật trạng thái trong KetQuaTuyenSinh để lần sau load thấy "Đã nhập học"
    await db.execute(`
      UPDATE KetQuaTuyenSinh SET TinhTrang = 'Đã nhập học' WHERE MaThiSinh = ?
    `, [maTS]);

    return { maHocSinh };
  }
};

module.exports = NhapHocModel;