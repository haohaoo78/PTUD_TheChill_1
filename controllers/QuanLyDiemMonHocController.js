const QuanLyDiemMonHocModel = require('../models/QuanLyDiemMonHocModel');

// Controller cho chức năng quản lý điểm môn học
class QuanLyDiemMonHocController {
  async renderClassList(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).send('Chưa đăng nhập');

      const namHoc = await QuanLyDiemMonHocModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).send('Không tìm thấy năm học đang học');

      // Lưu năm học để dùng các bước sau
      req.session.qldmNamHoc = namHoc;

      const classList = await QuanLyDiemMonHocModel.getClassesByTeacher(maGV, namHoc);
      res.render('pages/qldm_danhsachlop', { classList, namHoc });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server khi tải danh sách lớp');
    }
  }

  async renderStudentList(req, res) {
    const sessionNamHoc = req.session?.qldmNamHoc || '';
    const namHoc = req.query?.namHoc || sessionNamHoc;
    const hocKy = req.query?.hocKy || (namHoc ? await QuanLyDiemMonHocModel.getCurrentHocKy(namHoc) : '');
    const mode = req.query?.mode === 'edit' ? 'edit' : 'add';
    res.render('pages/qldm_danhsachhocsinh', {
      selectedClass: req.query?.maLop || '',
      selectedClassName: req.query?.tenLop || '',
      selectedNamHoc: namHoc || '',
      selectedHocKy: hocKy || '',
      mode,
      students: []
    });
  }

  renderRequestEdit(req, res) {
    res.render('pages/qldm_xinsuadiem', {
      maLop: req.query?.maLop || '',
      tenLop: req.query?.tenLop || ''
    });
  }

  // API: trả danh sách lớp theo GV và năm học đang học
  async getClasses(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const namHoc = await QuanLyDiemMonHocModel.getCurrentNamHoc();
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      req.session.qldmNamHoc = namHoc;

      const classList = await QuanLyDiemMonHocModel.getClassesByTeacher(maGV, namHoc);
      res.json({ success: true, namHoc, classList });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp' });
    }
  }

  // API: lấy danh sách học sinh theo lớp và năm học (đã lưu trong session)
  async getStudents(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { maLop } = req.query;
      if (!maLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });

      const namHoc = req.session?.qldmNamHoc || (await QuanLyDiemMonHocModel.getCurrentNamHoc());
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const hocKy = await QuanLyDiemMonHocModel.getCurrentHocKy(namHoc);
      const tenMonHoc = await QuanLyDiemMonHocModel.getSubjectByTeacherClass(maGV, maLop, namHoc, hocKy);
      if (!tenMonHoc) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy môn học được phân công cho lớp này' });
      }

      const students = await QuanLyDiemMonHocModel.getStudentsByClassWithScores(maLop, namHoc, hocKy, tenMonHoc);

      res.json({ success: true, namHoc, hocKy, tenMonHoc, students, maLop });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách học sinh' });
    }
  }

  // API: lưu điểm (insert/update theo MaHocSinh + TenMonHoc + NamHoc + HocKi)
  async saveScores(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maLop, scores, mode } = req.body || {};
      if (!maLop) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });
      if (!Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({ success: false, message: 'Chưa có dữ liệu điểm để lưu' });
      }

      const namHoc = req.session?.qldmNamHoc || (await QuanLyDiemMonHocModel.getCurrentNamHoc());
      if (!namHoc) return res.status(400).json({ success: false, message: 'Không tìm thấy năm học đang học' });

      const hocKy = await QuanLyDiemMonHocModel.getCurrentHocKy(namHoc);
      const tenMonHoc = await QuanLyDiemMonHocModel.getSubjectByTeacherClass(maGV, maLop, namHoc, hocKy);
      if (!tenMonHoc) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy môn học được phân công cho lớp này' });
      }

      const normalize = value => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0 || num > 10) return NaN;
        return num;
      };

      const prepared = [];
      for (const raw of scores) {
        const maHocSinh = raw?.maHocSinh;
        if (!maHocSinh) continue;

        const item = { maHocSinh };
        const fields = ['ThuongXuyen1', 'ThuongXuyen2', 'ThuongXuyen3', 'Diem15_1', 'Diem15_2', 'GK', 'CK'];
        for (const f of fields) {
          const v = normalize(raw[f]);
          if (Number.isNaN(v)) return res.status(400).json({ success: false, message: 'Điểm phải nằm trong khoảng 0 đến 10' });
          item[f] = v;
        }
        prepared.push(item);
      }

      if (prepared.length === 0) {
        return res.status(400).json({ success: false, message: 'Chưa có dữ liệu điểm hợp lệ để lưu' });
      }

      const actionMode = mode === 'edit' ? 'edit' : 'add';
      if (actionMode === 'add') {
        const processed = await QuanLyDiemMonHocModel.supplementScoresBulk({
          tenMonHoc,
          namHoc,
          hocKi: hocKy,
          scores: prepared
        });
        return res.json({ success: true, message: 'Cập nhật thêm điểm thành công', processed });
      }

      const processed = await QuanLyDiemMonHocModel.upsertScoresBulk({
        tenMonHoc,
        namHoc,
        hocKi: hocKy,
        scores: prepared
      });

      res.json({ success: true, message: 'Lưu điểm thành công', processed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lưu điểm' });
    }
  }

  // API: lấy điểm cũ theo học sinh + loại điểm (đúng theo CSDL)
  async getOldScore(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maHocSinh, maLop, loaiDiem } = req.query || {};
      if (!maHocSinh || !maLop || !loaiDiem) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      }

      const hk = await QuanLyDiemMonHocModel.getCurrentNamHocKyHoc();
      if (!hk?.NamHoc || !hk?.KyHoc) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy học kỳ đang học' });
      }

      const mon = await QuanLyDiemMonHocModel.getSubjectByTeacherClass(maGV, maLop, hk.NamHoc, hk.KyHoc);
      if (!mon) return res.status(400).json({ success: false, message: 'Không tìm thấy môn học' });

      const diemCu = await QuanLyDiemMonHocModel.getOldScoreByType({
        maHocSinh,
        tenMonHoc: mon,
        namHoc: hk.NamHoc,
        hocKi: hk.KyHoc,
        loaiDiem
      });

      res.json({ success: true, diemCu: diemCu ?? null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy điểm cũ' });
    }
  }

  // API: gửi yêu cầu sửa điểm (có upload minh chứng)
  async submitRequestEdit(req, res) {
    try {
      const maGV = req.session?.user?.username;
      if (!maGV) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const { maHocSinh, maLop, loaiDiem, diemCu, diemMoi, lyDo } = req.body || {};

      // DiemMoi được phép trống, còn lại bắt buộc
      if (!maHocSinh || !maLop || !loaiDiem || (diemCu === undefined || diemCu === null || diemCu === '') || !lyDo) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ nội dung trước khi gửi yêu cầu sửa điểm' });
      }

      const minhChungFile = req.file;
      if (!minhChungFile?.filename) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn minh chứng trước khi gửi yêu cầu sửa điểm' });
      }

      // 1) MaMon từ gvbomon theo MaGVBM (session) + MaLop + NamHoc/HocKy hiện tại
      // 2) NamHoc/KyHoc đang học
      const hk = await QuanLyDiemMonHocModel.getCurrentNamHocKyHoc();
      if (!hk?.NamHoc || !hk?.KyHoc) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy học kỳ đang học' });
      }
      const mon = await QuanLyDiemMonHocModel.getSubjectByTeacherClass(maGV, maLop, hk.NamHoc, hk.KyHoc);
      if (!mon) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy môn học được phân công cho lớp này' });
      }

      // 3) MaTruong từ GiaoVien -> MaHieuTruong từ HieuTruong
      const maTruong = await QuanLyDiemMonHocModel.getTeacherSchoolId(maGV);
      if (!maTruong) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy mã trường của giáo viên' });
      }
      const maHieuTruong = await QuanLyDiemMonHocModel.getPrincipalIdBySchoolId(maTruong);
      if (!maHieuTruong) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy mã hiệu trưởng của trường' });
      }

      // 6) MaYeuCau tự tăng
      const maYeuCau = await QuanLyDiemMonHocModel.getNextRequestId();

      const parseScore = v => {
        if (v === undefined || v === null || v === '') return null;
        const num = Number(v);
        if (!Number.isFinite(num) || num < 0 || num > 10) return NaN;
        return num;
      };

      const diemCuNum = parseScore(diemCu);
      if (Number.isNaN(diemCuNum)) return res.status(400).json({ success: false, message: 'Điểm cũ không hợp lệ' });
      const diemMoiNum = parseScore(diemMoi);
      if (Number.isNaN(diemMoiNum)) return res.status(400).json({ success: false, message: 'Điểm mới không hợp lệ' });

      await QuanLyDiemMonHocModel.insertYeuCauSuaDiem({
        maYeuCau,
        maHocSinh,
        mon,
        namHoc: hk.NamHoc,
        hocKi: hk.KyHoc,
        loaiDiem,
        diemCu: diemCuNum,
        diemMoi: diemMoiNum,
        lyDo,
        minhChung: minhChungFile.filename,
        maHieuTruong,
        maGiaoVien: maGV
      });

      res.json({ success: true, message: 'Gửi yêu cầu sửa điểm thành công', maYeuCau });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server khi gửi yêu cầu sửa điểm' });
    }
  }
}

module.exports = new QuanLyDiemMonHocController();