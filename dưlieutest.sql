-- ==========================
-- THÊM DỮ LIỆU TEST
-- ==========================
-- Khoi
INSERT INTO Khoi (MaKhoi, TenKhoi) VALUES
('K01','Khối 10'),
('K02','Khối 11'),
('K03','Khối 12');

-- ToHopMon
INSERT INTO ToHopMon (MaToHop, TenToHop) VALUES
('TH01','Toán, Lý, Hóa'),
('TH02','Văn, Sử, Địa'),
('TH03','Anh, Tin, GDCD');

-- HocKy
INSERT INTO HocKy (NamHoc, KyHoc, TrangThai, NgayBatDau, NgayKetThuc) VALUES
('2025-2026','1','Đang học','2025-09-01','2025-12-20'),
('2025-2026','2','Chưa bắt đầu','2026-01-05','2026-05-10'),
('2026-2027','1','Chưa bắt đầu','2026-09-01','2026-12-20');

-- NamThi
INSERT INTO NamThi (TimeStart, TimeEnd) VALUES
('2025','2026'),
('2026','2027');

-- Truong
INSERT INTO Truong (MaTruong, TenTruong, DiaChi, Email, TrangThai, SDT) VALUES
('T01','THPT A','123 Đường A, HCM','thpta@gmail.com',1,'0909123456'),
('T02','THPT B','456 Đường B, HCM','thptb@gmail.com',1,'0909765432'),
('T03','THPT C','789 Đường C, HCM','thptc@gmail.com',1,'0909988776');

-- MonHoc
INSERT INTO MonHoc (TenMonHoc, SoTiet, MaToHop, TrangThai, Khoi) VALUES
('Toán', '2', 'TH01', 'Đang dạy', 'K01'),
('Lý', '3', 'TH01', 'Đang dạy', 'K01'),
('Văn', '4', 'TH02', 'Đang dạy', 'K01'),
('Anh', '2', 'TH03', 'Đang dạy', 'K01'),
('Tin', '2', 'TH03', 'Đang dạy', 'K01'),
('EMPTY_WEEK', '0', 'TH01', 'Đang dạy', 'K01');

-- Lop
INSERT INTO Lop (MaLop, TenLop, MaToHop, TrangThai, Khoi, SiSo, MaTruong) VALUES
('L01','10A1','TH01','Đang học','K01',35,'T01'),
('L02','10A2','TH01','Đang học','K01',30,'T01'),
('L03','10B1','TH02','Đang học','K01',32,'T02'),
('L04', '10B2', 'TH02', 'Đang học', 'K01', 35, 'T01'),
('L05', '10C1', 'TH03', 'Đang học', 'K01', 30, 'T01'),
('L06','11A1','TH01','Đang học','K02',35,'T01'),
('L07','11B1','TH02','Đang học','K02',32,'T02'),
('L08','12A1','TH01','Đang học','K03',35,'T01'),
('L09','12B1','TH02','Đang học','K03',32,'T02');

-- GiaoVien
INSERT INTO GiaoVien (MaGiaoVien, TenGiaoVien, GioiTinh, NgaySinh, Email, SDT, TrinhDoChuyenMon, DiaChi, NgayVaoTruong, TrangThai, TenMonHoc, TinhTrangHonNhan, ChucVu, ThamNien, MaTruong)
VALUES
('GV004','Le Van Fe','Nam','1978-02-05','gv123@gmail.com','0911223345','Cử nhân Văn','HCM','2012-07-01','Đang công tác','Văn','Độc Thân','Giáo viên','13 năm','T02'),
('GV001','Nguyen Van D','Nam','1980-03-10','gv1@gmail.com','0912345678','Cử nhân Toán','HCM','2010-09-01','Đang công tác','Toán','Độc Thân','Giáo viên','15 năm','T01'),
('GV002','Tran Thi E','Nữ','1982-11-20','gv2@gmail.com','0987654321','Cử nhân Lý','HCM','2011-08-15','Đang công tác','Lý','Đã Kết Hôn','Giáo viên','14 năm','T01'),
('GV003','Le Van F','Nam','1978-02-05','gv3@gmail.com','0911223344','Cử nhân Văn','HCM','2012-07-01','Đang công tác','Văn','Độc Thân','Giáo viên','13 năm','T02'),
('GV000', 'GV Ảo', 'Nam', '2000-01-01', 'gv.ao@example.com', '0000000000', 'Cử nhân', 'HCM', '2025-09-01', 'Đang công tác', 'EMPTY_WEEK', 'Độc thân', 'Giáo viên', '0', 'T01');

-- HieuTruong
INSERT INTO HieuTruong (MaHieuTruong, TenHieuTruong, NgaySinh, GioiTinh, Email, SDT, NgayNhanChuc, DiaChi, GhiChu, ThoiGianCongTac, MaTruong)
VALUES
('HT001','Nguyen Van Hieu','1975-04-15','Nam','hieu1@gmail.com','0912111222','2010-09-01','123 Đường A, HCM','Tốt nghiệp ĐH Sư phạm','15','T01'),
('HT002','Tran Thi Hien','1978-08-20','Nữ','hien1@gmail.com','0912333444','2012-08-15','456 Đường B, HCM','Có kinh nghiệm quản lý','12','T02');

-- HocSinh
INSERT INTO HocSinh (MaHocSinh, TenHocSinh, Birthday, KhoaHoc, GioiTinh, TrangThai, MaLop, MaTruong, ToHop) VALUES
('HS001', 'Nguyễn Văn An', '2009-01-15', '2025-2028', 'Nam', 'Đang học', 'L01', 'T01', 'TH01'),
('HS002', 'Trần Thị Bình', '2009-02-20', '2025-2028', 'Nữ', 'Đang học', 'L01', 'T01', 'TH01'),
('HS003', 'Lê Văn Cường', '2009-03-25', '2025-2028', 'Nam', 'Đang học', 'L03', 'T02', 'TH02'),
('HS004', 'Phạm Thị Dung', '2009-04-30', '2025-2028', 'Nữ', 'Đang học', 'L03', 'T02', 'TH02'),
('HS005', 'Hoàng Văn Em', '2009-05-05', '2025-2028', 'Nam', 'Đang học', 'L05', 'T01', 'TH03'),
('HS011', 'Nguyễn Thị Giang', '2009-06-10', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS012', 'Trần Văn Hải', '2009-07-15', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS013', 'Lê Thị Lan', '2009-08-20', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS014', 'Phạm Văn Minh', '2009-09-25', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS015', 'Hoàng Thị Nga', '2009-10-30', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS016', 'Nguyễn Văn Phong', '2009-11-05', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS017', 'Trần Thị Quỳnh', '2009-12-10', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS018', 'Lê Văn Sơn', '2009-01-20', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS019', 'Phạm Thị Tâm', '2009-02-25', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS020', 'Hoàng Văn Tuấn', '2009-03-30', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS021', 'Nguyễn Thị Uyên', '2009-04-05', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS022', 'Trần Văn Vũ', '2009-05-10', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS023', 'Lê Thị Xuân', '2009-06-15', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS024', 'Phạm Văn Yên', '2009-07-20', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS025', 'Hoàng Thị Zoe', '2009-08-25', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS031', 'Nguyễn Văn Anh', '2009-09-30', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS032', 'Trần Thị Bảo', '2009-10-05', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS033', 'Lê Văn Châu', '2009-11-10', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS034', 'Phạm Thị Diệp', '2009-12-15', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS035', 'Hoàng Văn Đức', '2009-01-25', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS036', 'Nguyễn Thị Hoa', '2009-02-28', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS037', 'Trần Văn Hùng', '2009-03-05', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS038', 'Lê Thị Kim', '2009-04-10', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS039', 'Phạm Văn Long', '2009-05-15', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS040', 'Hoàng Thị Mai', '2009-06-20', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS041', 'Nguyễn Văn Nam', '2009-07-25', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS042', 'Trần Thị Oanh', '2009-08-30', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS043', 'Lê Văn Phúc', '2009-09-05', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS044', 'Phạm Thị Quyên', '2009-10-10', '2025-2028', 'Nữ', 'Đang học', NULL, 'T02', 'TH02'),
('HS045', 'Hoàng Văn Thành', '2009-11-15', '2025-2028', 'Nam', 'Đang học', NULL, 'T02', 'TH02'),
('HS051', 'Nguyễn Thị Thảo', '2009-12-20', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH03'),
('HS052', 'Trần Văn Trung', '2009-01-10', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS053', 'Lê Thị Uyên', '2009-02-15', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH03'),
('HS054', 'Phạm Văn Vinh', '2009-03-20', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS055', 'Hoàng Thị Như', '2009-04-25', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH03'),
('HS056', 'Nguyễn Văn Đạt', '2009-05-30', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS057', 'Trần Thị Hiền', '2009-06-05', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH03'),
('HS058', 'Lê Văn Khánh', '2009-07-10', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS059', 'Phạm Thị Linh', '2009-08-15', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH03'),
('HS060', 'Hoàng Văn Mạnh', '2009-09-20', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS071', 'Nguyễn Văn Nhật', '2009-10-25', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS072', 'Trần Thị Phương', '2009-11-30', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS073', 'Lê Văn Quang', '2009-12-05', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS074', 'Phạm Thị Thư', '2009-01-12', '2025-2028', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS075', 'Hoàng Văn Tài', '2009-02-17', '2025-2028', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS101', 'Nguyễn Văn TestK02', '2008-01-15', '2024-2027', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS102', 'Trần Thị TestK02', '2008-02-20', '2024-2027', 'Nữ', 'Đang học', NULL, 'T01', 'TH02'),
('HS103', 'Lê Văn TestK02', '2008-03-25', '2024-2027', 'Nam', 'Đang học', 'L06', 'T01', 'TH01'),
('HS104', 'Phạm Thị TestK02', '2008-04-30', '2024-2027', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS105', 'Hoàng Văn TestK02', '2008-05-05', '2024-2027', 'Nam', 'Đang học', NULL, 'T01', 'TH03'),
('HS201', 'Nguyễn Văn TestK03', '2007-01-15', '2023-2026', 'Nam', 'Đang học', NULL, 'T01', 'TH01'),
('HS202', 'Trần Thị TestK03', '2007-02-20', '2023-2026', 'Nữ', 'Đang học', NULL, 'T01', 'TH02'),
('HS203', 'Lê Văn TestK03', '2007-03-25', '2023-2026', 'Nam', 'Đang học', 'L08', 'T01', 'TH01'),
('HS204', 'Phạm Thị TestK03', '2007-04-30', '2023-2026', 'Nữ', 'Đang học', NULL, 'T01', 'TH01'),
('HS205', 'Hoàng Văn TestK03', '2007-05-05', '2023-2026', 'Nam', 'Đang học', NULL, 'T01', 'TH03');

-- BaiTap
INSERT INTO BaiTap (MaBaiTap, NoiDung, NgayGiao, NgayHetHan, MaLop, MaGiaoVien) VALUES
('BT001','Vẽ đồ thị hàm số y=2x+1','2025-09-02','2025-09-10','L01','GV001'),
('BT002','Vẽ biểu đồ cột số học sinh theo lớp','2025-09-03','2025-09-11','L01','GV002'),
('BT003','Tạo sơ đồ tổ chức lớp học','2025-09-04','2025-09-12','L02','GV003');

-- GVBoMon
INSERT INTO GVBoMon (MaGVBM, MaLop, NamHoc, HocKy, BoMon) VALUES
('GV001','L01','2025-2026','1', 'Toán'),
('GV002','L01','2025-2026','1', 'Lý'),
('GV003','L03','2025-2026','1', 'Văn'),
('GV001','L02','2025-2026','1', 'Toán'),
('GV002','L02','2025-2026','1', 'Lý'),
('GV000', 'L01', '2025-2026', '1', 'EMPTY_WEEK');

-- GVChuNhiem
INSERT INTO GVChuNhiem (MaGVCN, MaLop, NamHoc) VALUES
('GV001','L01','2025-2026'),
('GV003','L03','2025-2026'),
('GV004','L02','2025-2026'); 


-- TaiKhoan
INSERT INTO TaiKhoan (TenTaiKhoan, MatKhau, LoaiTaiKhoan) VALUES
('GV004', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo viên'),
('GVU02', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo vụ'),
('TS002', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Thí sinh'),
('TS001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Thí sinh'),

('HS001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Học sinh'),
('0339601700', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Phụ huynh'),
('GV001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo viên'),
('GV002', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo viên'),
('GV003', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo viên'),
('GVU01', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Giáo vụ'),
('HT001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Hiệu trưởng'),
('HT002', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Hiệu trưởng'),
('NV001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Cán bộ SGD'),
('QT001', '$2b$10$9eywuUw58WqQM6hOK.hnD.Vs8QvuTHO2hso.azTn4y4U8weUZTauG', 'Quản trị hệ thống');


INSERT INTO PhuHuynh (HoTen, Email, SDT, MaHocSinh) VALUES
('Nguyen Van F', NULL, '0339601700','HS001');
-- ThoiKhoaBieu
INSERT INTO ThoiKhoaBieu
(LoaiTKB, MaLop, TenMonHoc, TietHoc, Thu, KyHoc, Ngay, MaGiaoVien, NamHoc)
VALUES
('Tuan1','L01','Toán',2,'2','1','2025-09-01','GV001','2025-2026'),
('Tuan1','L01','Lý',4,'3','1','2025-09-02','GV002','2025-2026'),
('Tuan1','L01','Toán',2,'4','1','2025-09-03','GV001','2025-2026'),
('Tuan1','L01','Lý',4,'5','1','2025-09-04','GV002','2025-2026'),
('TuanTest', 'L01', 'EMPTY_WEEK', 1, '2', '1', '2025-09-01', 'GV000', '2025-2026');

-- DiemDanh
INSERT INTO DiemDanh (MaHocSinh, TenMonHoc, Ngay, TrangThai, Tiet) VALUES
('HS001','Toán','2025-09-02','Có mặt',1),
('HS002','Toán','2025-09-02','Vắng',1),
('HS003','Văn','2025-09-02','Có mặt',1);

-- Diem
INSERT INTO Diem (MaHocSinh, TenMonHoc, NamHoc, HocKi, ThuongXuyen1, ThuongXuyen2, ThuongXuyen3, Diem15_1, Diem15_2, GK, CK, TrungBinhMon) VALUES
('HS001','Toán','2025-2026','1',8,9,10,9,8,8.5,9,8.8),
('HS001','Văn','2025-2026','1',8,9,10,9,8,8.5,9,8.8),
('HS001','Lý','2025-2026','1',8,9,10,9,8,8.5,9,8.8),
('HS002','Toán','2025-2026','1',7,8,9,7,8,8,8,8.0),
('HS003','Văn','2025-2026','1',9,9,10,9,9,9,9,9.0);

-- YeuCauSuaDiem
INSERT INTO YeuCauSuaDiem
(MaYeuCau, TrangThai, DiemCu, DiemMoi, LyDo, MinhChung, MaHocSinh, LoaiDiem, Mon, NamHoc, HocKi, MaGiaoVien, MaHieuTruong)
VALUES
('YC001','DangXuLy',9,9.5,'Điểm 15 phút 1 sai','minhchung1.jpg','HS001','Diem15_1','Toán','2025-2026','1','GV001','HT001'),
('YC002','DangXuLy',8,8.5,'Điểm 15 phút 2 sai','minhchung2.jpg','HS002','Diem15_2','Toán','2025-2026','1','GV002','HT001'),
('YC003','DangXuLy',9,9.2,'Điểm 15 phút 1 sai','minhchung3.jpg','HS003','Diem15_1','Văn','2025-2026','1','GV003','HT002'),
('YC004','DangXuLy',9,9.5,'Điểm 15 phút 1 sai','minhchung1.jpg','HS001','Diem15_2','Toán','2025-2026','1','GV001','HT001'),
('YC005','DangXuLy',8,8.5,'Điểm 15 phút 2 sai','minhchung2.jpg','HS002','Diem15_2','Toán','2025-2026','1','GV002','HT001'),
('YC006','DangXuLy',9,9.2,'Điểm 15 phút 1 sai','minhchung3.jpg','HS003','Diem15_2','Văn','2025-2026','1','GV003','HT002');

-- PhongThi
INSERT INTO PhongThi (MaPhongThi, MaTruong, NgayThi, DiaDiemThi, MaGVCoiThi) VALUES
('PT001','T01','2025-10-10','Phòng 101','GV001'),
('PT002','T02','2025-10-11','Phòng 102','GV003');

INSERT INTO ThiSinhDuThi (MaThiSinh, HoTen, NgaySinh, Toan, Van, Anh, TuChon, NgayThi, SDT, Email, GioiTinh, TongDiem, NamThi, PhongThi) VALUES
('TS001','Nguyen Van A','2009-05-12',8,7,9,8,'2025-10-10','0912345678','ts001@gmail.com','Nam',32.00,'2025','PT001'),
('TS002','Tran Thi B','2009-07-20',7,8,8,9,'2025-10-11','0911223344','ts002@gmail.com','Nữ',32.00,'2025','PT001'),
('TS003','Le Thi C','2009-06-15',9.5,8.5,9,8,'2025-10-10','0912345679','ts003@gmail.com','Nữ',35.00,'2025','PT001'),
('TS004','Pham Van D','2009-08-10',7,9,7.5,8.5,'2025-10-11','0912345680','ts004@gmail.com','Nam',32.00,'2025','PT002'),
('TS005','Vo Thi E','2009-09-05',8.5,7.5,8,9,'2025-10-10','0912345681','ts005@gmail.com','Nữ',33.00,'2025','PT001'),
('TS006','Nguyen Van F','2009-10-20',6.5,8,7,7.5,'2025-10-11','0912345682','ts006@gmail.com','Nam',29.00,'2025','PT002'),
('TS007','Tran Thi G','2009-11-15',9,9,8.5,8.5,'2025-10-10','0912345683','ts007@gmail.com','Nữ',35.00,'2025','PT001'),
('TS008','Hoang Van H','2009-12-01',8.5,7.5,8.0,9.0,'2025-10-12','0912345684','ts008@gmail.com','Nam',33.00,'2025','PT001'),
('TS009','Nguyen Thi I','2010-01-15',9.0,8.0,7.5,8.5,'2027-10-10','0912345685','ts009@gmail.com','Nữ',33.00,'2026','PT002'),
('TS010','Le Van J','2010-02-20',7.5,8.5,9.0,7.0,'2027-10-10','0912345686','ts010@gmail.com','Nam',32.00,'2026','PT002');

INSERT IGNORE INTO ThiSinhDuThi (MaThiSinh, HoTen, NgaySinh, Toan, Van, Anh, TuChon, NgayThi, SDT, Email, GioiTinh, TongDiem, NamThi, PhongThi) VALUES
('TS011','Candidate A Van','2009-07-14',9.7,9.8,9.5,8.1,'2025-10-12','0911258365','ts011@gmail.com','Nữ',37.1,'2025','PT001'),
('TS012','Candidate B Van','2009-04-20',5.2,9.1,5.4,5.3,'2027-10-11','0912217309','ts012@gmail.com','Nữ',25.0,'2026','PT001'),
('TS013','Candidate C Thi','2009-07-08',8.2,7.1,5.2,9.6,'2027-10-11','0918690480','ts013@gmail.com','Nữ',30.1,'2026','PT002'),
('TS014','Candidate D Van','2009-11-27',6.0,5.2,6.6,9.6,'2025-10-11','0914936992','ts014@gmail.com','Nam',27.4,'2025','PT001'),
('TS015','Candidate E Thi','2010-03-03',9.5,8.9,9.1,6.9,'2025-10-12','0917447047','ts015@gmail.com','Nam',34.4,'2025','PT002'),
('TS016','Candidate F Thi','2010-11-02',5.8,8.8,7.9,7.4,'2025-10-11','0915621028','ts016@gmail.com','Nữ',29.9,'2025','PT001'),
('TS017','Candidate G Van','2010-12-03',9.2,9.0,5.3,7.1,'2025-10-10','0914933252','ts017@gmail.com','Nữ',30.6,'2025','PT002'),
('TS018','Candidate H Thi','2010-09-11',6.6,8.1,6.6,5.5,'2027-10-12','0917158450','ts018@gmail.com','Nam',26.8,'2026','PT002'),
('TS019','Candidate I Thi','2009-10-15',7.3,8.8,7.2,7.3,'2025-10-11','0914564542','ts019@gmail.com','Nam',30.6,'2025','PT001'),
('TS020','Candidate J Van','2010-10-06',5.8,5.9,5.8,8.5,'2025-10-10','0917330947','ts020@gmail.com','Nam',26.0,'2025','PT002'),
('TS021','Candidate K Thi','2010-11-04',5.9,5.6,8.0,8.3,'2027-10-12','0912649628','ts021@gmail.com','Nữ',27.8,'2026','PT002'),
('TS022','Candidate L Van Thi','2009-09-26',9.2,6.6,6.8,6.3,'2027-10-11','0916161500','ts022@gmail.com','Nữ',28.9,'2026','PT001'),
('TS023','Candidate M Van','2009-01-04',7.9,6.5,6.6,5.8,'2025-10-10','0917459876','ts023@gmail.com','Nam',26.8,'2025','PT001'),
('TS024','Candidate N Thi','2010-02-03',9.1,9.2,7.6,8.4,'2025-10-10','0914473953','ts024@gmail.com','Nam',34.3,'2025','PT002'),
('TS025','Candidate O Van','2009-07-06',5.1,7.2,9.4,5.2,'2025-10-12','0914799428','ts025@gmail.com','Nam',26.9,'2025','PT001'),
('TS026','Candidate P Van','2009-04-25',7.7,7.4,5.1,7.6,'2027-10-10','0916760905','ts026@gmail.com','Nữ',27.8,'2026','PT002'),
('TS027','Candidate Q Van Thi','2009-12-26',8.0,5.0,6.4,6.5,'2027-10-10','0916202497','ts027@gmail.com','Nam',25.9,'2026','PT002'),
('TS028','Candidate R Van Thi','2010-09-16',8.8,9.5,6.5,5.8,'2027-10-10','0917009731','ts028@gmail.com','Nữ',30.6,'2026','PT001'),
('TS029','Candidate S Van','2010-07-14',8.4,6.5,7.3,7.1,'2027-10-12','0918160167','ts029@gmail.com','Nam',29.3,'2025','PT001'),
('TS030','Candidate T Van','2009-01-01',7.6,9.9,9.2,9.2,'2027-10-10','0914881771','ts030@gmail.com','Nữ',35.9,'2025','PT001');


-- NguyenVong
INSERT INTO NguyenVong (MaNguyenVong, MaThiSinh, MaTruong, ThuTuNguyenVong, ToHopMon, TrangThai) VALUES
('NV001','TS001','T01',1,'TH01','Đang xét'),
('NV002','TS002','T02',1,'TH02','Đang xét'),
('NV003','TS003','T01',1,'TH01','Đang xét'),
('NV004','TS003','T02',2,'TH02','Đang xét'),
('NV005','TS003','T03',3,'TH01','Đang xét'),
('NV006','TS004','T02',1,'TH01','Đang xét'),
('NV007','TS004','T01',2,'TH02','Đang xét'),
('NV008','TS005','T01',1,'TH01','Đang xét'),
('NV009','TS005','T03',2,'TH01','Đang xét'),
('NV010','TS006','T02',1,'TH02','Đang xét'),
('NV011','TS006','T01',2,'TH01','Đang xét'),
('NV012','TS007','T01',1,'TH01','Đang xét'),
('NV013','TS007','T02',2,'TH01','Đang xét'),
('NV014','TS007','T02',3,'TH02','Đang xét'),
('NV015','TS008','T01',1,'TH02','Đang xét'),
('NV016','TS009','T01',1,'TH01','Đang xét'),
('NV017','TS009','T02',2,'TH02','Đang xét'),
('NV018','TS010','T03',1,'TH01','Đang xét');

INSERT IGNORE INTO NguyenVong (MaNguyenVong, MaThiSinh, MaTruong, ThuTuNguyenVong, ToHopMon, TrangThai) VALUES
('NV019','TS001','T01',1,'TH04','Đang xét'),
('NV020','TS001','T01',2,'TH03','Đang xét'),
('NV021','TS002','T03',1,'TH02','Đang xét'),
('NV022','TS002','T01',2,'TH04','Đang xét'),
('NV023','TS002','T02',3,'TH03','Đang xét'),
('NV024','TS003','T01',1,'TH02','Đang xét'),
('NV025','TS004','T03',1,'TH03','Đang xét'),
('NV026','TS005','T01',1,'TH04','Đang xét'),
('NV027','TS006','T01',1,'TH01','Đang xét'),
('NV028','TS006','T03',2,'TH02','Đang xét'),
('NV029','TS006','T02',3,'TH01','Đang xét'),
('NV030','TS007','T01',1,'TH01','Đang xét'),
('NV031','TS007','T02',2,'TH01','Đang xét'),
('NV032','TS007','T02',3,'TH04','Đang xét'),
('NV033','TS008','T01',1,'TH04','Đang xét'),
('NV034','TS008','T02',2,'TH02','Đang xét'),
('NV035','TS009','T03',1,'TH03','Đang xét'),
('NV036','TS010','T01',1,'TH04','Đang xét'),
('NV037','TS010','T01',2,'TH04','Đang xét'),
('NV038','TS011','T01',1,'TH04','Đang xét'),
('NV039','TS012','T01',1,'TH01','Đang xét'),
('NV040','TS012','T02',2,'TH03','Đang xét'),
('NV041','TS012','T01',3,'TH02','Đang xét'),
('NV042','TS013','T03',1,'TH02','Đang xét'),
('NV043','TS014','T02',1,'TH02','Đang xét'),
('NV044','TS015','T01',1,'TH03','Đang xét'),
('NV045','TS015','T02',2,'TH01','Đang xét'),
('NV046','TS016','T01',1,'TH02','Đang xét'),
('NV047','TS016','T01',2,'TH02','Đang xét'),
('NV048','TS016','T02',3,'TH03','Đang xét'),
('NV049','TS017','T02',1,'TH04','Đang xét'),
('NV050','TS017','T03',2,'TH02','Đang xét'),
('NV051','TS017','T02',3,'TH01','Đang xét'),
('NV052','TS018','T02',1,'TH03','Đang xét'),
('NV053','TS019','T01',1,'TH03','Đang xét'),
('NV054','TS019','T01',2,'TH03','Đang xét'),
('NV055','TS020','T02',1,'TH02','Đang xét'),
('NV056','TS021','T03',1,'TH03','Đang xét'),
('NV057','TS021','T01',2,'TH04','Đang xét'),
('NV058','TS021','T02',3,'TH03','Đang xét'),
('NV059','TS022','T02',1,'TH02','Đang xét'),
('NV060','TS023','T02',1,'TH01','Đang xét'),
('NV061','TS023','T05',2,'TH02','Đang xét'),
('NV062','TS023','T03',3,'TH04','Đang xét'),
('NV063','TS024','T01',1,'TH02','Đang xét'),
('NV064','TS024','T05',2,'TH04','Đang xét'),
('NV065','TS024','T01',3,'TH02','Đang xét'),
('NV066','TS025','T01',1,'TH04','Đang xét'),
('NV067','TS025','T01',2,'TH03','Đang xét'),
('NV068','TS026','T02',1,'TH03','Đang xét'),
('NV069','TS026','T01',2,'TH01','Đang xét'),
('NV070','TS027','T03',1,'TH04','Đang xét'),
('NV071','TS027','T01',2,'TH03','Đang xét'),
('NV072','TS028','T03',1,'TH03','Đang xét'),
('NV073','TS028','T03',2,'TH01','Đang xét'),
('NV074','TS029','T02',1,'TH03','Đang xét'),
('NV075','TS029','T01',2,'TH02','Đang xét'),
('NV076','TS030','T01',1,'TH01','Đang xét'),
('NV077','TS030','T03',2,'TH03','Đang xét');
-- KetQuaTuyenSinh
INSERT INTO KetQuaTuyenSinh (MaThiSinh, NguyenVongTrungTuyen, KhoaHoc, TinhTrang, DiemTrungTuyen, MaToHop) VALUES
('TS001',NULL,'2025-2026','Chờ xét',32,NULL),
('TS002',NULL,'2025-2026','Chờ xét',32,NULL),
('TS003',NULL,'2025-2026','Chờ xét',35,NULL),
('TS004',NULL,'2025-2026','Chờ xét',32,NULL),
('TS005',NULL,'2025-2026','Chờ xét',33,NULL),
('TS006',NULL,'2025-2026','Chờ xét',29,NULL),
('TS007',NULL,'2025-2026','Chờ xét',35,NULL),
('TS008',NULL,'2025-2026','Chờ xét',33,NULL),
('TS009',NULL,'2027-2028','Chờ xét',33,NULL),
('TS010',NULL,'2027-2028','Chờ xét',32,NULL);

INSERT IGNORE INTO KetQuaTuyenSinh (MaThiSinh, NguyenVongTrungTuyen, KhoaHoc, TinhTrang, DiemTrungTuyen, MaToHop) VALUES
('TS011',NULL,'2027-2026','Chờ xét',36.95098360705484,NULL),
('TS012',NULL,'2025-2026','Chờ xét',26.993835796565865,NULL),
('TS013',NULL,'2025-2028','Chờ xét',26.214659321908123,NULL),
('TS014',NULL,'2025-2028','Chờ xét',34.749739656172615,NULL),
('TS015',NULL,'2025-2026','Chờ xét',35.74943458785614,NULL),
('TS016',NULL,'2027-2028','Chờ xét',33.95156065351082,NULL),
('TS017',NULL,'2027-2026','Chờ xét',34.88464425576935,NULL),
('TS018',NULL,'2025-2028','Chờ xét',39.7111924825176,NULL),
('TS019',NULL,'2025-2026','Chờ xét',30.951125940719812,NULL),
('TS020',NULL,'2025-2026','Chờ xét',38.2594205600706,NULL),
('TS021',NULL,'2025-2028','Chờ xét',39.46934313755287,NULL),
('TS022',NULL,'2027-2028','Chờ xét',39.4699409686812,NULL),
('TS023',NULL,'2025-2028','Chờ xét',35.858201988180696,NULL),
('TS024',NULL,'2027-2028','Chờ xét',33.01606625236905,NULL),
('TS025',NULL,'2025-2026','Chờ xét',36.55412264879107,NULL),
('TS026',NULL,'2025-2026','Chờ xét',28.70132349794301,NULL),
('TS027',NULL,'2025-2028','Chờ xét',37.40926816250978,NULL),
('TS028',NULL,'2027-2026','Chờ xét',34.57172769182677,NULL),
('TS029',NULL,'2025-2026','Chờ xét',38.81045625376829,NULL),
('TS030',NULL,'2025-2028','Chờ xét',39.285659462627336,NULL);

INSERT IGNORE INTO ChiTieu (ChiTieu, NamThi, NgayLap, MaTruong, SoLuongCT, MaToHop) VALUES
('CT001','2025','2025-09-01 10:00:00','T01',2,'TH01'),
('CT002','2025','2025-09-01 10:00:00','T01',1,'TH02'),
('CT003','2025','2025-09-02 10:00:00','T02',3,'TH01'),
('CT004','2025','2025-09-02 10:00:00','T02',2,'TH02'),
('CT005','2025','2025-09-02 10:00:00','T03',1,'TH01'),
('CT006','2026','2025-09-02 10:00:00','T02',600,'TH02'),
('CT007','2025','2025-09-03 10:00:00','T03',2,'TH02'),
('CT008','2025','2027-09-01 10:00:00','T04',4,'TH01'),
('CT009','2025','2027-09-01 10:00:00','T05',3,'TH02'),
('CT010','2025','2025-09-03 10:00:00','T01',1,'TH03');
-- ChiTieu
INSERT IGNORE INTO ChiTieu (ChiTieu, NamThi, NgayLap, MaTruong, SoLuongCT, MaToHop) VALUES
('CT011','2025','2027-09-01 10:00:00','T03',3,'TH02'),
('CT012','2025','2025-09-02 10:00:00','T04',2,'TH03'),
('CT013','2025','2025-09-02 10:00:00','T04',4,'TH03'),
('CT014','2025','2025-09-04 10:00:00','T04',2,'TH01'),
('CT015','2025','2027-09-03 10:00:00','T05',4,'TH03'),
('CT016','2026','2026-09-04 10:00:00','T04',4,'TH02'),
('CT017','2026','2026-09-04 10:00:00','T05',1,'TH04'),
('CT018','2026','2027-09-01 10:00:00','T02',4,'TH02'),
('CT019','2026','2027-09-01 10:00:00','T03',1,'TH03'),
('CT020','2025','2027-09-04 10:00:00','T02',4,'TH01');


-- HocBa
INSERT INTO HocBa (MaHocSinh, NamHoc, HocKy, HanhKiem, HocLuc, DiemTongKet, NhanXet, RenLuyen) VALUES
('HS001','2025-2026','1','Tốt','Giỏi',9.0,'Học sinh chăm ngoan, tích cực','Xuất sắc'),
('HS001','2025-2026','2','Tốt','Giỏi',8.5,'Cần cải thiện môn Toán','Xuất sắc'),
('HS002','2025-2026','1','Khá','Khá',8.0,'Học sinh có tiến bộ','Tốt'),
('HS002','2025-2026','2','Khá','Khá',7.5,'Cần chú ý môn Văn','Tốt'),
('HS003','2025-2026','1','Tốt','Giỏi',9.2,'Tích cực tham gia lớp học','Xuất sắc'),
('HS003','2025-2026','2','Tốt','Giỏi',9.0,'Giữ vững phong độ học tập','Xuất sắc');

-- HocPhi
INSERT INTO HocPhi (MaHocSinh, HocPhi, TrangThai, NamHoc, HocKi) VALUES
('HS001',5000000,'Chưa nộp','2025-2026','1'),
('HS002',5000000,'Chưa nộp','2025-2026','1'),
('HS003',4500000,'Đã nộp','2025-2026','1');

-- PhieuXinPhep
INSERT INTO PhieuXinPhep (MaPhieu, LyDoNghi, Ngay, MaHocSinh) VALUES
('PX001','Bị ốm','2025-09-05','HS001'),
('PX002','Gia đình có việc','2025-09-06','HS002');

-- GiaoVu
INSERT INTO GiaoVu (MaGiaoVu, TenGiaoVu, GioiTinh, NgaySinh, Email, SDT, DiaChi, NgayVaoTruong, TrangThai, MaTruong)
VALUES
('GVU01','Nguyen Van G','Nam','1985-03-10','gvu1@gmail.com','0912000001','123 Đường A, HCM','2015-09-01','Đang công tác','T01'),
('GVU02','Tran Thi I','Nữ','1987-06-20','gvu2@gmail.com','0912000002','456 Đường B, HCM','2016-08-15','Đang công tác','T02'),
('GVU03','Le Van J','Nam','1990-01-15','gvu3@gmail.com','0912000003','789 Đường C, HCM','2017-07-10','Đang công tác','T01');





