const db = require('../config/database');
const ThoiKhoaBieu = require('../models/ThoiKhoaBieuModel'); // Reuse model từ chức năng lập TKB

class XemThoiKhoaBieuController {
  async renderPage(req, res) {
    try {
      const user = req.session.user;

      // Kiểm tra quyền: chỉ cho phép Học sinh hoặc Phụ huynh
      if (!user || 
          (user.loaiTaiKhoan !== 'Học sinh' && user.loaiTaiKhoan !== 'Phụ huynh') || 
          !user.MaLop) {
        return res.status(403).send('Bạn không có quyền truy cập chức năng này (chỉ dành cho Học sinh hoặc Phụ huynh).');
      }

      const MaLop = user.MaLop;
      const todayStr = new Date().toISOString().split('T')[0]; // Ví dụ: "2025-12-24"

      // Lấy thông tin kỳ học hiện tại dựa trên ngày hôm nay
      const [currentKy] = await db.execute(`
        SELECT NamHoc, KyHoc, NgayBatDau
        FROM HocKy
        WHERE NgayBatDau <= ?
        ORDER BY NgayBatDau DESC LIMIT 1
      `, [todayStr]);

      let selectedNamHoc = currentKy[0]?.NamHoc || '';
      let selectedKyHoc = currentKy[0]?.KyHoc || '';
      let selectedNamHocStart = currentKy[0]?.NgayBatDau || '2025-08-01';

      // Nếu không có kỳ nào hợp lệ, fallback về kỳ gần nhất
      if (!selectedNamHoc) {
        const [latestKy] = await db.execute(`
          SELECT NamHoc, KyHoc, NgayBatDau
          FROM HocKy
          ORDER BY NamHoc DESC, KyHoc DESC LIMIT 1
        `);
        selectedNamHoc = latestKy[0]?.NamHoc || '2025-2026';
        selectedKyHoc = latestKy[0]?.KyHoc || 'HK1';
        selectedNamHocStart = latestKy[0]?.NgayBatDau || '2025-08-01';
      }

      const namHocList = await ThoiKhoaBieu.getNamHocList();
      const kyHocListObj = await ThoiKhoaBieu.getKyHocList(selectedNamHoc);
      const kyHocList = kyHocListObj.map(k => k.KyHoc);

      // Tính tuần hiện tại dựa trên ngày bắt đầu học kỳ
      const baseDate = new Date(selectedNamHocStart);
      const day = baseDate.getDay();
      const offset = day === 1 ? 0 : (day === 0 ? 1 : 8 - day); // Điều chỉnh về Thứ 2 đầu tiên
      const firstMonday = new Date(baseDate);
      firstMonday.setDate(baseDate.getDate() + offset);

      const today = new Date();
      const diffMs = today - firstMonday;
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const weekNumber = Math.floor(diffDays / 7) + 1;

      // Giới hạn tuần từ 1 đến 20
      let selectedLoaiTKB = (weekNumber >= 1 && weekNumber <= 20) 
        ? `Tuan${weekNumber}` 
        : 'Tuan1';

      // Load TKB mặc định
      const timetable = await ThoiKhoaBieu.getGrid(MaLop, selectedLoaiTKB, selectedNamHoc, selectedKyHoc);

      // Chuẩn bị thông tin hiển thị cho Phụ huynh (nếu có)
      let studentInfo = null;
      if (user.loaiTaiKhoan === 'Phụ huynh' && user.hoTen && user.maHocSinh) {
        studentInfo = {
          tenHocSinh: user.hoTen.replace(/\(PH của /, '').replace(/\)/, '') || 'Học sinh',
          maHocSinh: user.maHocSinh
        };
      }

      res.render('pages/xemthoikhoabieu', {
        namHocList,
        kyHocList,
        timetable,
        selectedNamHoc,
        selectedKyHoc,
        selectedLoaiTKB,
        selectedNamHocStart,
        userRole: user.loaiTaiKhoan,          // Để EJS biết là Phụ huynh hay Học sinh
        studentInfo,                          // Thông tin học sinh (dành cho phụ huynh)
        statusMessage: ''
      });
    } catch (err) {
      console.error('Lỗi render xem TKB:', err);
      res.status(500).send('Lỗi server khi tải trang xem thời khóa biểu');
    }
  }

  async getKyHocList(req, res) {
    try {
      const { NamHoc } = req.body;
      if (!NamHoc) return res.status(400).json({ error: 'Thiếu năm học' });

      const list = await ThoiKhoaBieu.getKyHocList(NamHoc);
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy danh sách học kỳ' });
    }
  }

  async getAll(req, res) {
    try {
      const user = req.session.user;

      if (!user || 
          (user.loaiTaiKhoan !== 'Học sinh' && user.loaiTaiKhoan !== 'Phụ huynh') || 
          !user.MaLop) {
        return res.status(403).json({ error: 'Không có quyền truy cập.' });
      }

      const MaLop = user.MaLop;
      let { NamHoc, KyHoc, LoaiTKB } = req.body;

      if (!NamHoc || !KyHoc || !LoaiTKB) {
        return res.status(400).json({ error: 'Thiếu tham số bắt buộc' });
      }

      // Không cho chọn trực tiếp 'Chuan' ở giao diện xem, fallback về Tuan1 nếu cần
      if (LoaiTKB === 'Chuan') LoaiTKB = 'Tuan1';

      const kyHocListObj = await ThoiKhoaBieu.getKyHocList(NamHoc);
      const selectedNamHocStart = kyHocListObj.find(k => k.KyHoc === KyHoc)?.NgayBatDau || '2025-08-01';

      const timetable = await ThoiKhoaBieu.getGrid(MaLop, LoaiTKB, NamHoc, KyHoc);

      res.json({ 
        timetable, 
        selectedNamHocStart, 
        statusMessage: 'Đã tải thời khóa biểu' 
      });
    } catch (err) {
      console.error('Lỗi tải TKB:', err);
      res.status(500).json({ error: 'Lỗi server khi tải thời khóa biểu' });
    }
  }
}

module.exports = new XemThoiKhoaBieuController();