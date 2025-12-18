// models/PhanBoHocSinhVaoTruongModel.js
const db = require('../config/database');

const PhanBoHocSinhVaoTruongModel = {
  getYears: async () => {
    const query = `SELECT TimeStart FROM NamThi ORDER BY TimeStart DESC`;
    const [rows] = await db.execute(query);
    return rows.map(r => r.TimeStart);
  },

  hasAllocationResults: async (nam_thi) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM KetQuaTuyenSinh kq 
      JOIN ThiSinhDuThi ts ON kq.MaThiSinh = ts.MaThiSinh 
      WHERE ts.NamThi = ? 
        AND kq.NguyenVongTrungTuyen IS NOT NULL
        AND kq.TinhTrang = 'Đậu'
    `;
    const [rows] = await db.execute(query, [nam_thi]);
    return rows[0].count > 0;
  },

  getAllocationResults: async (nam_thi) => {
    const resultsQuery = `
      SELECT 
        kq.MaThiSinh, 
        ts.HoTen,
        ts.TongDiem,
        kq.NguyenVongTrungTuyen, 
        kq.MaToHop AS ToHopMon, 
        nv.MaTruong,
        tr.TenTruong
      FROM KetQuaTuyenSinhTuyenSinh kq
      JOIN ThiSinhDuThi ts ON kq.MaThiSinh = ts.MaThiSinh
      JOIN NguyenVong nv ON kq.NguyenVongTrungTuyen = nv.MaNguyenVong
      JOIN Truong tr ON nv.MaTruong = tr.MaTruong
      WHERE ts.NamThi = ?
        AND kq.NguyenVongTrungTuyen IS NOT NULL
        AND kq.TinhTrang = 'Đậu'
      ORDER BY ts.TongDiem DESC, ts.HoTen
    `;
    const [resultsRows] = await db.execute(resultsQuery, [nam_thi]);

    const candidatesQuery = `SELECT COUNT(*) as count FROM ThiSinhDuThi WHERE NamThi = ? AND TongDiem IS NOT NULL`;
    const [candidatesRows] = await db.execute(candidatesQuery, [nam_thi]);
    const totalCandidates = candidatesRows[0].count;

    const stats = {};
    resultsRows.forEach(r => {
      const school = r.MaTruong;
      const tohop = r.ToHopMon;
      if (!stats[school]) stats[school] = {};
      stats[school][tohop] = (stats[school][tohop] || 0) + 1;
    });

    return {
      results: resultsRows.map(r => ({
        MaThiSinh: r.MaThiSinh,
        HoTen: r.HoTen,
        TongDiem: r.TongDiem,
        NguyenVongTrungTuyen: r.NguyenVongTrungTuyen,
        MaTruong: r.MaTruong,
        TenTruong: r.TenTruong,
        ToHopMon: r.ToHopMon
      })),
      stats,
      totalAllocated: resultsRows.length,
      totalCandidates
    };
  },

  getCandidates: async (nam_thi) => {
    const query = `
      SELECT MaThiSinh, HoTen, TongDiem
      FROM ThiSinhDuThi
      WHERE NamThi = ? AND TongDiem IS NOT NULL
      ORDER BY TongDiem DESC, HoTen
    `;
    const [rows] = await db.execute(query, [nam_thi]);
    return rows;
  },

  getWishes: async (nam_thi) => {
    const query = `
      SELECT nv.MaNguyenVong, nv.MaThiSinh, nv.MaTruong, nv.ThuTuNguyenVong, nv.ToHopMon, tr.TenTruong
      FROM NguyenVong nv
      JOIN ThiSinhDuThi ts ON nv.MaThiSinh = ts.MaThiSinh
      JOIN Truong tr ON nv.MaTruong = tr.MaTruong
      WHERE ts.NamThi = ?
      ORDER BY nv.MaThiSinh, nv.ThuTuNguyenVong
    `;
    const [rows] = await db.execute(query, [nam_thi]);
    return rows;
  },

  getQuotas: async (nam_thi) => {
    const query = `
      SELECT ct.MaTruong, tr.TenTruong, ct.MaToHop, th.TenToHop, ct.SoLuongCT
      FROM ChiTieu ct
      JOIN Truong tr ON ct.MaTruong = tr.MaTruong
      LEFT JOIN ToHopMon th ON ct.MaToHop = th.MaToHop
      WHERE ct.NamThi = ?
    `;
    const [rows] = await db.execute(query, [nam_thi]);
    const quotas = {};
    rows.forEach(r => {
      if (!quotas[r.MaTruong]) quotas[r.MaTruong] = { TenTruong: r.TenTruong, tohops: {} };
      quotas[r.MaTruong].tohops[r.MaToHop] = {
        ten: r.TenToHop || r.MaToHop,
        soluong: r.SoLuongCT
      };
    });
    return quotas;
  },

  allocate: async (nam_thi) => {
    const candidates = await PhanBoHocSinhVaoTruongModel.getCandidates(nam_thi);
    const wishes = await PhanBoHocSinhVaoTruongModel.getWishes(nam_thi);
    let quotas = await PhanBoHocSinhVaoTruongModel.getQuotas(nam_thi);

    const wishesByCandidate = {};
    wishes.forEach(w => {
      if (!wishesByCandidate[w.MaThiSinh]) wishesByCandidate[w.MaThiSinh] = [];
      wishesByCandidate[w.MaThiSinh].push(w);
    });

    const currentQuota = JSON.parse(JSON.stringify(quotas));

    const results = [];
    const stats = {};

    for (const candidate of candidates) {
      const candidateWishes = wishesByCandidate[candidate.MaThiSinh] || [];
      let allocated = false;

      for (const wish of candidateWishes) {
        const school = wish.MaTruong;
        const tohop = wish.ToHopMon;

        if (currentQuota[school] && currentQuota[school].tohops[tohop] && currentQuota[school].tohops[tohop].soluong > 0) {
          currentQuota[school].tohops[tohop].soluong--;

          results.push({
            MaThiSinh: candidate.MaThiSinh,
            HoTen: candidate.HoTen,
            TongDiem: candidate.TongDiem,
            NguyenVongTrungTuyen: wish.MaNguyenVong,
            MaTruong: school,
            TenTruong: wish.TenTruong,
            ToHopMon: tohop
          });

          if (!stats[school]) stats[school] = {};
          stats[school][tohop] = (stats[school][tohop] || 0) + 1;
          allocated = true;
          break;
        }
      }
    }

    return {
      results,
      stats,
      totalAllocated: results.length,
      totalCandidates: candidates.length
    };
  },

  getKhoaHoc: async (nam_thi) => {
    const query = `SELECT CONCAT(TimeStart, '-', TimeEnd) AS KhoaHoc FROM NamThi WHERE TimeStart = ?`;
    const [rows] = await db.execute(query, [nam_thi]);
    return rows[0]?.KhoaHoc || `${nam_thi}-${parseInt(nam_thi) + 1}`;
  },

  
  // === Hàm saveAllocation đã loại bỏ phần insert vào HocSinh ===
  saveAllocation: async (results, nam_thi) => {
    // Xóa kết quả cũ trong KetQuaTuyenSinh
    const deleteQuery = `DELETE FROM KetQuaTuyenSinh WHERE MaThiSinh IN (SELECT MaThiSinh FROM ThiSinhDuThi WHERE NamThi = ?)`;
    await db.execute(deleteQuery, [nam_thi]);

    // Lấy khóa học
    const khoaHoc = await PhanBoHocSinhVaoTruongModel.getKhoaHoc(nam_thi);

    for (const r of results) {
      // Insert vào KetQuaTuyenSinh
      const insertKQQuery = `
        INSERT INTO KetQuaTuyenSinh (MaThiSinh, NguyenVongTrungTuyen, KhoaHoc, TinhTrang, DiemTrungTuyen, MaToHop)
        VALUES (?, ?, ?, 'Đậu', ?, ?)
      `;
      await db.execute(insertKQQuery, [r.MaThiSinh, r.NguyenVongTrungTuyen, khoaHoc, r.TongDiem, r.ToHopMon]);

      // Cập nhật nguyện vọng trúng tuyển
      const updateNVTrung = `UPDATE NguyenVong SET TrangThai = 'Trúng tuyển' WHERE MaNguyenVong = ?`;
      await db.execute(updateNVTrung, [r.NguyenVongTrungTuyen]);
    }

    // Cập nhật các nguyện vọng còn lại thành 'Rớt'
    const updateNVRot = `
      UPDATE NguyenVong nv
      JOIN ThiSinhDuThi ts ON nv.MaThiSinh = ts.MaThiSinh
      SET nv.TrangThai = 'Rớt'
      WHERE ts.NamThi = ? AND nv.TrangThai = 'Đang xét'
    `;
    await db.execute(updateNVRot, [nam_thi]);
  }
};

module.exports = PhanBoHocSinhVaoTruongModel;