const db = global.db;

const NhapChitieuTuyenSinhModel = {
  getAll: async () => {
    const query = `
      SELECT ct.ChiTieu, ct.NamThi, ct.SoLuongCT, ct.MaTruong, ct.NgayLap,
             t.TenTruong, nt.TimeEnd AS NamThiEnd
      FROM ChiTieu ct
      LEFT JOIN Truong t ON ct.MaTruong = t.MaTruong
      LEFT JOIN NamThi nt ON ct.NamThi = nt.TimeStart
      ORDER BY ct.NgayLap DESC
    `;
    try {
      const [results] = await db.execute(query);
      return results;
    } catch (err) {
      console.error('Model getAll error:', err);
      throw err;
    }
  },

  create: async (data) => {
    const maChiTieu = `CT${data.nam_thi}${Date.now().toString().slice(-4)}`;
    const query = `
      INSERT INTO ChiTieu (ChiTieu, NamThi, MaTruong, SoLuongCT) 
      VALUES (?, ?, ?, ?)
    `;
    try {
      const [result] = await db.execute(query, [maChiTieu, data.nam_thi, data.ma_truong, data.so_luong_ct]);
      return { ...data, chitieu: maChiTieu, insertId: result.insertId };
    } catch (err) {
      console.error('Model create error:', err);
      throw err;
    }
  },

  update: async (chitieuId, data) => {
    const query = `
      UPDATE ChiTieu 
      SET NamThi = ?, MaTruong = ?, SoLuongCT = ? 
      WHERE ChiTieu = ?
    `;
    try {
      const [result] = await db.execute(query, [data.nam_thi, data.ma_truong, data.so_luong_ct, chitieuId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Model update error:', err);
      throw err;
    }
  },

  delete: async (chitieuId) => {
    const query = `DELETE FROM ChiTieu WHERE ChiTieu = ?`;
    try {
      const [result] = await db.execute(query, [chitieuId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Model delete error:', err);
      throw err;
    }
  },

  getById: async (chitieuId) => {
    const query = `SELECT * FROM ChiTieu WHERE ChiTieu = ?`;
    try {
      const [results] = await db.execute(query, [chitieuId]);
      if (results.length === 0) {
        throw new Error('Not found');
      }
      return results[0];
    } catch (err) {
      console.error('Model getById error:', err);
      throw err;
    }
  }
};

module.exports = NhapChitieuTuyenSinhModel;