# Hướng dẫn Kiểm tra Chức năng Phân công Giáo viên

## 1. Chuẩn bị Dữ liệu

### a. Tạo CSDL (nếu chưa có)
```bash
mysql -u root -p < path/to/your/create_tables.sql
```

### b. Chạy seed data
```bash
cd t:\7_PTUD\PTUD_TheChill_1
node seed/seedPhanCong.js
```

Kết quả mong đợi:
```
✓ Inserted Truong
✓ Inserted Khoi
✓ Inserted ToHopMon
✓ Inserted HocKy
✓ Inserted MonHoc
✓ Inserted Lop
✓ Inserted GiaoVien
✓ Inserted ThoiKhoaBieu
✅ Seed completed successfully!
```

## 2. Chạy Server

```bash
npm start
```

Server sẽ lắng nghe tại `http://localhost:5000`

## 3. Mở Giao diện

### Option A: Trực tiếp (không qua SPA)
```
http://localhost:5000/api/phancongchunhiembomon/render
```

### Option B: Qua ứng dụng chính (nếu có menu)
- Đăng nhập với tài khoản Hiệu trưởng
- Click vào menu "Phân công giáo viên"

## 4. Kiểm tra Chức năng

### **4.1 Phân công Giáo viên Chủ nhiệm**

#### Bước 1: Chọn Năm học & Học kỳ
- Năm học: **2024-2025**
- Học kỳ: **1** (Đang học)
- Bấm: **[Tải danh sách lớp]** (tab Chủ nhiệm)

**Kết quả mong đợi:**
- Hiển thị 4 lớp: L101, L102, L103, L104
- Cột "Giáo viên chủ nhiệm" hiện "Chưa phân công" cho tất cả

#### Bước 2: Phân công lớp L101
- Bấm **[Phân công]** ở hàng L101 (10A1)

**Kết quả mong đợi:**
- Modal hiện
- Danh sách giáo viên: GV001 (Nguyễn Văn A), GV006 (Vũ Thị F), GV007 (Đặng Văn G), ...
  - **Không có GV002, GV003, ...** (nếu họ đã là chủ nhiệm lớp khác)

#### Bước 3: Chọn giáo viên và xác nhận
- Chọn: **Nguyễn Văn A (GV001)**
- Bấm **[Xác nhận]**

**Kết quả mong đợi:**
- Hiển thị: "Phân công giáo viên chủ nhiệm thành công"
- Danh sách cập nhật: L101 hiện "Nguyễn Văn A"

**Kiểm tra DB:**
```sql
SELECT * FROM GVChuNhiem WHERE MaLop = 'L101' AND NamHoc = '2024-2025';
-- Kết quả: MaGVCN=GV001, MaLop=L101, NamHoc=2024-2025
```

---

### **4.2 Phân công Giáo viên Bộ môn**

#### Bước 1: Chọn Khối
- Tab **[Bộ môn]**
- Khối: **Khối 10**
- Sẽ tự hiện danh sách môn

**Kết quả mong đợi:**
- Danh sách môn: Toán, Vật Lý, Hóa Học, Sinh Học, Tiếng Anh

#### Bước 2: Chọn Môn
- Môn: **Toán**
- Tự động hiện danh sách giáo viên dạy Toán

**Kết quả mong đợi:**
- Danh sách giáo viên: GV001, GV006 (cả hai dạy Toán)

#### Bước 3: Chọn Giáo viên
- Giáo viên: **Nguyễn Văn A (GV001)**
- Hiển thị: "Số tiết hiện tại: 2" (từ ThoiKhoaBieu)

#### Bước 4: Tải Lớp của Khối
- Bấm **[Tải lớp]**

**Kết quả mong đợi:**
- Hiển thị 4 lớp Khối 10: L101, L102, L103, L104
- Cột "Số tiết môn" hiện 2 (L101, L102 dạy Toán 2 tiết), 0 (L103, L104)

#### Bước 5: Chọn Lớp & Phân công
- Chọn checkbox lớp: **L101, L102**
- Bấm **[Phân công bộ môn]**

**Kết quả mong đợi:**
- Kiểm tra: "Số tiết hiện tại: 2, số tiết sẽ thêm: 4 (2+2), tối đa: 40"
- ✓ Hợp lệ → "Phân công bộ môn thành công"
- Danh sách lớp cập nhật

**Kiểm tra DB:**
```sql
SELECT * FROM GVBoMon WHERE MaGVBM = 'GV001' AND NamHoc = '2024-2025' AND HocKy = '1';
-- Kết quả: 2 bản ghi (L101, L102 với BoMon=Toán)
```

---

### **4.3 Kiểm tra Lỗi: Vượt quá giới hạn số tiết**

#### Chuẩn bị: Chọn giáo viên với tải cao
- Chọn **GV006** (Vũ Thị F) - có 2 tiết ở TKB
- Chọn tất cả lớp: L101, L102, L103, L104
- Mỗi lớp 2 tiết Toán = 8 tiết → Tổng: 2 + 8 = 10 ✓ OK

**Lưu ý:** với dữ liệu seed, hầu hết không vượt 40. Có thể tùy chỉnh ThoiKhoaBieu để test giới hạn.

---

### **4.4 Kiểm tra Lỗi: Kỳ học đã hoàn thành**

#### Bước:
- Chọn Năm học: **2023-2024**, Học kỳ: **1**
- Bấm **[Tải danh sách lớp]**

**Kết quả mong đợi:**
- Hiển thị cảnh báo: "Kỳ học này đã hoàn thành, không thể thực hiện phân công"

---

## 5. Kiểm tra Console & Network

### Browser DevTools (F12)

#### Console Tab
- Không có lỗi JavaScript
- Có log: `Số tiết hiện tại: X`

#### Network Tab
```
GET /api/phancongchunhiembomon/render
POST /api/phancongchunhiembomon/classes
  → Response: {"success":true, "classes":[...]}

POST /api/phancongchunhiembomon/teachers-available
  → Response: {"success":true, "teachers":[...]}

POST /api/phancongchunhiembomon/assign-chunhiem
  → Response: {"success":true, "message":"..."}
```

---

## 6. Câu lệnh SQL Kiểm tra Kết quả

### Xem tất cả GVCN đã phân công
```sql
SELECT gvc.MaGVCN, gv.TenGiaoVien, gvc.MaLop, l.TenLop, gvc.NamHoc
FROM GVChuNhiem gvc
JOIN GiaoVien gv ON gvc.MaGVCN = gv.MaGiaoVien
JOIN Lop l ON gvc.MaLop = l.MaLop
ORDER BY gvc.NamHoc, gvc.MaLop;
```

### Xem tất cả GVBM đã phân công
```sql
SELECT gbm.MaGVBM, gv.TenGiaoVien, gbm.MaLop, gbm.BoMon, gbm.NamHoc, gbm.HocKy
FROM GVBoMon gbm
JOIN GiaoVien gv ON gbm.MaGVBM = gv.MaGiaoVien
ORDER BY gbm.NamHoc, gbm.HocKy, gbm.BoMon;
```

### Xem số tiết từng giáo viên
```sql
SELECT MaGiaoVien, TenMonHoc, COUNT(*) AS SoTiet, NamHoc, KyHoc
FROM ThoiKhoaBieu
GROUP BY MaGiaoVien, NamHoc, KyHoc
ORDER BY NamHoc, KyHoc, MaGiaoVien;
```

---

## 7. Khắc phục Sự cố

### Nếu không hiển thị gì khi bấm "Tải danh sách lớp"

**Nguyên nhân:** DB trống hoặc kết nối lỗi

**Giải pháp:**
1. Chạy `node seed/seedPhanCong.js` lại
2. Kiểm tra `.env`:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=...
   MYSQL_DATABASE=PTUD
   ```
3. Kiểm tra DevTools → Network → kiểm tra status response `/api/phancongchunhiembomon/classes`
   - Nếu 500: xem server console lỗi
   - Nếu 200 nhưng `success: false`: xem `message`

### Nếu không tìm thấy giáo viên

**Nguyên nhân:** 
- GiaoVien không có TrangThai = 'Đang công tác'
- TenMonHoc không khớp

**Giải pháp:**
```sql
-- Cập nhật giáo viên
UPDATE GiaoVien SET TrangThai = 'Đang công tác' WHERE MaTruong = 'T001';

-- Xem giáo viên của từng môn
SELECT * FROM GiaoVien WHERE TenMonHoc = 'Toán';
```

---

## 8. Tính năng Mở rộng (Optional)

- [ ] Thêm nút "Tất cả" để xem tất cả request
- [ ] Hiển thị bảng tổng hợp phân công sau khi hoàn thành
- [ ] Thêm spinner/loader khi đang tải
- [ ] Export Excel báo cáo phân công

---

## Tóm tắt Endpoint API

| Endpoint | Method | Tham số | Mô tả |
|----------|--------|--------|-------|
| `/render` | GET | - | Render trang HTML |
| `/classes` | POST | NamHoc | Lấy danh sách lớp |
| `/teachers-available` | POST | NamHoc, MaLop | Lấy GV khả dụng làm GVCN |
| `/assign-chunhiem` | POST | MaLop, NamHoc, MaGVCN, KyHoc | Phân công GVCN |
| `/khoi-list` | POST | - | Lấy danh sách khối |
| `/subjects` | POST | MaKhoi | Lấy môn theo khối |
| `/classes-by-khoi` | POST | MaKhoi | Lấy lớp theo khối |
| `/teachers-by-subject` | POST | TenMonHoc, NamHoc, KyHoc | Lấy GV dạy môn |
| `/assign-bomon` | POST | MaGiaoVien, ClassList, NamHoc, KyHoc, TenMonHoc | Phân công GVBM |
| `/teacher-load` | POST | MaGiaoVien, NamHoc, KyHoc | Lấy số tiết hiện tại |
| `/check-hk-status` | POST | NamHoc, KyHoc | Kiểm tra trạng thái học kỳ |

