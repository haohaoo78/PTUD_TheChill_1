const pool = require('../config/database');

const QuanLyHSGV = {
    // Học sinh
    getHocSinh: ({ namHoc, khoi, maLop }) =>
        pool.query(
            `SELECT hs.* FROM HocSinh hs
             JOIN Lop l ON hs.MaLop = l.MaLop
             WHERE l.Khoi=? AND l.MaLop=? AND hs.KhoaHoc=?`,
            [khoi, maLop, namHoc]
        ),

    createHocSinh: (data) => {
        const { MaHocSinh, TenHocSinh, Birthday, GioiTinh, KhoaHoc, MaLop } = data;
        return pool.query(
            `INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, GioiTinh, KhoaHoc, MaLop)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [MaHocSinh, TenHocSinh, Birthday, GioiTinh, KhoaHoc, MaLop]
        );
    },

    updateHocSinh: (MaHocSinh, data) => {
        const { TenHocSinh, Birthday, GioiTinh, MaLop } = data;
        return pool.query(
            `UPDATE HocSinh SET TenHocSinh=?, Birthday=?, GioiTinh=?, MaLop=? WHERE MaHocSinh=?`,
            [TenHocSinh, Birthday, GioiTinh, MaLop, MaHocSinh]
        );
    },

    deleteHocSinh: (MaHocSinh) =>
        pool.query(`UPDATE HocSinh SET TrangThai='Ngừng hoạt động' WHERE MaHocSinh=?`, [MaHocSinh]),

    // Giáo viên
    getGiaoVien: () => pool.query(`SELECT * FROM GiaoVien`),

    createGiaoVien: (data) => {
        const { MaGV, TenGV, Birthday, GioiTinh, Email, SDT, BoMon } = data;
        return pool.query(
            `INSERT INTO GiaoVien (MaGV, TenGV, Birthday, GioiTinh, Email, SDT, BoMon)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [MaGV, TenGV, Birthday, GioiTinh, Email, SDT, BoMon]
        );
    },

    updateGiaoVien: (MaGV, data) => {
        const { TenGV, Birthday, GioiTinh, Email, SDT, BoMon } = data;
        return pool.query(
            `UPDATE GiaoVien SET TenGV=?, Birthday=?, GioiTinh=?, Email=?, SDT=?, BoMon=? WHERE MaGV=?`,
            [TenGV, Birthday, GioiTinh, Email, SDT, BoMon, MaGV]
        );
    },

    deleteGiaoVien: (MaGV) =>
        pool.query(`UPDATE GiaoVien SET TrangThai='Ngừng hoạt động' WHERE MaGV=?`, [MaGV]),
};

module.exports = QuanLyHSGV;
