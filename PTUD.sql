-- ==========================
-- 1. TẠO CSDL
-- ==========================
CREATE DATABASE IF NOT EXISTS PTUD
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE PTUD;

-- ==========================
-- 2. TẠO BẢNG (CỘT + KHÓA CHÍNH)
-- ==========================

CREATE TABLE Khoi (
    MaKhoi CHAR(5) PRIMARY KEY,
    TenKhoi VARCHAR(50) UNIQUE
);

CREATE TABLE ToHopMon (
    MaToHop CHAR(10) PRIMARY KEY,
    TenToHop VARCHAR(100) UNIQUE
);

CREATE TABLE HocKy (
    NamHoc CHAR(9) NOT NULL,
    KyHoc ENUM('1','2') NOT NULL,
    TrangThai ENUM('Đang học','Kết thúc','Chưa bắt đầu'),
    NgayBatDau DATE,
    NgayKetThuc DATE,
    PRIMARY KEY(NamHoc, KyHoc)
);

CREATE TABLE Truong (
    MaTruong CHAR(5) PRIMARY KEY,
    TenTruong VARCHAR(150),
    DiaChi VARCHAR(200),
    Email VARCHAR(100) UNIQUE,
    TrangThai BIT DEFAULT 1,
    SDT VARCHAR(20)
);

CREATE TABLE NamThi (
    TimeStart CHAR(4) PRIMARY KEY,
    TimeEnd CHAR(4)
);

CREATE TABLE MonHoc (
    TenMonHoc VARCHAR(100) PRIMARY KEY,
    SoTiet INT DEFAULT 0,
    MaToHop CHAR(10),
    TrangThai ENUM('Đang dạy','Ngưng dạy') DEFAULT 'Đang dạy',
    Khoi CHAR(5)
);

CREATE TABLE Lop (
    MaLop CHAR(5) PRIMARY KEY,
    TenLop VARCHAR(50),
    MaToHop CHAR(10),
    TrangThai ENUM('Đang học','Đã ra trường','Tạm ngưng') DEFAULT 'Đang học',
    Khoi CHAR(5),
    SiSo INT DEFAULT 0,
    MaTruong CHAR(5) NOT NULL
);

CREATE TABLE GiaoVien (
    MaGiaoVien CHAR(10) PRIMARY KEY,
    TenGiaoVien VARCHAR(100),
    GioiTinh ENUM('Nam','Nữ') DEFAULT 'Nam',
    NgaySinh DATE,
    Email VARCHAR(100) UNIQUE,
    SDT VARCHAR(15) UNIQUE,
    TrinhDoChuyenMon VARCHAR(100),
    DiaChi VARCHAR(255),
    NgayVaoTruong DATE,
    TrangThai ENUM('Đang công tác','Nghỉ việc','Tạm nghỉ') DEFAULT 'Đang công tác',
    TenMonHoc VARCHAR(100),
    TinhTrangHonNhan ENUM('Độc Thân','Đã Kết Hôn','Li Thân') DEFAULT 'Độc thân',
    ChucVu VARCHAR(50),
    ThamNien VARCHAR(20),
    MaTruong CHAR(5)
);

CREATE TABLE HieuTruong (
    MaHieuTruong CHAR(10) PRIMARY KEY,
    TenHieuTruong VARCHAR(100),
    NgaySinh DATE,
    GioiTinh ENUM('Nam','Nữ') DEFAULT 'Nam',
    Email VARCHAR(100) UNIQUE,
    SDT VARCHAR(15),
    NgayNhanChuc DATE,
    DiaChi VARCHAR(255),
    GhiChu TEXT,
    ThoiGianCongTac INT DEFAULT 0,
    MaTruong CHAR(5) NOT NULL
);

CREATE TABLE HocSinh (
    MaHocSinh CHAR(10) PRIMARY KEY,
    TenHocSinh VARCHAR(100),
    Birthday DATE,
    KhoaHoc VARCHAR(9),
    GioiTinh VARCHAR(10),
    TrangThai VARCHAR(20) DEFAULT 'Đang học',
    MaLop CHAR(5)
);

CREATE TABLE BaiTap (
    MaBaiTap CHAR(10) PRIMARY KEY,
    NoiDung TEXT,
    NgayGiao DATE,
    NgayHetHan DATE,
    MaLop CHAR(5),
    MaGiaoVien CHAR(10)
);

CREATE TABLE GVBoMon (
    MaGVBM CHAR(8),
    MaLop CHAR(5),
    NamHoc CHAR(9),
    HocKy ENUM('1','2') NOT NULL,
    BoMon VARCHAR(100),
    PRIMARY KEY(MaGVBM, MaLop, NamHoc, HocKy, BoMon)
);

CREATE TABLE GVChuNhiem (
    MaGVCN CHAR(8),
    MaLop CHAR(5),
    NamHoc CHAR(9),
    PRIMARY KEY(MaGVCN, MaLop, NamHoc)
);

CREATE TABLE PhuHuynh (
    HoTen VARCHAR(100),
    Email VARCHAR(100),
    SDT VARCHAR(12),
    MaHocSinh CHAR(10)
);

CREATE TABLE TaiKhoan (
    TenTaiKhoan VARCHAR(50) PRIMARY KEY,
    MatKhau VARCHAR(255),
    LoaiTaiKhoan VARCHAR(20)
);

CREATE TABLE ThoiKhoaBieu (
    LoaiTKB VARCHAR(20) NOT NULL,
    MaLop CHAR(5) NOT NULL,
    TenMonHoc VARCHAR(100) NOT NULL,
    TietHoc INT NOT NULL,
    KyHoc ENUM('1','2') NOT NULL,
    Thu ENUM('2','3','4','5','6','7','CN') NOT NULL,
    Ngay DATE,
    MaGiaoVien CHAR(10),
    NamHoc CHAR(9) NOT NULL,
    PRIMARY KEY (MaLop, LoaiTKB, Thu, TietHoc, TenMonHoc, Ngay)
);

CREATE TABLE DiemDanh (
    MaHocSinh CHAR(10),
    TenMonHoc VARCHAR(100),
    Ngay DATE,
    TrangThai VARCHAR(20),
    Tiet INT,
    PRIMARY KEY(MaHocSinh, TenMonHoc, Ngay, Tiet)
);

CREATE TABLE Diem (
    MaHocSinh CHAR(10) NOT NULL,
    TenMonHoc VARCHAR(100) NOT NULL,
    NamHoc CHAR(9) NOT NULL,
    HocKi ENUM('1','2') NOT NULL,
    ThuongXuyen1 DECIMAL(4,2),
    ThuongXuyen2 DECIMAL(4,2),
    ThuongXuyen3 DECIMAL(4,2),
    Diem15_1 DECIMAL(4,2),
    Diem15_2 DECIMAL(4,2),
    GK DECIMAL(4,2),
    CK DECIMAL(4,2),
    TrungBinhMon DECIMAL(4,2),
    PRIMARY KEY(MaHocSinh, TenMonHoc, NamHoc, HocKi)
);


CREATE TABLE YeuCauSuaDiem (
    MaYeuCau CHAR(12) PRIMARY KEY,
    MaHocSinh CHAR(10) NOT NULL,
    Mon VARCHAR(100) NOT NULL,
    NamHoc CHAR(9) NOT NULL,
    HocKi ENUM('1','2') NOT NULL,
    LoaiDiem VARCHAR(50) NOT NULL, -- xác định cột điểm sửa (ThuongXuyen1, GK, CK, ...)
    DiemCu DECIMAL(5,2),
    DiemMoi DECIMAL(5,2),
    LyDo VARCHAR(500),
    MinhChung VARCHAR(255),
    MaHieuTruong CHAR(10),
    MaGiaoVien CHAR(10),
    TrangThai VARCHAR(20) DEFAULT 'DangXuLy',
    GhiChu TEXT                -- cột ghi chú mới
);


CREATE TABLE ThiSinhDuThi (
    MaThiSinh CHAR(10) PRIMARY KEY,
    HoTen VARCHAR(100),
    NgaySinh DATE,
    Toan DECIMAL(4,2) DEFAULT 0,
    Van DECIMAL(4,2) DEFAULT 0,
    Anh DECIMAL(4,2) DEFAULT 0,
    TuChon DECIMAL(4,2) DEFAULT 0,
    NgayThi DATE,
    SDT VARCHAR(20),
    Email VARCHAR(100),
    GioiTinh VARCHAR(10),
    TongDiem DECIMAL(5,2) DEFAULT 0,
    NamThi CHAR(4),
    PhongThi VARCHAR(10)
);

CREATE TABLE NguyenVong (
    MaNguyenVong CHAR(5) PRIMARY KEY,
    MaThiSinh CHAR(10),
    MaTruong CHAR(5),
    ThuTuNguyenVong INT DEFAULT 1,
    ToHopMon CHAR(10),
    TrangThai VARCHAR(20) DEFAULT 'Đang xét'
);

CREATE TABLE KetQuaTuyenSinh (
    MaThiSinh CHAR(10) PRIMARY KEY,
    NguyenVongTrungTuyen CHAR(5),
    KhoaHoc VARCHAR(100),
    TinhTrang VARCHAR(50) DEFAULT 'Chờ xét',
    CHECK (TinhTrang IN ('Đậu','Rớt','Chờ xét')),
    DiemTrungTuyen DECIMAL(5,2) DEFAULT 0,
    CHECK (TinhTrang IN ('Đậu','Rớt','Chờ xét')),
    MaToHop CHAR(10)
);

CREATE TABLE ChiTieu (
    ChiTieu CHAR(10) PRIMARY KEY,
    NamThi CHAR(4),
    NgayLap DATETIME DEFAULT NOW(),
    MaTruong CHAR(5) NOT NULL,
    SoLuongCT INT
);

CREATE TABLE PhongThi (
    MaPhongThi CHAR(8) PRIMARY KEY,
    MaTruong CHAR(5),
    NgayThi DATE,
    DiaDiemThi VARCHAR(200),
    MaGVCoiThi CHAR(8)
);

CREATE TABLE HocBa (
    MaHocSinh CHAR(10) NOT NULL,
    NamHoc CHAR(9) NOT NULL,
    HocKy ENUM('1','2') NOT NULL,
    HanhKiem VARCHAR(20),
    HocLuc VARCHAR(20),
    DiemTongKet DECIMAL(4,2),
    NhanXet TEXT,
    RenLuyen VARCHAR(20),
    PRIMARY KEY(MaHocSinh, NamHoc, HocKy),
    CHECK (HanhKiem IN ('Tốt','Khá','Trung bình','Yếu')),
    CHECK (HocLuc IN ('Giỏi','Khá','Trung bình','Yếu')),
    CHECK (RenLuyen IN ('Xuất sắc','Tốt','Khá','Kém'))
);

CREATE TABLE HocPhi (
    MaHocSinh CHAR(10),
    HocPhi DECIMAL(18,0),
    TrangThai VARCHAR(50),
    NamHoc CHAR(9),
    HocKi ENUM('1','2')
);

CREATE TABLE PhieuXinPhep (
    MaPhieu CHAR(10) PRIMARY KEY,
    LyDoNghi TEXT,
    Ngay DATE,
    MaHocSinh CHAR(10)
);


-- ==========================
-- 3. THÊM KHÓA NGOẠI
-- ==========================

ALTER TABLE HocBa
ADD CONSTRAINT FK_HocBa_HS FOREIGN KEY (MaHocSinh) REFERENCES HocSinh(MaHocSinh),
ADD CONSTRAINT FK_HocBa_HocKy FOREIGN KEY (NamHoc, HocKy) REFERENCES HocKy(NamHoc, KyHoc);

ALTER TABLE MonHoc
ADD CONSTRAINT FK_MonHoc_ToHop FOREIGN KEY(MaToHop) REFERENCES ToHopMon(MaToHop),
ADD CONSTRAINT FK_MonHoc_Khoi FOREIGN KEY(Khoi) REFERENCES Khoi(MaKhoi);

ALTER TABLE Lop
ADD CONSTRAINT FK_Lop_ToHop FOREIGN KEY(MaToHop) REFERENCES ToHopMon(MaToHop),
ADD CONSTRAINT FK_Lop_Truong FOREIGN KEY(MaTruong) REFERENCES Truong(MaTruong),
ADD CONSTRAINT FK_Lop_Khoi FOREIGN KEY(Khoi) REFERENCES Khoi(MaKhoi);

ALTER TABLE GiaoVien
ADD CONSTRAINT FK_GiaoVien_Truong FOREIGN KEY (MaTruong) REFERENCES Truong(MaTruong),
ADD CONSTRAINT FK_GiaoVien_MonHoc FOREIGN KEY (TenMonHoc) REFERENCES MonHoc(TenMonHoc);

ALTER TABLE BaiTap
ADD CONSTRAINT FK_BaiTap_Lop FOREIGN KEY(MaLop) REFERENCES Lop(MaLop),
ADD CONSTRAINT FK_BaiTap_GV FOREIGN KEY(MaGiaoVien) REFERENCES GiaoVien(MaGiaoVien);

ALTER TABLE GVBoMon
ADD CONSTRAINT FK_GVBM_GV FOREIGN KEY (MaGVBM) REFERENCES GiaoVien(MaGiaoVien),
ADD CONSTRAINT FK_GVBM_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop),
ADD CONSTRAINT FK_GVBM_HocKy FOREIGN KEY (NamHoc, HocKy) REFERENCES HocKy(NamHoc, KyHoc);

ALTER TABLE GVChuNhiem
ADD CONSTRAINT FK_GVCN_GV FOREIGN KEY(MaGVCN) REFERENCES GiaoVien(MaGiaoVien),
ADD CONSTRAINT FK_GVCN_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop),
ADD CONSTRAINT FK_GVCN_NamHoc FOREIGN KEY (NamHoc) REFERENCES HocKy(NamHoc);

ALTER TABLE PhuHuynh
ADD CONSTRAINT FK_PhuHuynh_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh);

ALTER TABLE DiemDanh
ADD CONSTRAINT FK_DiemDanh_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh);
-- ADD CONSTRAINT FK_DiemDanh_TKB_MonHoc FOREIGN KEY(TenMonHoc) REFERENCES ThoiKhoaBieu(TenMonHoc);

ALTER TABLE Diem
ADD CONSTRAINT FK_Diem_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh),
ADD CONSTRAINT FK_Diem_MonHoc FOREIGN KEY(TenMonHoc) REFERENCES MonHoc(TenMonHoc),
ADD CONSTRAINT FK_Diem_HocKy FOREIGN KEY(NamHoc, HocKi) REFERENCES HocKy(NamHoc, KyHoc);

ALTER TABLE HocPhi
ADD CONSTRAINT FK_HocPhi_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh),
ADD CONSTRAINT FK_HocPhi_HocKy FOREIGN KEY(NamHoc, HocKi) REFERENCES HocKy(NamHoc, KyHoc);

ALTER TABLE PhieuXinPhep
ADD CONSTRAINT FK_PXP_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh);

-- Thêm khóa ngoại
ALTER TABLE YeuCauSuaDiem
ADD CONSTRAINT FK_YC_HS FOREIGN KEY(MaHocSinh) REFERENCES HocSinh(MaHocSinh),
ADD CONSTRAINT FK_YC_MonHoc FOREIGN KEY(Mon) REFERENCES MonHoc(TenMonHoc),
ADD CONSTRAINT FK_YC_HieuTruong FOREIGN KEY(MaHieuTruong) REFERENCES HieuTruong(MaHieuTruong),
ADD CONSTRAINT FK_YC_GiaoVien FOREIGN KEY(MaGiaoVien) REFERENCES GiaoVien(MaGiaoVien),
ADD CONSTRAINT FK_YC_Diem FOREIGN KEY(MaHocSinh, Mon, NamHoc, HocKi)
    REFERENCES Diem(MaHocSinh, TenMonHoc, NamHoc, HocKi);

ALTER TABLE ThiSinhDuThi
ADD CONSTRAINT FK_ThiSinhDuThi_NamThi FOREIGN KEY(NamThi) REFERENCES NamThi(TimeStart),
ADD CONSTRAINT FK_ThiSinh_PhongThi FOREIGN KEY (PhongThi) REFERENCES PhongThi(MaPhongThi);

ALTER TABLE NguyenVong
ADD CONSTRAINT FK_NguyenVong_ThiSinh FOREIGN KEY(MaThiSinh) REFERENCES ThiSinhDuThi(MaThiSinh),
ADD CONSTRAINT FK_NguyenVong_Truong FOREIGN KEY(MaTruong) REFERENCES Truong(MaTruong),
ADD CONSTRAINT FK_NguyenVong_ToHop FOREIGN KEY(ToHopMon) REFERENCES ToHopMon(MaToHop);

ALTER TABLE KetQuaTuyenSinh
ADD CONSTRAINT FK_KQTS_ThiSinh FOREIGN KEY(MaThiSinh) REFERENCES ThiSinhDuThi(MaThiSinh),
ADD CONSTRAINT FK_KQTS_NguyenVong FOREIGN KEY(NguyenVongTrungTuyen) REFERENCES NguyenVong(MaNguyenVong),
ADD CONSTRAINT FK_KQTS_ToHop FOREIGN KEY(MaToHop) REFERENCES ToHopMon(MaToHop);

ALTER TABLE ChiTieu
ADD CONSTRAINT FK_ChiTieu_Truong FOREIGN KEY(MaTruong) REFERENCES Truong(MaTruong),
ADD CONSTRAINT FK_ChiTieu_NamThi FOREIGN KEY (NamThi) REFERENCES NamThi(TimeStart);

ALTER TABLE PhongThi
ADD CONSTRAINT FK_PhongThi_Truong FOREIGN KEY(MaTruong) REFERENCES Truong(MaTruong),
ADD CONSTRAINT FK_PhongThi_GV FOREIGN KEY(MaGVCoiThi) REFERENCES GiaoVien(MaGiaoVien);

ALTER TABLE HieuTruong
ADD CONSTRAINT FK_HieuTruong_Truong FOREIGN KEY(MaTruong) REFERENCES Truong(MaTruong);

ALTER TABLE ThoiKhoaBieu
ADD CONSTRAINT FK_TKB_Lop FOREIGN KEY(MaLop) REFERENCES Lop(MaLop),
ADD CONSTRAINT FK_TKB_MonHoc FOREIGN KEY(TenMonHoc) REFERENCES MonHoc(TenMonHoc),
ADD CONSTRAINT FK_TKB_GVBM FOREIGN KEY(MaGiaoVien) REFERENCES GVBoMon(MaGVBM),
ADD CONSTRAINT FK_TKB_HocKy FOREIGN KEY(NamHoc, KyHoc) REFERENCES HocKy(NamHoc, KyHoc);

ALTER TABLE PhuHuynh
ADD CONSTRAINT FK_PhuHuynh_TaiKhoan
FOREIGN KEY (SDT)
REFERENCES TaiKhoan(TenTaiKhoan)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ==========================
-- TẠO BẢNG GIÁO VỤ
-- ==========================
CREATE TABLE GiaoVu (
    MaGiaoVu CHAR(10) PRIMARY KEY,
    TenGiaoVu VARCHAR(100),
    GioiTinh ENUM('Nam','Nữ') DEFAULT 'Nam',
    NgaySinh DATE,
    Email VARCHAR(100) UNIQUE,
    SDT VARCHAR(15) UNIQUE,
    DiaChi VARCHAR(255),
    NgayVaoTruong DATE,
    TrangThai ENUM('Đang công tác','Nghỉ việc','Tạm nghỉ') DEFAULT 'Đang công tác',
    MaTruong CHAR(5) NOT NULL
);

-- ==========================
-- THÊM KHÓA NGOẠI
-- ==========================
ALTER TABLE GiaoVu
ADD CONSTRAINT FK_GiaoVu_Truong
FOREIGN KEY (MaTruong) REFERENCES Truong(MaTruong)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE HocSinh 
ADD COLUMN ToHop CHAR(10) DEFAULT NULL;

ALTER TABLE HocSinh
ADD CONSTRAINT FK_HocSinh_ToHop 
FOREIGN KEY (ToHop) REFERENCES ToHopMon(MaToHop)
ON DELETE SET NULL
ON UPDATE CASCADE;


ALTER TABLE TaiKhoan ADD COLUMN TrangThai TINYINT DEFAULT 1;


-- ALTER TABLE TaiKhoan ADD COLUMN MatKhauGoc VARCHAR(255) NOT NULL AFTER MatKhau;


-- ==========================
-- 1. SỬA SCHEMA (Mở rộng MaLop từ CHAR(5) sang CHAR(10) như File 1)
-- ==========================
-- Trước tiên, drop các FK liên quan đến MaLop để tránh lỗi khi modify
ALTER TABLE BaiTap DROP FOREIGN KEY FK_BaiTap_Lop;
ALTER TABLE GVBoMon DROP FOREIGN KEY FK_GVBM_Lop;
ALTER TABLE GVChuNhiem DROP FOREIGN KEY FK_GVCN_Lop;
ALTER TABLE ThoiKhoaBieu DROP FOREIGN KEY FK_TKB_Lop;
ALTER TABLE HocSinh DROP FOREIGN KEY FK_HocSinh_ToHop;  -- Drop tạm nếu có (từ File 2)

-- Modify cột MaLop sang CHAR(10)
ALTER TABLE Lop MODIFY COLUMN MaLop CHAR(10);
ALTER TABLE BaiTap MODIFY COLUMN MaLop CHAR(10);
ALTER TABLE GVBoMon MODIFY COLUMN MaLop CHAR(10);
ALTER TABLE GVChuNhiem MODIFY COLUMN MaLop CHAR(10);
ALTER TABLE HocSinh MODIFY COLUMN MaLop CHAR(10);
ALTER TABLE ThoiKhoaBieu MODIFY COLUMN MaLop CHAR(10);

-- Add lại các FK đã drop
ALTER TABLE BaiTap ADD CONSTRAINT FK_BaiTap_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE GVBoMon ADD CONSTRAINT FK_GVBM_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE GVChuNhiem ADD CONSTRAINT FK_GVCN_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE ThoiKhoaBieu ADD CONSTRAINT FK_TKB_Lop FOREIGN KEY (MaLop) REFERENCES Lop(MaLop) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE HocSinh ADD CONSTRAINT FK_HocSinh_ToHop FOREIGN KEY (ToHop) REFERENCES ToHopMon(MaToHop) ON DELETE SET NULL ON UPDATE CASCADE;  -- Add lại nếu cần từ File 2

-- ==========================
-- 2. THÊM CỘT MaTruong VÀO HocSinh NHƯ FILE 1
-- ==========================
ALTER TABLE HocSinh ADD COLUMN MaTruong CHAR(5) AFTER MaLop;

-- ==========================
-- 3. THÊM FOREIGN KEY CHO MaTruong TRONG HocSinh
-- ==========================
ALTER TABLE HocSinh ADD CONSTRAINT FK_HocSinh_Truong FOREIGN KEY (MaTruong) REFERENCES Truong(MaTruong) ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================
-- 4. THÊM CỘT MaToHop VÀO ChiTieu NHƯ FILE 1
-- ==========================
ALTER TABLE ChiTieu ADD COLUMN MaToHop CHAR(10) AFTER SoLuongCT;

-- ==========================
-- 5. THÊM FOREIGN KEY CHO MaToHop TRONG ChiTieu
-- ==========================
ALTER TABLE ChiTieu ADD CONSTRAINT FK_ChiTieu_ToHop FOREIGN KEY (MaToHop) REFERENCES ToHopMon(MaToHop) ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================
-- 6. THAY ĐỔI KIỂU DỮ LIỆU/ĐỘ DÀI CỘT ĐỂ MATCH FILE 1
-- ==========================

-- 1. Drop foreign key đang tham chiếu đến MaPhongThi
ALTER TABLE ThiSinhDuThi DROP FOREIGN KEY FK_ThiSinh_PhongThi;

-- 2. Bây giờ mới được modify cột MaPhongThi trong bảng PhongThi
ALTER TABLE PhongThi MODIFY COLUMN MaPhongThi CHAR(10);

-- 3. Modify cột PhongThi trong ThiSinhDuThi để đồng bộ kiểu dữ liệu (từ VARCHAR(10) → CHAR(10) như File 1)
ALTER TABLE ThiSinhDuThi MODIFY COLUMN PhongThi CHAR(10);

-- 4. Add lại foreign key với hành vi giống File 1 (ON DELETE SET NULL)
ALTER TABLE ThiSinhDuThi
ADD CONSTRAINT FK_ThiSinh_PhongThi
FOREIGN KEY (PhongThi) REFERENCES PhongThi(MaPhongThi)
ON DELETE SET NULL ON UPDATE CASCADE;

-- 1. Drop foreign key đang tham chiếu đến MaNguyenVong
ALTER TABLE KetQuaTuyenSinh DROP FOREIGN KEY FK_KQTS_NguyenVong;

-- 2. Bây giờ mới được modify cột MaNguyenVong trong bảng NguyenVong
ALTER TABLE NguyenVong MODIFY COLUMN MaNguyenVong CHAR(10);

-- 3. Modify cột NguyenVongTrungTuyen trong KetQuaTuyenSinh để đồng bộ kiểu dữ liệu (từ CHAR(5) → CHAR(10))
ALTER TABLE KetQuaTuyenSinh MODIFY COLUMN NguyenVongTrungTuyen CHAR(10);

-- 4. Add lại foreign key đúng như File 1 (ON DELETE SET NULL)
ALTER TABLE KetQuaTuyenSinh
ADD CONSTRAINT FK_KQTS_NguyenVong
FOREIGN KEY (NguyenVongTrungTuyen) REFERENCES NguyenVong(MaNguyenVong)
ON DELETE SET NULL ON UPDATE CASCADE;

-- KetQuaTuyenSinh
ALTER TABLE KetQuaTuyenSinh MODIFY COLUMN NguyenVongTrungTuyen CHAR(10);
ALTER TABLE KetQuaTuyenSinh MODIFY COLUMN KhoaHoc VARCHAR(9);
-- Thay đổi TinhTrang từ VARCHAR(50) với CHECK sang ENUM (drop CHECK trước nếu cần)
ALTER TABLE KetQuaTuyenSinh DROP CHECK KetQuaTuyenSinh_chk_1;  -- Giả sử tên CHECK là default, thay bằng tên thực nếu khác
ALTER TABLE KetQuaTuyenSinh DROP CHECK KetQuaTuyenSinh_chk_2;  -- Nếu có nhiều CHECK
ALTER TABLE KetQuaTuyenSinh MODIFY COLUMN TinhTrang ENUM('Chờ xét','Đậu','Rớt') DEFAULT 'Chờ xét';

-- ThiSinhDuThi
ALTER TABLE ThiSinhDuThi MODIFY COLUMN PhongThi CHAR(10);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN SDT VARCHAR(15);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN GioiTinh ENUM('Nam','Nữ');
-- Xóa DEFAULT 0 cho các cột điểm để match File 1 (nếu có dữ liệu, cần xử lý cẩn thận)
ALTER TABLE ThiSinhDuThi MODIFY COLUMN Toan DECIMAL(4,2);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN Van DECIMAL(4,2);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN Anh DECIMAL(4,2);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN TuChon DECIMAL(4,2);
ALTER TABLE ThiSinhDuThi MODIFY COLUMN TongDiem DECIMAL(5,2);



ALTER TABLE KetQuaTuyenSinh 
MODIFY COLUMN TinhTrang VARCHAR(50) DEFAULT 'Chờ xét';

ALTER TABLE KetQuaTuyenSinh 
ADD CONSTRAINT ck_ketqua_tinhtrang 
CHECK (TinhTrang IN ('Chờ xét', 'Đậu', 'Rớt', 'Đã nhập học'));


--   
-- -- 1. Thêm cột Khoi vào GVBoMon
-- ALTER TABLE GVBoMon
-- ADD COLUMN Khoi CHAR(5);

-- -- 2. Thêm khóa ngoại từ GVBoMon.Khoi → Khoi.MaKhoi
-- ALTER TABLE GVBoMon
-- ADD CONSTRAINT FK_GVBM_Khoi
-- FOREIGN KEY (Khoi) REFERENCES Khoi(MaKhoi)
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;



