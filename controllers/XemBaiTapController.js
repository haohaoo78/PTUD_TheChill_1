const XemBaiTap = require('../models/XemBaiTapModel');

class XemBaiTapController {
  // Render trang xem bài tập
  async renderPage(req, res) {
    try {
      const namHocList = await XemBaiTap.getNamHocList();
      const selectedNamHoc = namHocList[0]?.NamHoc || '';
      
      const kyHocListObj = await XemBaiTap.getKyHocList(selectedNamHoc);
      const kyHocList = kyHocListObj.map(k => k.KyHoc);
      const selectedKyHoc = kyHocList[0] || '';

      const khoiList = await XemBaiTap.getKhoiList();
      const firstKhoi = khoiList[0]?.MaKhoi || '';
      const lopList = await XemBaiTap.getLopListByKhoi(firstKhoi, selectedNamHoc, selectedKyHoc);
      const firstLop = lopList[0]?.MaLop || '';

      const monHocList = await XemBaiTap.getMonHocList();
      const firstMon = monHocList[0]?.TenMonHoc || '';

      res.render('pages/xembaitap', {
        namHocList,
        kyHocList,
        khoiList,
        lopList,
        monHocList,
        baiTapList: [],
        selectedNamHoc,
        selectedKyHoc,
        selectedKhoi: firstKhoi,
        selectedLop: firstLop,
        selectedMonHoc: firstMon,
        statusMessage: ''
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi render trang xem bài tập');
    }
  }

  // Lấy danh sách lớp theo khối + năm học + kỳ học
  async getLopTheoKhoi(req, res) {
    try {
      const { MaKhoi, NamHoc, KyHoc } = req.body;
      if (!MaKhoi || !NamHoc || !KyHoc) return res.json([]);
      
      const lopList = await XemBaiTap.getLopListByKhoi(MaKhoi, NamHoc, KyHoc);
      res.json(lopList);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi truy vấn lớp theo khối' });
    }
  }

  // Lấy danh sách kỳ học theo năm học
  async getKyHocList(req, res) {
    try {
      const { NamHoc } = req.body;
      if (!NamHoc) return res.json([]);
      
      const list = await XemBaiTap.getKyHocList(NamHoc);
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy danh sách học kỳ' });
    }
  }

  // Lấy danh sách bài tập theo điều kiện lọc
  async getBaiTapList(req, res) {
    try {
      const { MaLop, NamHoc, KyHoc, MaMonHoc } = req.body;

      if (!MaLop || !NamHoc || !KyHoc) {
        return res.status(400).json({ error: 'Thiếu thông tin lớp hoặc năm học kỳ' });
      }

      const baiTapList = await XemBaiTap.getBaiTapList(MaLop, NamHoc, KyHoc, MaMonHoc || null);

      res.json({
        baiTapList,
        statusMessage: baiTapList.length > 0 ? 'Đã tải danh sách bài tập' : 'Chưa có bài tập nào'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi tải danh sách bài tập' });
    }
  }

  // Xem chi tiết một bài tập (nếu cần mở modal hoặc tải file)
  async getChiTietBaiTap(req, res) {
    try {
      const { MaBaiTap } = req.body;
      if (!MaBaiTap) return res.status(400).json({ error: 'Thiếu mã bài tập' });

      const chiTiet = await XemBaiTap.getChiTietBaiTap(MaBaiTap);
      if (!chiTiet) return res.json({ error: 'Không tìm thấy bài tập' });

      res.json({ chiTiet });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi khi lấy chi tiết bài tập' });
    }
  }

  // Xóa bài tập (nếu có quyền)
  async deleteBaiTap(req, res) {
    try {
      const { MaBaiTap } = req.body;
      if (!MaBaiTap) return res.status(400).json({ error: 'Thiếu mã bài tập' });

      const result = await XemBaiTap.deleteBaiTap(MaBaiTap);

      if (!result.affectedRows || result.affectedRows === 0) {
        return res.json({ error: 1, message: 'Không tìm thấy bài tập để xóa' });
      }

      res.json({ error: 0, message: 'Đã xóa bài tập thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 1, message: 'Lỗi khi xóa bài tập' });
    }
  }

  // Tải file đính kèm bài tập (nếu có)
  async downloadFile(req, res) {
    try {
      const { MaBaiTap } = req.query;
      if (!MaBaiTap) return res.status(400).send('Thiếu mã bài tập');

      const fileInfo = await XemBaiTap.getFileDinhKem(MaBaiTap);
      if (!fileInfo || !fileInfo.FilePath) {
        return res.status(404).send('Không tìm thấy file đính kèm');
      }

      res.download(fileInfo.FilePath, fileInfo.TenFileGoc || 'baitap_file');
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi tải file bài tập');
    }
  }
}

module.exports = new XemBaiTapController();